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
