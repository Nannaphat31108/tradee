// Lightweight i18n: the Thai page (/th) reuses index.html; static text is swapped by exact match,
// dynamic text uses t(key).
window.LANG = location.pathname.replace(/\/+$/, '') === '/th' ? 'th' : 'en';

const STATIC_TH = {
  'Products': 'ผลิตภัณฑ์', 'Trading': 'การเทรด', 'Learn': 'เรียนรู้', 'Tournaments': 'ทัวร์นาเมนต์', 'Company': 'บริษัท',
  'Trading Challenges': 'การทดสอบเทรด', 'Instant Funding': 'รับทุนทันที', 'How It Works': 'วิธีการทำงาน',
  'Our Rules': 'กฎของเรา', 'Pricing &amp; Plans': 'ราคาและแพ็กเกจ', 'Rewards': 'รางวัล', 'Live Chart': 'กราฟสด', 'Platforms': 'แพลตฟอร์ม',
  'Blog': 'บทความ', 'Videos': 'วิดีโอ', 'Coaching': 'โค้ชชิ่ง', 'Events': 'กิจกรรม',
  'All Tournaments': 'ทัวร์นาเมนต์ทั้งหมด', 'How to Win': 'วิธีชนะ',
  'About Us': 'เกี่ยวกับเรา', 'Contact': 'ติดต่อเรา', 'Affiliate Program': 'โปรแกรมพันธมิตร', 'Log In': 'เข้าสู่ระบบ',
  'Get started': 'เริ่มต้นใช้งาน',
  'Products <span>·</span> 1-Step Challenge': 'ผลิตภัณฑ์ <span>·</span> การทดสอบ 1 ขั้นตอน',
  'Pay After <span class="grad">Pass</span>': 'ผ่านก่อน <span class="grad">จ่ายทีหลัง</span>',
  'Start a 1-step challenge for a small entry fee. The activation fee is charged only after you pass.':
    'เริ่มการทดสอบ 1 ขั้นตอนด้วยค่าสมัครเพียงเล็กน้อย ค่าเปิดใช้งานจะเรียกเก็บหลังจากคุณสอบผ่านแล้วเท่านั้น',
  'Start Trading': 'เริ่มเทรดเลย', 'See how it works': 'ดูวิธีการทำงาน',
  'PAY AFTER<br>PASS': 'ผ่านก่อน<br>จ่ายทีหลัง',
  'Trade on MT5': 'เทรดบน MT5', 'No time limit': 'ไม่จำกัดเวลา', 'Single phase': 'ขั้นตอนเดียว',
  'Card &amp; crypto': 'บัตรและคริปโต', 'Pay your way': 'จ่ายได้หลายช่องทาง',
  'Real trader payouts': 'ยอดจ่ายจริงให้เทรดเดอร์', 'View all rewards →': 'ดูรางวัลทั้งหมด →',
  'Pay a little to start.<br><span class="muted">Pay the rest only once you pass.</span>':
    'จ่ายนิดเดียวเพื่อเริ่ม<br><span class="muted">ส่วนที่เหลือจ่ายเมื่อสอบผ่านเท่านั้น</span>',
  "Why pay full price for an account you haven't earned yet?": 'ทำไมต้องจ่ายเต็มราคาสำหรับบัญชีที่คุณยังไม่ได้พิสูจน์ฝีมือ?',
  'Pay the entry fee': 'จ่ายค่าสมัคร', 'A small fee unlocks your 1-step evaluation.': 'ค่าธรรมเนียมเล็กน้อยเพื่อเริ่มการประเมิน 1 ขั้นตอน',
  'Pass the challenge': 'ผ่านการทดสอบ', 'Hit the profit target in one phase — no time limit.': 'ทำกำไรถึงเป้าในขั้นตอนเดียว ไม่จำกัดเวลา',
  'Pay only after you pass': 'จ่ายหลังสอบผ่านเท่านั้น',
  'The activation fee is charged when you activate your Master account.': 'ค่าเปิดใช้งานจะเรียกเก็บเมื่อคุณเปิดใช้บัญชี Master',
  'Trade &amp; get rewarded': 'เทรดและรับรางวัล',
  'Your Master account goes live; request rewards from your dashboard.': 'บัญชี Master พร้อมใช้งาน ขอรับรางวัลได้จากแดชบอร์ด',
  "Don't pass? You never pay the activation fee. The entry fee is your only cost.":
    'ไม่ผ่าน? คุณไม่ต้องจ่ายค่าเปิดใช้งานเลย ค่าใช้จ่ายมีแค่ค่าสมัครเท่านั้น',
  'Trader-first rules on every account': 'กฎที่เป็นมิตรกับเทรดเดอร์ทุกบัญชี',
  'Same evaluation terms at every account size.': 'เงื่อนไขการประเมินเหมือนกันทุกขนาดบัญชี',
  'Pick your size. Start today.': 'เลือกขนาดบัญชี เริ่มได้วันนี้',
  'Both prices shown up front. Pay by card or crypto.': 'แสดงราคาทั้งสองส่วนชัดเจน ชำระด้วยบัตรหรือคริปโต',
  'Market': 'ตลาด', 'Plan': 'แพ็กเกจ', 'Account size': 'ขนาดบัญชี', 'Entry fee': 'ค่าสมัคร', 'Activation (after pass)': 'ค่าเปิดใช้งาน (หลังผ่าน)',
  'Where a promotion is running, the struck-through figure is the regular price. One-time fee.':
    'ช่วงโปรโมชั่น ราคาที่ขีดฆ่าคือราคาปกติ ชำระครั้งเดียว',
  'Same fast track.<br><span class="muted">Far less to risk upfront.</span>': 'เส้นทางเร็วเหมือนเดิม<br><span class="muted">แต่เสี่ยงจ่ายล่วงหน้าน้อยกว่ามาก</span>',
  "Both paths lead to the same Master account through a single phase. Only Pay After Pass lets you hold the activation fee until you've passed.":
    'ทั้งสองแบบพาคุณไปสู่บัญชี Master เดียวกันในขั้นตอนเดียว แต่มีเพียง Pay After Pass ที่ให้คุณเก็บค่าเปิดใช้งานไว้จนกว่าจะสอบผ่าน',
  'Standard 1-Step': 'แบบ 1 ขั้นตอนปกติ', 'Full fee up front': 'จ่ายเต็มจำนวนล่วงหน้า', 'Same Master account': 'บัญชี Master เดียวกัน',
  'Small entry fee': 'ค่าสมัครเล็กน้อย', 'Activation only after you pass': 'จ่ายค่าเปิดใช้งานหลังผ่านเท่านั้น',
  'Live markets': 'ตลาดสด',
  'Trade today.<br><span class="grad">Keep the lion\'s share.</span>': 'เทรดวันนี้<br><span class="grad">รับส่วนแบ่งก้อนใหญ่</span>',
  'After you pass, request rewards straight from your dashboard.': 'เมื่อสอบผ่าน ขอรับรางวัลได้โดยตรงจากแดชบอร์ด',
  'Video Testimonials': 'รีวิวจากเทรดเดอร์', 'Hear from traders who made it through.': 'ฟังเสียงจากเทรดเดอร์ที่ผ่านมาแล้ว',
  'Frequently asked questions': 'คำถามที่พบบ่อย',
  'Start trading.<br>Pay after you pass.': 'เริ่มเทรดเลย<br>สอบผ่านแล้วค่อยจ่าย',
  'A small fee gets you in.': 'ค่าสมัครเล็กน้อยก็เริ่มได้แล้ว',
  'Rewards &amp; Testimonials': 'รางวัลและรีวิว', 'Forex': 'ฟอเร็กซ์', 'Trading Instruments': 'สินทรัพย์ที่เทรดได้',
  'Trading Platforms': 'แพลตฟอร์มเทรด', 'Help Center': 'ศูนย์ช่วยเหลือ',
  'Terms &amp; Conditions': 'ข้อกำหนดและเงื่อนไข', 'Privacy Policy': 'นโยบายความเป็นส่วนตัว', 'Common Questions': 'คำถามทั่วไป', 'Press Kit': 'ข้อมูลสื่อ',
  "All accounts are simulated demo accounts using virtual funds. Tradee does not accept customer deposits. Rewards are discretionary and not guaranteed. [Replace with your company's legal disclaimer, address and restricted-country list.]":
    'ทุกบัญชีเป็นบัญชีเดโมจำลองที่ใช้เงินเสมือน Tradee ไม่รับฝากเงินจากลูกค้า การจ่ายรางวัลขึ้นอยู่กับดุลยพินิจและไม่รับประกัน [แทนที่ด้วยข้อจำกัดความรับผิดชอบ ที่อยู่บริษัท และรายชื่อประเทศที่ไม่ให้บริการ]',
  'No candles yet — start the MT5 bridge.': 'ยังไม่มีข้อมูลกราฟ',
  'from <b id="heroPrice">$9</b>': 'เริ่มต้น <b id="heroPrice">$9</b>',
  '© <span id="yr"></span> Tradee. All rights reserved.': '© <span id="yr"></span> Tradee สงวนลิขสิทธิ์',
};

