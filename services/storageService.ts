
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, update, onValue, remove, query, orderByChild, equalTo } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { Student, AttendanceRecord, PaymentRecord, Institution, ResultRecord, MaterialRecord, MessageLog, ClassGroup, ScheduleRecord } from '../types';

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
  onConnectionChange: (callback: (online: boolean) => void) => {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => callback(!!snap.val()));
    return () => {};
  },

  // --- MULTI-TENANT CLASS MANAGEMENT (Super Admin Only) ---
  saveInstitution: async (inst: Institution) => {
    // Super admin can provide custom ID or we use the generated one
    const id = inst.id.toUpperCase().trim();
    await set(ref(db, `institutions/${id}`), { ...inst, id, status: inst.status || 'Active' });
    return id;
  },

  checkIdExists: async (id: string): Promise<boolean> => {
    const snap = await get(ref(db, `institutions/${id.toUpperCase().trim()}`));
    return snap.exists();
  },

  updateInstitution: async (id: string, updates: Partial<Institution>) => {
    await update(ref(db, `institutions/${id}`), updates);
  },

  deleteInstitution: async (id: string) => {
    await remove(ref(db, `institutions/${id}`));
  },

  getInstitution: async (id: string): Promise<Institution | null> => {
    const snap = await get(ref(db, `institutions/${id.toUpperCase().trim()}`));
    return snap.val() as Institution;
  },

  listenInstitutions: (callback: (insts: Institution[]) => void) => {
    const instsRef = ref(db, 'institutions');
    return onValue(instsRef, (snap) => {
      const data = snap.val();
      if (data) {
        callback(Object.values(data));
      } else {
        callback([]);
      }
    });
  },

  // Firebase Auth Verification for Institutions
  registerInstitutionAuth: async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  },

  validateInstituteLogin: async (email: string, pass: string): Promise<Institution | null> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      const instsSnap = await get(ref(db, 'institutions'));
      const insts = instsSnap.val() || {};
      const found = Object.values(insts).find((i: any) => i.email === email) as Institution;
      return found || null;
    } catch (e) {
      // Fallback for demo/manual entries or if auth fails
      const instsSnap = await get(ref(db, 'institutions'));
      const insts = instsSnap.val() || {};
      return Object.values(insts).find((i: any) => i.email === email && i.password === pass) as Institution || null;
    }
  },

  // --- STUDENT MANAGEMENT (Tenant Scoped) ---
  saveStudent: async (instId: string, student: Student) => {
    const id = student.id || push(ref(db, `students/${instId}`)).key as string;
    await set(ref(db, `students/${instId}/${id}`), { ...student, id });
  },

  getStudents: async (instId: string): Promise<Student[]> => {
    const snap = await get(ref(db, `students/${instId}`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  listenStudents: (instId: string, callback: (students: Student[]) => void) => {
    return onValue(ref(db, `students/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  updateStudent: async (instId: string, student: Student) => {
    await update(ref(db, `students/${instId}/${student.id}`), student);
  },

  deleteStudent: async (instId: string, studentId: string) => {
    await remove(ref(db, `students/${instId}/${studentId}`));
  },

  // --- ATTENDANCE (Tenant Scoped) ---
  addAttendance: async (instId: string, record: AttendanceRecord) => {
    const newRef = push(ref(db, `attendance/${instId}`));
    const id = newRef.key as string;
    await set(newRef, { ...record, id });
    return id;
  },

  getAttendance: async (instId: string): Promise<AttendanceRecord[]> => {
    const snap = await get(ref(db, `attendance/${instId}`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  listenAttendance: (instId: string, callback: (records: AttendanceRecord[]) => void) => {
    return onValue(ref(db, `attendance/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  deleteAttendance: async (instId: string, recordId: string) => {
    await remove(ref(db, `attendance/${instId}/${recordId}`));
  },

  // --- PAYMENTS (Tenant Scoped) ---
  addPayment: async (instId: string, payment: PaymentRecord) => {
    const newRef = push(ref(db, `payments/${instId}`));
    const id = newRef.key as string;
    await set(newRef, { ...payment, id });
    return id;
  },

  getPayments: async (instId: string): Promise<PaymentRecord[]> => {
    const snap = await get(ref(db, `payments/${instId}`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  // --- OTP MANAGEMENT ---
  generateOTP: async (instId: string): Promise<string> => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await set(ref(db, `otps/${instId}`), { code, expiresAt: Date.now() + 300000 });
    return code;
  },

  validateOTP: async (instId: string, code: string): Promise<boolean> => {
    const snap = await get(ref(db, `otps/${instId}`));
    if (!snap.exists()) return false;
    const data = snap.val();
    if (data.expiresAt < Date.now()) return false;
    return data.code === code;
  },

  // --- ASSESSMENT & HUB ---
  saveResult: async (instId: string, res: ResultRecord) => {
    const id = push(ref(db, `results/${instId}`)).key as string;
    await set(ref(db, `results/${instId}/${id}`), { ...res, id });
  },

  listenResults: (instId: string, callback: (results: ResultRecord[]) => void) => {
    return onValue(ref(db, `results/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveMaterial: async (instId: string, mat: MaterialRecord) => {
    const id = push(ref(db, `materials/${instId}`)).key as string;
    await set(ref(db, `materials/${instId}/${id}`), { ...mat, id });
  },

  listenMaterials: (instId: string, callback: (mats: MaterialRecord[]) => void) => {
    return onValue(ref(db, `materials/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  logMessage: async (instId: string, log: MessageLog) => {
    const id = push(ref(db, `logs/${instId}`)).key as string;
    await set(ref(db, `logs/${instId}/${id}`), { ...log, id });
  },

  listenLogs: (instId: string, callback: (logs: MessageLog[]) => void) => {
    return onValue(ref(db, `logs/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  saveClass: async (instId: string, cls: ClassGroup) => {
    const id = push(ref(db, `classes/${instId}`)).key as string;
    await set(ref(db, `classes/${instId}/${id}`), { ...cls, id });
  },

  listenClasses: (instId: string, callback: (classes: ClassGroup[]) => void) => {
    return onValue(ref(db, `classes/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  deleteClass: async (instId: string, classId: string) => {
    await remove(ref(db, `classes/${instId}/${classId}`));
  },

  saveSchedule: async (instId: string, sch: ScheduleRecord) => {
    const id = push(ref(db, `schedules/${instId}`)).key as string;
    await set(ref(db, `schedules/${instId}/${id}`), { ...sch, id });
  },

  listenSchedules: (instId: string, callback: (sch: ScheduleRecord[]) => void) => {
    return onValue(ref(db, `schedules/${instId}`), (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) : []);
    });
  },

  deleteSchedule: async (instId: string, schId: string) => {
    await remove(ref(db, `schedules/${instId}/${schId}`));
  }
};
