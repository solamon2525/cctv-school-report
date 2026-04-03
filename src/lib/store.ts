// ── Data store ──
export const K = {
  schools:     'cctv_schools',
  cams:        'cctv_cams',
  teachers:    'cctv_teachers',
  reports:     'duty_reports',
  duty:        'duty_schedule',
  activeSchool:'cctv_active_school',
  activeUser:  'active_user',
  users:       'app_users',
};

export function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
export function save<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e: any) { if (e?.name==='QuotaExceededError') alert('พื้นที่เต็ม'); }
}
export function loadVal(key: string): string { return localStorage.getItem(key) || ''; }
export function saveVal(key: string, v: string): void { localStorage.setItem(key, v); }

// ── Types ──
export type Shift    = 'morning' | 'afternoon';
export type UserRole = 'director' | 'admin' | 'teacher';

export interface School { id: string; name: string; shortName: string; logoUrl?: string; }
export type CamStatus = 'ok' | 'warning' | 'error' | 'offline';
export type CamZone   = 'exterior' | 'interior' | 'corridor' | 'gate';
export type Urgency   = 'none' | 'low' | 'medium' | 'high';

export interface Camera { id: string; schoolId: string; name: string; location: string; status: CamStatus; zone: CamZone; }
export interface AppUser {
  id: string; name: string; role: UserRole;
  schoolId: string | null; // null = director (both schools)
  pin: string;
  photoUrl?: string;
}
export interface DutyReport {
  id: string; schoolId: string; date: string; shift: Shift;
  reporterId: string; time: string;
  isNormal: boolean;
  areas: AreaReport[];
  note: string; sign: string;
  photos: { name:string; data:string; camId?:string; camName?:string }[];
  timestamp: number;
}
export interface AreaReport {
  area: string;
  status: 'ok' | 'issue';
  note: string;
}
export interface DutySchedule {
  id: string; schoolId: string; date: string; shift: Shift;
  teacherId: string; timestamp: number;
}

// ── Labels ──
export const AREAS_KP = [
  'ห้องเรียน','อาคารเรียน','ห้องน้ำ','โรงอาหาร',
  'สนามกีฬา','ประตูทางเข้า','ที่จอดรถ','บริเวณรอบโรงเรียน',
];
export const AREAS_HL = [
  'ประตูทางเข้าหลัก', 'อาคารเรียน', 'สนามกีฬา'
];

export const stLbl: Record<string,string> = { ok:'ปกติ', warning:'ผิดปกติ', error:'ไม่มีสัญญาณ', offline:'ปิดใช้งาน' };
export const stClass: Record<string,string> = { ok:'st-ok', warning:'st-warn', error:'st-err', offline:'st-off' };
export const stBorderColor: Record<string,string> = { ok:'#2e7d32', warning:'#f5d06e', error:'#b71c1c', offline:'#e5e0d4' };

export const zoneLbl: Record<string,string> = { exterior:'ภายนอกอาคาร', interior:'ภายในอาคาร', corridor:'โถงทางเดิน', gate:'ประตูทางเข้า' };

export const urgLbl: Record<string,string> = { none:'ปกติ', low:'ต่ำ', medium:'ปานกลาง', high:'สูง' };
export const urgClass: Record<string,string> = { none:'urg-none', low:'urg-low', medium:'urg-med', high:'urg-high' };

export const fmtDate = (d: string) => {
  if (!d) return '-';
  return new Date(d+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
};
export const fmtTime = (d: string) => {
  const dt = new Date(d+'T12:00:00');
  return dt.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
};
export const today = () => {
  const d = new Date();
  // Use Thailand timezone (UTC+7) to avoid date mismatch
  const offset = 7 * 60; // minutes
  const localDate = new Date(d.getTime() + (offset - d.getTimezoneOffset()) * 60000);
  return localDate.toISOString().slice(0, 10);
};
export const nowTime = () => {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

// ── Admin/Session ──
export const ADMIN_SESSION_KEY = 'admin_session';
export function isAdminSession(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY)||'{}');
    return s.ok && s.exp > Date.now();
  } catch { return false; }
}
export function startAdminSession(userId: string): void {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    ok: true, userId, exp: Date.now() + 8*3600*1000,
  }));
}
export function clearAdminSession(): void { localStorage.removeItem(ADMIN_SESSION_KEY); }
export function getSessionUser(): string {
  try { return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY)||'{}').userId||''; } catch { return ''; }
}


