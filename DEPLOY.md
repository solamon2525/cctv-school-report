# คู่มือ Deploy ระบบรายงานเวร CCTV
## บ้านคำไผ่ & บ้านหินเหลิ่ง

---

## ขั้นตอนที่ 1 — สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com
2. คลิก **"Add project"** → ตั้งชื่อ เช่น `cctv-kamphai-group`
3. เปิดใช้งาน **Google Analytics** (ไม่บังคับ) → **Create project**
4. รอจนเสร็จ → **Continue**

---

## ขั้นตอนที่ 2 — เปิดใช้บริการ Firebase

### 2.1 Firestore Database
- ซ้ายมือ: **Firestore Database** → **Create database**
- เลือก **Start in production mode** → Next
- เลือก region: **asia-southeast1 (Singapore)** → Enable

### 2.2 Storage (สำหรับโลโก้)
- ซ้ายมือ: **Storage** → **Get started**
- เลือก **Start in production mode** → Next
- Region: **asia-southeast1** → Done

### 2.3 Authentication
- ซ้ายมือ: **Authentication** → **Get started**
- แท็บ **Sign-in method** → เปิด **Anonymous** → Save

---

## ขั้นตอนที่ 3 — ดึง Firebase Config

- Project Settings (⚙️ ด้านบน) → **General** → เลื่อนลงหา **"Your apps"**
- คลิก **</>** (Web) → App nickname: `cctv-web` → **Register app**
- คัดลอก config ที่ได้:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "cctv-kamphai-group.firebaseapp.com",
  projectId: "cctv-kamphai-group",
  storageBucket: "cctv-kamphai-group.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

- แก้ไขไฟล์ `src/lib/firebase.ts` ใส่ค่า config จริง

---

## ขั้นตอนที่ 4 — สร้าง GitHub Repository

```bash
# สร้าง repo ใหม่ใน GitHub แล้วรัน:
git init
git add .
git commit -m "Initial commit: CCTV duty report system"
git remote add origin https://github.com/YOUR_USERNAME/cctv-duty-report.git
git push -u origin main
```

---

## ขั้นตอนที่ 5 — ตั้งค่า GitHub Secrets

ไปที่ GitHub Repository → **Settings** → **Secrets and variables** → **Actions**

เพิ่ม secrets ต่อไปนี้:

| Secret Name | ค่า (จาก Firebase Config) |
|---|---|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `VITE_FIREBASE_APP_ID` | appId |
| `FIREBASE_SERVICE_ACCOUNT` | Service Account JSON (ดูขั้นตอนถัดไป) |

### วิธีสร้าง Service Account
1. Firebase Console → Project Settings → **Service accounts**
2. คลิก **Generate new private key** → Download JSON
3. คัดลอกเนื้อหาทั้งหมดใส่ใน secret `FIREBASE_SERVICE_ACCOUNT`

---

## ขั้นตอนที่ 6 — อัพเดต .firebaserc

แก้ไขไฟล์ `.firebaserc`:
```json
{
  "projects": {
    "default": "cctv-kamphai-group"
  }
}
```

---

## ขั้นตอนที่ 7 — Deploy ครั้งแรก (Manual)

```bash
npm install
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

---

## ขั้นตอนที่ 8 — Auto Deploy (หลังจากนี้)

**ทุกครั้งที่ push ไป `main` branch → GitHub Actions จะ build + deploy อัตโนมัติ**

```bash
git add .
git commit -m "อัพเดตระบบ"
git push
# รอประมาณ 2-3 นาที → เว็บ deploy อัตโนมัติ
```

---

## URL หลังจาก Deploy

```
https://YOUR_PROJECT_ID.web.app
# หรือ custom domain ที่ตั้งเองได้ใน Firebase Hosting
```

---

## ขั้นตอนต่อไป (ถ้าต้องการ sync Firestore)

ปัจจุบันระบบใช้ **localStorage** (ข้อมูลอยู่ในเครื่องเดียว)
ไฟล์ `src/lib/firebase.ts` เตรียมไว้แล้ว — ต้องเปลี่ยน store.ts ให้เรียก Firebase แทน localStorage

```bash
# ติดตั้ง Firebase SDK
npm install firebase
```

แล้วแทนที่ `load()` / `save()` ใน store.ts ด้วยฟังก์ชันจาก firebase.ts

---

## สรุป Tech Stack

| ส่วน | Technology |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Build | Vite |
| Database (ปัจจุบัน) | localStorage |
| Database (online) | Firebase Firestore |
| รูปภาพ/โลโก้ | Firebase Storage |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |
