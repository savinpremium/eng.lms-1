
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, update, onValue, child } from "firebase/database";
import { Student, AttendanceRecord, PaymentRecord } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDneDiUzFALG_DcH1gNJmzB0WIddQcDxsA",
  authDomain: "lms-e-6f847.firebaseapp.com",
  databaseURL: "https://lms-e-6f847-default-rtdb.firebaseio.com",
  projectId: "lms-e-6f847",
  storageBucket: "lms-e-6f847.firebasestorage.app",
  messagingSenderId: "500541616456",
  appId: "1:500541616456:web:db41d2f2b2be2787c0c37d",
  measurementId: "G-X4PS6F2YJ6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const storageService = {
  // Students
  getStudents: async (): Promise<Student[]> => {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'students'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  listenStudents: (callback: (students: Student[]) => void) => {
    const studentsRef = ref(db, 'students');
    return onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()));
      } else {
        callback([]);
      }
    });
  },
  
  saveStudent: async (student: Student) => {
    await set(ref(db, `students/${student.id}`), student);
  },

  updateStudent: async (updated: Student) => {
    await update(ref(db, `students/${updated.id}`), updated);
  },

  // Attendance
  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const snapshot = await get(ref(db, 'attendance'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  addAttendance: async (record: AttendanceRecord) => {
    const newRecordRef = push(ref(db, 'attendance'));
    await set(newRecordRef, { ...record, id: newRecordRef.key });
  },

  // Payments
  getPayments: async (): Promise<PaymentRecord[]> => {
    const snapshot = await get(ref(db, 'payments'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  addPayment: async (record: PaymentRecord) => {
    const newRecordRef = push(ref(db, 'payments'));
    await set(newRecordRef, { ...record, id: newRecordRef.key });
  },

  // Auth / OTP (Transient Storage)
  generateOTP: async (): Promise<string> => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    await set(ref(db, 'system/otp'), { otp, expiry });
    return otp;
  },

  validateOTP: async (input: string): Promise<boolean> => {
    const snapshot = await get(ref(db, 'system/otp'));
    if (!snapshot.exists()) return false;
    const { otp, expiry } = snapshot.val();
    if (!otp || Date.now() > expiry) return false;
    return otp === input;
  }
};
