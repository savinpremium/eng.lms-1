
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, update, onValue, child, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import { Student, AttendanceRecord, PaymentRecord, Institution, Tier, ResultRecord, MaterialRecord, MessageLog, ClassGroup, ScheduleRecord } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDneDiUzFALG_DcH1gNJmzB0WIddQcDxsA",
  authDomain: "lms-e-6f847.firebaseapp.com",
  databaseURL: "https://lms-e-6f847-default-rtdb.firebaseio.com",
  projectId: "lms-e-6f847",
  storageBucket: "lms-e-6f847.firebasestorage.app",
  messagingSenderId: "500541616456",
  appId: "1:500541616456:web:db41d2f2b2be2787c0c37d",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export const auth = getAuth(app);

export const storageService = {
  // --- MULTI-TENANT INSTITUTION MANAGEMENT (Super Admin Only) ---
  saveInstitution: async (inst: Institution) => {
    const instRef = inst.id ? ref(db, `institutions/${inst.id}`) : push(ref(db, 'institutions'));
    const id = inst.id || instRef.key as string;
    await set(ref(db, `institutions/${id}`), { ...inst, id, status: inst.status || 'Active' });
    return id;
  },

  updateInstitution: async (id: string, updates: Partial<Institution>) => {
    await update(ref(db, `institutions/${id}`), updates);
  },

  deleteInstitution: async (id: string) => {
    await remove(ref(db, `institutions/${id}`));
    // In a production app, we would also clean up data/instId here
  },

  getInstitution: async (id: string): Promise<Institution | null> => {
    const snap = await get(ref(db, `institutions/${id}`));
    return snap.exists() ? snap.val() : null;
  },

  listenInstitutions: (callback: (insts: Institution[]) => void) => {
    return onValue(ref(db, 'institutions'), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  // --- AUTHENTICATION ---
  validateInstituteLogin: async (email: string, pass: string): Promise<Institution | null> => {
    const snap = await get(ref(db, 'institutions'));
    if (!snap.exists()) return null;
    const insts = Object.values(snap.val()) as Institution[];
    const inst = insts.find(i => i.email === email && i.password === pass);
    
    if (inst && inst.status === 'Suspended') {
      throw new Error("This account has been suspended by the network administrator.");
    }
    
    return inst || null;
  },

  // --- SCOPED DATA (Requires institutionId) ---
  getStudents: async (instId: string): Promise<Student[]> => {
    const snap = await get(ref(db, `data/${instId}/students`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  listenStudents: (instId: string, callback: (students: Student[]) => void) => {
    return onValue(ref(db, `data/${instId}/students`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveStudent: async (instId: string, student: Student) => {
    await set(ref(db, `data/${instId}/students/${student.id}`), { ...student, institutionId: instId });
  },

  updateStudent: async (instId: string, student: Student) => {
    await set(ref(db, `data/${instId}/students/${student.id}`), student);
  },

  deleteStudent: async (instId: string, id: string) => {
    await remove(ref(db, `data/${instId}/students/${id}`));
  },

  getAttendance: async (instId: string): Promise<AttendanceRecord[]> => {
    const snap = await get(ref(db, `data/${instId}/attendance`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  listenAttendance: (instId: string, callback: (recs: AttendanceRecord[]) => void) => {
    return onValue(ref(db, `data/${instId}/attendance`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  addAttendance: async (instId: string, record: AttendanceRecord) => {
    const newRef = push(ref(db, `data/${instId}/attendance`));
    await set(newRef, { ...record, id: newRef.key, institutionId: instId });
    return newRef.key as string;
  },

  deleteAttendance: async (instId: string, id: string) => {
    await remove(ref(db, `data/${instId}/attendance/${id}`));
  },

  getPayments: async (instId: string): Promise<PaymentRecord[]> => {
    const snap = await get(ref(db, `data/${instId}/payments`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  listenPayments: (instId: string, callback: (recs: PaymentRecord[]) => void) => {
    return onValue(ref(db, `data/${instId}/payments`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  addPayment: async (instId: string, record: PaymentRecord) => {
    const newRef = push(ref(db, `data/${instId}/payments`));
    await set(newRef, { ...record, id: newRef.key, institutionId: instId });
    return newRef.key as string;
  },

  updateStudentLastPayment: async (instId: string, studentId: string, month: string) => {
    await update(ref(db, `data/${instId}/students/${studentId}`), { lastPaymentMonth: month });
  },

  // Added Results handling
  listenResults: (instId: string, callback: (results: ResultRecord[]) => void) => {
    return onValue(ref(db, `data/${instId}/results`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveResult: async (instId: string, result: ResultRecord) => {
    const newRef = result.id ? ref(db, `data/${instId}/results/${result.id}`) : push(ref(db, `data/${instId}/results`));
    const id = result.id || newRef.key as string;
    await set(ref(db, `data/${instId}/results/${id}`), { ...result, id });
  },

  // Added Materials handling
  listenMaterials: (instId: string, callback: (materials: MaterialRecord[]) => void) => {
    return onValue(ref(db, `data/${instId}/materials`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveMaterial: async (instId: string, material: MaterialRecord) => {
    const newRef = material.id ? ref(db, `data/${instId}/materials/${material.id}`) : push(ref(db, `data/${instId}/materials`));
    const id = material.id || newRef.key as string;
    await set(ref(db, `data/${instId}/materials/${id}`), { ...material, id });
  },

  // Added OTP handling
  generateOTP: async (instId: string): Promise<string> => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await set(ref(db, `data/${instId}/otp`), { code, expires: Date.now() + 300000 });
    return code;
  },

  validateOTP: async (instId: string, code: string): Promise<boolean> => {
    const snap = await get(ref(db, `data/${instId}/otp`));
    if (!snap.exists()) return false;
    const data = snap.val();
    return data.code === code && data.expires > Date.now();
  },

  // Added Classes handling
  listenClasses: (instId: string, callback: (classes: ClassGroup[]) => void) => {
    return onValue(ref(db, `data/${instId}/classes`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveClass: async (instId: string, classObj: ClassGroup) => {
    const newRef = classObj.id ? ref(db, `data/${instId}/classes/${classObj.id}`) : push(ref(db, `data/${instId}/classes`));
    const id = classObj.id || newRef.key as string;
    await set(ref(db, `data/${instId}/classes/${id}`), { ...classObj, id });
  },

  deleteClass: async (instId: string, id: string) => {
    await remove(ref(db, `data/${instId}/classes/${id}`));
  },

  // Added Logs handling
  listenLogs: (instId: string, callback: (logs: MessageLog[]) => void) => {
    return onValue(ref(db, `data/${instId}/logs`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  logMessage: async (instId: string, log: MessageLog) => {
    const newRef = push(ref(db, `data/${instId}/logs`));
    await set(newRef, { ...log, id: newRef.key });
  },

  // Added Schedules handling
  listenSchedules: (instId: string, callback: (schedules: ScheduleRecord[]) => void) => {
    return onValue(ref(db, `data/${instId}/schedules`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveSchedule: async (instId: string, schedule: ScheduleRecord) => {
    const newRef = schedule.id ? ref(db, `data/${instId}/schedules/${schedule.id}`) : push(ref(db, `data/${instId}/schedules`));
    const id = schedule.id || newRef.key as string;
    await set(ref(db, `data/${instId}/schedules/${id}`), { ...schedule, id });
  },

  deleteSchedule: async (instId: string, id: string) => {
    await remove(ref(db, `data/${instId}/schedules/${id}`));
  },

  onConnectionChange: (callback: (connected: boolean) => void) => {
    return onValue(ref(db, ".info/connected"), (snap) => callback(snap.val() === true));
  }
};
