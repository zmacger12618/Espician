# Espician - Esports MOBA Management Simulator (2026 Web Edition)

เกมจำลองการบริหารจัดการสโมสรอีสปอร์ต MOBA สมัยใหม่ระดับ AAA ทำงานบนเว็บเบราว์เซอร์ พร้อมระบบจำลองการแข่งขัน 2D Canvas แบบเรียลไทม์ และระบบจับคู่แข่งขันผ่านวง LAN ภายในบ้านหรือออฟฟิศ

---

## 🚀 วิธีติดตั้งและรันเกมบนเครื่องใหม่ (Quick Start for Another Machine)

### 1. คัดลอกโปรเจกต์ (Clone)
```bash
git clone https://github.com/zmacger12618/Espician.git
cd Espician/Espician
```

### 2. ติดตั้ง Dependencies
ตรวจสอบว่าเครื่องใหม่ติดตั้ง [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป) แล้วรันคำสั่ง:
```bash
npm install
```

### 3. เริ่มรันระบบเกม
- **เปิดตัวเกม Web Simulator (Frontend):**
  ```bash
  npm run dev
  ```
  เข้าเล่นผ่านเบราว์เซอร์ที่: `http://localhost:3000` (หรือผ่าน IP วง LAN เช่น `http://192.168.x.x:3000`)

- **เปิดเซิร์ฟเวอร์ LAN Multi-player (WebSocket Relay):**
  ```bash
  npm run server
  ```
  พอร์ตเซิร์ฟเวอร์จะเปิดที่: `ws://0.0.0.0:3001`

---

## 🌟 ฟีเจอร์หลักในเวอร์ชัน 2026
1. **Google Login & Onboarding:** ล็อกอินเข้าสโมสร พร้อมเข้าสู่ Interactive Tutorial Match บังคับชนะ 100%
2. **Starter Squad Pack:** ปลดล็อก 5 การ์ดตัวจริงหลังจบคอร์สฝึกสอน โดยค่าพลังรบ (CP) ถูกปรับสมดุลเริ่มต้นที่ 58–74 CP
3. **2D Canvas Simulation:** สนามแข่ง 3 เลน, หลุมมังกร, หลุมบารอน, อนิเมชันคลื่นกระแทกสกิล, และสกอร์บอร์ดเปรียบเทียบ Gold Difference สไตล์ LCK
4. **40 Champions & Meta Ecosystem:** ฐานข้อมูล 40 แชมเปี้ยน 5 สกิล (P, Q, W, E, R), ระบบแพ้ทาง-ชนะทาง, ไอเทมออกในเกม 10 ชิ้น, และระบบจำลองอัปเดตแพตช์เกม
5. **RPG Gear +5 & Coaching Staff:** ระบบตีบวกอุปกรณ์เมาส์/คีย์บอร์ด + โค้ชเสริมบัฟ และระบบฝึกซ้อมแบบลดหลั่นผลตอบแทน (Diminishing Returns)
6. **Dark & Light Mode:** สลับธีมมืด (Obsidian) และสว่าง (Cyber Arena White) ได้ตลอดเวลา
7. **Online LAN Play:** แชร์ลิงก์และ Room Code ให้เพื่อนร่วมวง Wi-Fi เดียวกันเล่นได้ทันที