// ── Logo helpers ──
export function getSchoolLogo(schoolId: string): string {
  const s = load<School>(K.schools).find(x => x.id === schoolId);
  if (s?.logoUrl) return s.logoUrl;
  return localStorage.getItem('logo_' + schoolId) || '';
}
export function setSchoolLogo(schoolId: string, dataUrl: string): void {
  localStorage.setItem('logo_' + schoolId, dataUrl);
}

// ── Seed ──
export function seedData() {
  if (localStorage.getItem(K.schools)) return;

  const schools: School[] = [
    { id:'s1', name:'โรงเรียนบ้านคำไผ่',     shortName:'บ้านคำไผ่'     },
    { id:'s2', name:'โรงเรียนบ้านหินเหลิ่ง', shortName:'บ้านหินเหลิ่ง' },
  ];

  const users: AppUser[] = [
    // ผู้อำนวยการ
    { id:'u0', name:'นายมกรธวัช แสนสง่า',     role:'director', schoolId:null, pin:'0000' },
    // บ้านคำไผ่
    { id:'u1', name:'นายณัฐพงศ์ สิงห์ชมภู',   role:'admin',    schoolId:'s1', pin:'1234' },
    { id:'u2', name:'นางสาวมะลิวัลย์ จรุงพันธ์', role:'teacher',  schoolId:'s1', pin:'1111' },
    { id:'u3', name:'นางสาวศศิมาภรณ์ ดวงจำปา',  role:'teacher',  schoolId:'s1', pin:'2222' },
    { id:'u4', name:'นางสาวธัญพิชชา วังผือ',    role:'teacher',  schoolId:'s1', pin:'3333' },
    { id:'u5', name:'นายเอกวิทย์ พละสี',        role:'teacher',  schoolId:'s1', pin:'4444' },
    { id:'u6', name:'นางสาวธัญพิมล ง้าวกลาง',  role:'teacher',  schoolId:'s1', pin:'5555' },
    // บ้านหินเหลิ่ง
    { id:'u7', name:'นางสาวลำไพร สังสะอาด',    role:'teacher',  schoolId:'s2', pin:'6666' },
    { id:'u8', name:'นางสาวปรียาภรณ์ จันทะเสน', role:'teacher', schoolId:'s2', pin:'7777' },
    { id:'u9', name:'นางสาวสุภารัตน์ พิมพ์ดา', role:'teacher',  schoolId:'s2', pin:'8888' },
    { id:'u10',name:'นายมานิจ ชาวเหนือ',        role:'teacher',  schoolId:'s2', pin:'9999' },
  ];

  const d = (n:number) => { const x=new Date(); x.setDate(x.getDate()-n); return x.toISOString().slice(0,10); };
  const mkAreas = (areas:string[], allOk=true): AreaReport[] =>
    areas.map(a => ({ area:a, status: allOk?'ok':'ok', note:'' }));

  const reports: DutyReport[] = [
    { id:'r1', schoolId:'s1', date:d(1), shift:'morning', reporterId:'u1', time:'07:30',
      isNormal:true, areas:mkAreas(AREAS_KP), note:'เหตุการณ์ปกติ นักเรียนมาตรงเวลา', photos:[], sign:'ณัฐพงศ์ สิงห์ชมภู', timestamp:new Date(d(1)+'T07:30').getTime() },
    { id:'r2', schoolId:'s1', date:d(1), shift:'afternoon', reporterId:'u2', time:'15:00',
      isNormal:true, areas:mkAreas(AREAS_KP), note:'เหตุการณ์ปกติ', photos:[], sign:'มะลิวัลย์ จรุงพันธ์', timestamp:new Date(d(1)+'T15:00').getTime() },
    { id:'r3', schoolId:'s2', date:d(1), shift:'morning', reporterId:'u7', time:'07:20',
      isNormal:true, areas:mkAreas(AREAS_HL), note:'เหตุการณ์ปกติ', photos:[], sign:'ลำไพร สังสะอาด', timestamp:new Date(d(1)+'T07:20').getTime() },
    { id:'r4', schoolId:'s1', date:d(2), shift:'morning', reporterId:'u3', time:'07:25',
      isNormal:false, areas:AREAS_KP.map((a,i) => ({ area:a, status:i===2?'issue':'ok', note:i===2?'ห้องน้ำชายมีน้ำรั่ว':'' })),
      note:'พบน้ำรั่วห้องน้ำชาย แจ้งนักการแล้ว', photos:[], sign:'ศศิมาภรณ์ ดวงจำปา', timestamp:new Date(d(2)+'T07:25').getTime() },
  ];

  // Cameras (all OK, display only)
  const cams: Camera[] = [
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
  ];

  save(K.schools, schools);
  save('app_users', users);
  save(K.cams, cams);
  save(K.reports, reports);
  save(K.duty, []);
}