const DYNAMIC = {
  en: {
    paid: 'Paid', viewCert: 'View certificate', sample: 'SAMPLE', phase: 'Phase', profitTarget: 'Profit target',
    dailyLoss: 'Max daily loss', drawdown: 'Max drawdown', split: 'Reward split', upTo: 'Up to', timeLimit: 'Time limit',
    none: 'None', days: 'days', payToday: 'Pay today (entry fee)', payAfter: 'Pay after you pass (activation)',
    startSize: (k) => `Start ${k} Challenge`, start: 'Start', bid: 'Bid', ask: 'Ask',
    simulated: 'Simulated data — live MT5 feed not connected yet',
  },
  th: {
    paid: 'จ่ายแล้ว', viewCert: 'ดูใบรับรอง', sample: 'ตัวอย่าง', phase: 'ขั้นตอน', profitTarget: 'เป้ากำไร',
    dailyLoss: 'ขาดทุนสูงสุดต่อวัน', drawdown: 'ขาดทุนสูงสุดรวม', split: 'ส่วนแบ่งรางวัล', upTo: 'สูงสุด', timeLimit: 'กำหนดเวลา',
    none: 'ไม่จำกัด', days: 'วัน', payToday: 'จ่ายวันนี้ (ค่าสมัคร)', payAfter: 'จ่ายหลังผ่าน (ค่าเปิดใช้งาน)',
    startSize: (k) => `เริ่มบัญชี ${k}`, start: 'เริ่ม', bid: 'ราคาเสนอซื้อ', ask: 'ราคาเสนอขาย',
    simulated: 'ข้อมูลจำลอง — ยังไม่ได้เชื่อมราคาจริงจาก MT5',
  },
};
window.t = (k, ...a) => { const v = DYNAMIC[window.LANG][k] ?? DYNAMIC.en[k]; return typeof v === 'function' ? v(...a) : v; };

(function applyStatic() {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const langBtn = document.querySelector('.lang');
  if (langBtn) {
    langBtn.textContent = window.LANG === 'th' ? 'EN' : 'TH';
    langBtn.title = window.LANG === 'th' ? 'English' : 'ภาษาไทย';
    langBtn.onclick = () => { location.href = (window.LANG === 'th' ? '/' : '/th') + location.hash; };
  }
  if (window.LANG !== 'th') return;
  document.documentElement.lang = 'th';
  document.title = 'ผ่านก่อน จ่ายทีหลัง — Tradee';
  const map = new Map(Object.entries(STATIC_TH).map(([k, v]) => [norm(k), v]));
  document.querySelectorAll('h1,h2,h3,h4,h5,p,a,button,th,small,b,li,div,span').forEach((el) => {
    const v = map.get(norm(el.innerHTML));
    if (v !== undefined) el.innerHTML = v;
  });
})();
