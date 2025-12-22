
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, update, onValue, child, remove } from "firebase/database";
import { Student, AttendanceRecord, PaymentRecord, ResultRecord, MaterialRecord, MessageLog, ScheduleRecord, ClassGroup } from '../types';

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
  // Connection Status
  onConnectionChange: (callback: (connected: boolean) => void) => {
    const connectedRef = ref(db, ".info/connected");
    return onValue(connectedRef, (snap) => {
      callback(snap.val() === true);
    });
  },

  // Class Groups
  listenClasses: (callback: (classes: ClassGroup[]) => void) => {
    const classRef = ref(db, 'classes');
    return onValue(classRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()));
      } else {
        callback([]);
      }
    });
  },

  saveClass: async (cls: ClassGroup) => {
    const classRef = cls.id ? ref(db, `classes/${cls.id}`) : push(ref(db, 'classes'));
    const id = cls.id || classRef.key as string;
    await set(ref(db, `classes/${id}`), { ...cls, id });
  },

  deleteClass: async (id: string) => {
    await remove(ref(db, `classes/${id}`));
  },

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

  deleteStudent: async (id: string) => {
    await remove(ref(db, `students/${id}`));
  },

  // Attendance
  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const snapshot = await get(ref(db, 'attendance'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  listenAttendance: (callback: (records: AttendanceRecord[]) => void) => {
    const attRef = ref(db, 'attendance');
    return onValue(attRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()));
      } else {
        callback([]);
      }
    });
  },

  addAttendance: async (record: AttendanceRecord): Promise<string> => {
    const newRecordRef = push(ref(db, 'attendance'));
    const id = newRecordRef.key as string;
    await set(newRecordRef, { ...record, id });
    return id;
  },

  deleteAttendance: async (id: string) => {
    await remove(ref(db, `attendance/${id}`));
  },

  // Payments
  getPayments: async (): Promise<PaymentRecord[]> => {
    const snapshot = await get(ref(db, 'payments'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  listenPayments: (callback: (records: PaymentRecord[]) => void) => {
    const payRef = ref(db, 'payments');
    return onValue(payRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()));
      } else {
        callback([]);
      }
    });
  },

  addPayment: async (record: PaymentRecord): Promise<string> => {
    const newRecordRef = push(ref(db, 'payments'));
    const id = newRecordRef.key as string;
    await set(newRecordRef, { ...record, id });
    return id;
  },

  deletePayment: async (id: string) => {
    await remove(ref(db, `payments/${id}`));
  },

  // Message Logs
  logMessage: async (log: MessageLog) => {
    const logRef = push(ref(db, 'message_logs'));
    await set(logRef, { ...log, id: logRef.key });
  },

  listenLogs: (callback: (logs: MessageLog[]) => void) => {
    const logRef = ref(db, 'message_logs');
    return onValue(logRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()) as MessageLog[];
        callback(data.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        callback([]);
      }
    });
  },

  // Schedules
  getSchedules: async (): Promise<ScheduleRecord[]> => {
    const snapshot = await get(ref(db, 'schedules'));
    if (snapshot.exists()) return Object.values(snapshot.val());
    return [];
  },

  listenSchedules: (callback: (records: ScheduleRecord[]) => void) => {
    const schRef = ref(db, 'schedules');
    return onValue(schRef, (snapshot) => {
      if (snapshot.exists()) callback(Object.values(snapshot.val()));
      else callback([]);
    });
  },

  saveSchedule: async (sch: ScheduleRecord) => {
    const schRef = sch.id ? ref(db, `schedules/${sch.id}`) : push(ref(db, 'schedules'));
    await set(schRef, { ...sch, id: schRef.key });
  },

  deleteSchedule: async (id: string) => {
    await remove(ref(db, `schedules/${id}`));
  },

  // Assessment Results
  listenResults: (callback: (records: ResultRecord[]) => void) => {
    const resRef = ref(db, 'results');
    return onValue(resRef, (snapshot) => {
      if (snapshot.exists()) callback(Object.values(snapshot.val()));
      else callback([]);
    });
  },

  saveResult: async (result: ResultRecord) => {
    const newResRef = push(ref(db, 'results'));
    const id = newResRef.key as string;
    await set(newResRef, { ...result, id });
  },

  // Materials
  listenMaterials: (callback: (records: MaterialRecord[]) => void) => {
    const matRef = ref(db, 'materials');
    return onValue(matRef, (snapshot) => {
      if (snapshot.exists()) callback(Object.values(snapshot.val()));
      else callback([]);
    });
  },

  saveMaterial: async (material: MaterialRecord) => {
    const newMatRef = push(ref(db, 'materials'));
    const id = newMatRef.key as string;
    await set(newMatRef, { ...material, id });
  },

  // Auth / OTP
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
