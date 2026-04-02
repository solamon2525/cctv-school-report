import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgPoT6V_1LNTAXDPOhISYQscgLRqNrkkg",
  authDomain: "cctv-school-report.firebaseapp.com",
  projectId: "cctv-school-report",
  storageBucket: "cctv-school-report.firebasestorage.app",
  messagingSenderId: "845943447657",
  appId: "1:845943447657:web:39fe095cbc2a03d54cc2f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const schools = [
    { id:'s1', name:'โรงเรียนบ้านคำไผ่',     shortName:'บ้านคำไผ่'     },
    { id:'s2', name:'โรงเรียนบ้านหินเหลิ่ง', shortName:'บ้านหินเหลิ่ง' },
];

const users = [
    { id:'u0', name:'นายมกรธวัช แสนสง่า',     role:'director', schoolId:null, pin:'0000' },
    { id:'u1', name:'นายณัฐพงศ์ สิงห์ชมภู',   role:'admin',    schoolId:'s1', pin:'1234' },
    { id:'u2', name:'นางสาวมะลิวัลย์ จรุงพันธ์', role:'teacher',  schoolId:'s1', pin:'1111' },
    { id:'u3', name:'นางสาวศศิมาภรณ์ ดวงจำปา',  role:'teacher',  schoolId:'s1', pin:'2222' },
    { id:'u4', name:'นางสาวธัญพิชชา วังผือ',    role:'teacher',  schoolId:'s1', pin:'3333' },
    { id:'u5', name:'นายเอกวิทย์ พละสี',        role:'teacher',  schoolId:'s1', pin:'4444' },
    { id:'u6', name:'นางสาวธัญพิมล ง้าวกลาง',  role:'teacher',  schoolId:'s1', pin:'5555' },
    { id:'u7', name:'นางสาวลำไพร สังสะอาด',    role:'teacher',  schoolId:'s2', pin:'6666' },
    { id:'u8', name:'นางสาวปรียาภรณ์ จันทะเสน', role:'teacher', schoolId:'s2', pin:'7777' },
    { id:'u9', name:'นางสาวสุภารัตน์ พิมพ์ดา', role:'teacher',  schoolId:'s2', pin:'8888' },
    { id:'u10',name:'นายมานิจ ชาวเหนือ',        role:'teacher',  schoolId:'s2', pin:'9999' },
];

const cams = [
    {id:'KP-01',schoolId:'s1',name:'ประตูทางเข้าหลัก',location:'ประตูหน้า',zone:'gate',status:'ok'},
    {id:'KP-02',schoolId:'s1',name:'ลานกิจกรรม',location:'หน้าอาคาร',zone:'exterior',status:'ok'},
    {id:'KP-03',schoolId:'s1',name:'อาคาร 1',location:'อาคาร 1',zone:'interior',status:'ok'},
    {id:'KP-04',schoolId:'s1',name:'โรงอาหาร',location:'โรงอาหาร',zone:'interior',status:'ok'},
    {id:'KP-05',schoolId:'s1',name:'สนามกีฬา',location:'สนามหน้า',zone:'exterior',status:'ok'},
    {id:'KP-06',schoolId:'s1',name:'ลานจอดรถ',location:'ลานจอดรถ',zone:'exterior',status:'ok'},
    {id:'KP-07',schoolId:'s1',name:'ประตูหลัง',location:'ประตูหลัง',zone:'gate',status:'ok'},
    {id:'KP-08',schoolId:'s1',name:'สำนักงาน',location:'ห้องสำนักงาน',zone:'interior',status:'ok'},
    {id:'HL-01',schoolId:'s2',name:'ประตูทางเข้าหลัก',location:'ประตูหน้า',zone:'gate',status:'ok'},
    {id:'HL-02',schoolId:'s2',name:'อาคารเรียน',location:'อาคารเรียน',zone:'interior',status:'ok'},
    {id:'HL-03',schoolId:'s2',name:'สนามกีฬา',location:'สนามหน้า',zone:'exterior',status:'ok'},
]

async function seed() {
    console.log("Restoring schools...");
    for (let s of schools) {
        await setDoc(doc(db, "schools", s.id), s);
    }
    console.log("Restoring users...");
    for (let u of users) {
        await setDoc(doc(db, "users", u.id), u);
    }
    console.log("Restoring cameras...");
    for (let c of cams) {
        await setDoc(doc(db, "cameras", c.id), c);
    }
    console.log("🎉 ALL DONE!");
    process.exit(0);
}

seed();
