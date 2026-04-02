// ── Firebase Configuration ──
// สร้าง Firebase project ที่ https://console.firebase.google.com
// แล้วแทนที่ค่าด้านล่างด้วย config จริงของคุณ

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyCgPoT6V_1LNTAXDPOhISYQscgLRqNrkkg",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "cctv-school-report.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "cctv-school-report",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "cctv-school-report.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| "845943447657",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:845943447657:web:39fe095cbc2a03d54cc2f8",
};

const app     = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// ── Collections ──
export const COL = {
  schools:  'schools',
  users:    'users',
  reports:  'reports',
  cameras:  'cameras',
  duty:     'duty',
};

// ── Firestore CRUD helpers ──

// Schools
export async function getSchools() {
  const snap = await getDocs(collection(db, COL.schools));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveSchool(school: any) {
  await setDoc(doc(db, COL.schools, school.id), school);
}

// Users
export async function getUsers() {
  const snap = await getDocs(collection(db, COL.users));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveUser(user: any) {
  await setDoc(doc(db, COL.users, user.id), user);
}

export async function deleteUser(userId: string) {
  await deleteDoc(doc(db, COL.users, userId));
}

// Reports
export async function getReports(schoolId?: string) {
  let q = schoolId
    ? query(collection(db, COL.reports), where('schoolId', '==', schoolId), orderBy('timestamp', 'desc'))
    : query(collection(db, COL.reports), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addReport(report: any) {
  const { id, ...data } = report;
  await setDoc(doc(db, COL.reports, id), data);
}

export async function deleteReport(reportId: string) {
  await deleteDoc(doc(db, COL.reports, reportId));
}

// Cameras
export async function getCameras(schoolId?: string) {
  let q = schoolId
    ? query(collection(db, COL.cameras), where('schoolId', '==', schoolId))
    : query(collection(db, COL.cameras));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateCamera(camId: string, data: Partial<any>) {
  await updateDoc(doc(db, COL.cameras, camId), data);
}

export async function saveCamera(camera: any) {
  await setDoc(doc(db, COL.cameras, camera.id), camera);
}

export async function deleteCamera(camId: string) {
  await deleteDoc(doc(db, COL.cameras, camId));
}

// Duty schedule
export async function getDuty(schoolId?: string) {
  let q = schoolId
    ? query(collection(db, COL.duty), where('schoolId', '==', schoolId), orderBy('date', 'asc'))
    : query(collection(db, COL.duty), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveDuty(duty: any) {
  const { id, ...data } = duty;
  await setDoc(doc(db, COL.duty, id), data);
}

export async function deleteDuty(dutyId: string) {
  await deleteDoc(doc(db, COL.duty, dutyId));
}

// ── Logo upload to Firebase Storage ──
export async function uploadLogo(schoolId: string, dataUrl: string): Promise<string> {
  const logoRef = ref(storage, `logos/school_${schoolId}.jpg`);
  await uploadString(logoRef, dataUrl, 'data_url');
  return await getDownloadURL(logoRef);
}

export async function deleteLogo(schoolId: string): Promise<void> {
  const logoRef = ref(storage, `logos/school_${schoolId}.jpg`);
  await deleteObject(logoRef);
}

// ── Anonymous auth (for Firestore rules) ──
export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

// ── Database Backup & Clear ──
export async function clearAllDatabase() {
  const collections = [COL.reports, COL.duty, COL.users, COL.cameras, COL.schools];
  for (const c of collections) {
    const snap = await getDocs(collection(db, c));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, c, d.id))));
  }
}

export async function importDatabase(data: any) {
  // data should be an object with keys matching COL, e.g. { reports: [...], duty: [...] }
  const collections = [
    { key: 'reports', col: COL.reports },
    { key: 'duty', col: COL.duty },
    { key: 'users', col: COL.users },
    { key: 'cams', col: COL.cameras },
    { key: 'schools', col: COL.schools }
  ];
  
  for (const mapping of collections) {
    const list = data[mapping.key];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && item.id) {
          await setDoc(doc(db, mapping.col, item.id), item);
        }
      }
    }
  }
}
