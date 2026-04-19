# ระบบรายงานเวร CCTV สำหรับโรงเรียน

## คำอธิบายโปรเจกต์
โปรเจกต์นี้คือระบบรายงานเวรกล้องวงจรปิด (CCTV) ที่พัฒนาขึ้นเพื่อช่วยให้โรงเรียนสามารถจัดการและติดตามสถานะการทำงานของกล้องวงจรปิดได้อย่างมีประสิทธิภาพ โดยมีหน้าจอสำหรับผู้ดูแลระบบและครูเวรเพื่อดูข้อมูล สรุปผล และรายงานต่างๆ ระบบนี้ถูกออกแบบมาให้ใช้งานง่ายและสามารถปรับแต่งได้ตามความต้องการของโรงเรียน

## เทคโนโลยีที่ใช้ (Tech Stack)
*   **Frontend:** React 19 + TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS + shadcn/ui
*   **State Management:** Context API / Zustand (หรือคล้ายกัน)
*   **Database (ปัจจุบัน):** localStorage (สำหรับการพัฒนาและทดสอบ)
*   **Database (รองรับ):** Firebase Firestore (สำหรับการใช้งานจริง)
*   **Authentication:** Firebase Authentication
*   **Storage:** Firebase Storage (สำหรับรูปภาพ/โลโก้)
*   **CI/CD:** GitHub Actions (สำหรับการ Deploy อัตโนมัติ)

## คุณสมบัติหลัก
*   **Dashboard:** แสดงภาพรวมสถานะกล้องวงจรปิดและข้อมูลสำคัญ
*   **Admin Panel:** สำหรับผู้ดูแลระบบในการจัดการข้อมูลผู้ใช้, กล้อง และการตั้งค่าต่างๆ
*   **History:** บันทึกและแสดงประวัติการรายงานเวร
*   **Cameras:** แสดงรายการกล้องวงจรปิดและสถานะ
*   **การจัดการข้อมูล:** รองรับการจัดเก็บข้อมูลทั้งแบบ Local Storage และ Firebase Firestore
*   **ระบบยืนยันตัวตน:** สามารถเชื่อมต่อกับ Firebase Authentication เพื่อจัดการผู้ใช้งาน

## การติดตั้งและรันโปรเจกต์ (สำหรับนักพัฒนา)

### 1. โคลน Repository
เริ่มต้นด้วยการโคลนโปรเจกต์นี้จาก GitHub:
```bash
git clone https://github.com/solamon2525/cctv-school-report.git
cd cctv-school-report
```

### 2. ติดตั้ง Dependencies
ใช้ `pnpm` ในการติดตั้งแพ็กเกจที่จำเป็นทั้งหมด:
```bash
pnpm install
```

### 3. รัน Dev Server
หลังจากติดตั้ง Dependencies เรียบร้อยแล้ว คุณสามารถรัน Dev Server เพื่อดูโปรเจกต์ในโหมดพัฒนาได้:
```bash
pnpm dev
```
โปรเจกต์จะรันอยู่ที่ `http://localhost:5173/` โดยประมาณ

## การ Deploy ไปยัง Firebase Hosting

โปรเจกต์นี้ถูกออกแบบมาให้สามารถ Deploy ไปยัง Firebase Hosting ได้อย่างง่ายดดาย โดยมีขั้นตอนหลักๆ ดังนี้:

### 1. สร้าง Firebase Project
*   ไปที่ [Firebase Console](https://console.firebase.google.com)
*   สร้างโปรเจกต์ใหม่และเปิดใช้งานบริการที่จำเป็น เช่น Firestore Database, Storage และ Authentication (เปิดใช้งาน Anonymous Sign-in)

### 2. ดึง Firebase Config
*   ใน Project Settings ของ Firebase Console ให้เพิ่ม Web App และคัดลอก `firebaseConfig` ที่ได้
*   นำค่า `firebaseConfig` ไปอัปเดตในไฟล์ `src/lib/firebase.ts` ของโปรเจกต์

### 3. ตั้งค่า GitHub Secrets
*   ใน GitHub Repository ของคุณ ไปที่ **Settings** → **Secrets and variables** → **Actions**
*   เพิ่ม Environment Variables สำหรับ Firebase Config (เช่น `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` เป็นต้น) และ `FIREBASE_SERVICE_ACCOUNT` (สำหรับ Service Account Key JSON)

### 4. อัปเดต `.firebaserc`
*   แก้ไขไฟล์ `.firebaserc` ในโปรเจกต์ของคุณให้ระบุ `projectId` ของ Firebase Project ที่คุณสร้างขึ้น

### 5. Deploy
*   **Manual Deploy:** สำหรับการ Deploy ครั้งแรก สามารถทำได้ด้วยคำสั่ง `firebase deploy --only firestore:rules,firestore:indexes,hosting` (ต้องติดตั้ง `firebase-tools` และ `firebase login` ก่อน)
*   **Auto Deploy:** เมื่อตั้งค่า GitHub Actions และ Secrets เรียบร้อยแล้ว ทุกครั้งที่คุณ `git push` ไปยัง `main` branch, GitHub Actions จะทำการ Build และ Deploy โปรเจกต์ให้โดยอัตโนมัติ

## การเชื่อมต่อ Firebase Firestore

ปัจจุบันโปรเจกต์ใช้ `localStorage` ในการจัดเก็บข้อมูล หากต้องการเปลี่ยนไปใช้ Firebase Firestore คุณจะต้องแก้ไขไฟล์ `src/lib/store.ts` เพื่อเรียกใช้ฟังก์ชันจาก `src/lib/firebase.ts` ในการบันทึกและดึงข้อมูลแทนการใช้ `localStorage`
