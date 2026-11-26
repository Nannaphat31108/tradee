-- Thai language support: per-language FAQs and Thai stat labels. Safe to run more than once.
BEGIN;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'en';
ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS label_th TEXT;

UPDATE site_stats SET label_th = CASE label
  WHEN 'Paid to traders' THEN 'จ่ายให้เทรดเดอร์แล้ว'
  WHEN 'Traders' THEN 'เทรดเดอร์'
  WHEN 'Countries' THEN 'ประเทศ'
  WHEN 'Established' THEN 'ก่อตั้ง'
  ELSE label_th END
WHERE label_th IS NULL;

INSERT INTO faqs (page, lang, question, answer, sort_order)
SELECT 'pay-after-pass', 'th', v.q, v.a, v.o FROM (VALUES
  ('Pay After Pass ทำงานอย่างไร?', 'จ่ายค่าสมัครเล็กน้อยเพื่อเริ่มการประเมินแบบ 1 ขั้นตอน ค่าเปิดใช้งานจะเรียกเก็บหลังจากคุณผ่านและเลือกเปิดใช้งานบัญชี Master เท่านั้น', 1),
  ('มีเงื่อนไขแอบแฝงไหม?', 'ไม่มี กฎเหมือนกับการทดสอบ 1 ขั้นตอนแบบปกติทุกอย่าง แค่คุณจ่ายส่วนใหญ่หลังจากพิสูจน์ฝีมือแล้ว', 2),
  ('ถ้าไม่ผ่านจะเป็นอย่างไร?', 'คุณไม่ต้องจ่ายค่าเปิดใช้งานเลย ค่าใช้จ่ายมีแค่ค่าสมัครครั้งแรกเท่านั้น', 3),
  ('ค่าเปิดใช้งานเรียกเก็บตอนไหน?', 'ตอนที่คุณเปิดใช้งานบัญชี Master หลังผ่านการประเมิน ไม่ใช่ก่อนหน้านั้น', 4),
  ('เป็นบัญชี Master แบบเดียวกับการทดสอบปกติไหม?', 'ใช่ บัญชีเดียวกัน กฎเดียวกัน และส่วนแบ่งรางวัลเท่ากัน', 5),
  ('เงินของฉันมีความเสี่ยงไหม?', 'ไม่มี ทุกบัญชีเป็นบัญชีเดโมจำลอง เงินที่คุณจ่ายมีแค่ค่าธรรมเนียมเท่านั้น', 6),
  ('มีกำหนดเวลาไหม?', 'ไม่มี ใช้เวลาได้เท่าที่ต้องการจนกว่าจะถึงเป้ากำไร', 7),
  ('ยืนยันตัวตน (KYC) และทำสัญญาเมื่อไร?', 'ทำครั้งเดียว ก่อนรับรางวัลครั้งแรก', 8)
) AS v(q, a, o)
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE lang = 'th' AND page = 'pay-after-pass');
COMMIT;
