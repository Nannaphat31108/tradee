# Tradee — Pay After Pass landing page + MT5 data

หน้าเว็บโครงสร้างแบบ prop firm "Pay After Pass" (header → hero → stats → payouts carousel → how it works →
rules → pricing → comparison → live MT5 chart → get paid → video testimonials → FAQ → CTA → footer)
พร้อมฐานข้อมูล PostgreSQL และตัวเชื่อม MetaTrader 5 สำหรับดึงกราฟ

## โครงสร้างโปรเจกต์
```
database/schema.sql   ตารางทั้งหมด (users, plans, plan_sizes, orders, trading_accounts, payouts,
                      faqs, testimonials, site_stats, symbols, candles, ticks_latest,
                      account_snapshots, deals)
database/seed.sql     ข้อมูลตั้งต้น (ราคา $25K/$50K/$100K/$200K, FAQ, ตัวอย่าง payout)
server/               Express API (Node 18+)
public/               หน้าเว็บ (HTML/CSS/JS + TradingView Lightweight Charts)
mt5_bridge/bridge.py  สคริปต์ Python ดึงแท่งเทียน/ราคาจาก MT5 แล้วส่งเข้า API
mt5_bridge/demo_feed.py  สร้างข้อมูลปลอมไว้ทดสอบกราฟโดยไม่ต้องมี MT5
```

## เริ่มใช้งาน
```bash
cp .env.example .env          # ใส่ DATABASE_URL (ใช้ Supabase ได้) และ BRIDGE_API_KEY
npm install
npm run db:init               # สร้างตาราง + seed
npm start                     # http://localhost:3000
```

## Supabase
ฐานข้อมูลอยู่ในโปรเจกต์ Supabase `bgdjrviiqukpqbchefre` (Singapore) สร้างตารางและ seed แล้ว
- server ต่อผ่าน role `tradee_app` (สิทธิ์เฉพาะตาราง Tradee, แตะตารางอื่นในโปรเจกต์ไม่ได้)
- ตาราง Tradee เปิด RLS และถอนสิทธิ์ `anon`/`authenticated` แล้ว (ดู `database/supabase_security.sql`)
  จึงอ่านผ่าน Supabase REST API ด้วย anon key ไม่ได้ ข้อมูลออกทาง Node API เท่านั้น
- `DATABASE_URL` ใช้ Session pooler:
  `postgresql://tradee_app.bgdjrviiqukpqbchefre:<รหัส>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
- ลืมรหัส: Supabase → SQL Editor → `ALTER ROLE tradee_app PASSWORD 'รหัสใหม่';`

## MT5 ทำงานยังไง
```
MetaTrader 5 (Windows) ──Python MetaTrader5 lib──▶ bridge.py ──HTTPS POST + X-Bridge-Key──▶ Node API ──▶ Supabase (candles, ticks_latest)
                                                                                         ▲
                                                           หน้าเว็บ (กราฟ) ──GET /api/candles ทุก 5 วิ──┘
```
- MT5 ไม่มี API บนเว็บ ต้องใช้ไลบรารี Python `MetaTrader5` ซึ่งคุยกับโปรแกรม MT5 ที่เปิดอยู่บน Windows เท่านั้น
- bridge.py: `copy_rates_from_pos` ดึงแท่งเทียน, `symbol_info_tick` ดึง bid/ask แล้วส่งให้ API บันทึก (upsert ไม่ซ้ำ)
- Windows เครื่องนั้นต้องเปิด MT5 ค้างไว้ตลอด แนะนำ Windows VPS
- ถ้า API อยู่คนละเครื่อง ให้ตั้ง `TRADEE_API` เป็น URL จริง (https) และใช้ `BRIDGE_API_KEY` ตัวเดียวกันทั้งสองฝั่ง

## เชื่อม MT5 (ต้องรันบน Windows ที่ติดตั้ง MetaTrader 5)
```bash
cd mt5_bridge
pip install -r requirements.txt
copy .env.example .env        # TRADEE_API, BRIDGE_API_KEY (ต้องตรงกับฝั่ง server), SYMBOLS, TIMEFRAMES
python bridge.py
```
bridge จะ backfill ย้อนหลัง `HISTORY_BARS` แท่ง แล้วอัปเดตทุก `POLL_SECONDS` วินาที
หน้าเว็บ poll `/api/candles` ทุก 5 วินาทีเพื่ออัปเดตกราฟ

## API
| Method | Path | หมายเหตุ |
|---|---|---|
| GET | `/api/plans/pay-after-pass` | แผน + ขนาดบัญชี/ราคา |
| GET | `/api/stats`, `/api/payouts`, `/api/testimonials`, `/api/faqs` | เนื้อหาหน้าเว็บ |
| GET | `/api/symbols` | รายการ symbol + bid/ask ล่าสุด |
| GET | `/api/candles?symbol=EURUSD&timeframe=H1&limit=500` | OHLCV สำหรับกราฟ |
| POST | `/api/mt5/candles` | ต้องมี header `X-Bridge-Key` (upsert แท่งเทียน) |
| POST | `/api/mt5/ticks` | ต้องมี header `X-Bridge-Key` |

## ต้องแก้ก่อนเปิดจริง
- ค่ากฎ (profit target 10%, daily loss 4%, drawdown 6%, split 80%) และ activation fee ใน `seed.sql` เป็นค่าตัวอย่าง
- payouts / testimonials ที่ `is_sample = true` เป็นข้อมูลตัวอย่าง (มีป้าย SAMPLE บนหน้าเว็บ) ให้แทนด้วยข้อมูลจริง
- site_stats, disclaimer, ที่อยู่บริษัท, ลิงก์ social ใน footer
- ยังไม่มีระบบสมัคร/ล็อกอิน/ชำระเงิน (ตารางรองรับไว้แล้ว: users, orders, trading_accounts)

## Deploy บน Render
1. render.com → **New → Blueprint** → เลือก repo `tradee` (branch ที่มีไฟล์ `render.yaml`)
2. กรอก `DATABASE_URL` และ `BRIDGE_API_KEY` (ค่าเดียวกับในไฟล์ `.env`) → **Apply**
3. ได้ URL เช่น `https://tradee.onrender.com` → ใส่เป็น `TRADEE_API` ใน `mt5_bridge/.env` บนเครื่อง Windows
- แพลนฟรีจะหลับเมื่อไม่มีคนเข้า 15 นาที (ปลุกใช้ ~30-60 วิ) ถ้า bridge ส่งข้อมูลตลอดจะไม่หลับ
- push โค้ดใหม่เข้า branch นั้น Render จะ deploy ให้อัตโนมัติ
