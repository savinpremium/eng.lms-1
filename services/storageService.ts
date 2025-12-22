
import { Student, AttendanceRecord, PaymentRecord } from '../types';

const KEYS = {
  STUDENTS: 'englms_students',
  ATTENDANCE: 'englms_attendance',
  PAYMENTS: 'englms_payments',
  OTP: 'englms_otp'
};

export const storageService = {
  getStudents: (): Student[] => JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]'),
  
  saveStudent: (student: Student) => {
    const students = storageService.getStudents();
    students.push(student);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  updateStudent: (updated: Student) => {
    const students = storageService.getStudents().map(s => s.id === updated.id ? updated : s);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getAttendance: (): AttendanceRecord[] => JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]'),

  addAttendance: (record: AttendanceRecord) => {
    const records = storageService.getAttendance();
    records.push(record);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getPayments: (): PaymentRecord[] => JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]'),

  addPayment: (record: PaymentRecord) => {
    const records = storageService.getPayments();
    records.push(record);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(records));
  },

  generateOTP: (): string => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    localStorage.setItem(KEYS.OTP, JSON.stringify({ otp, expiry }));
    return otp;
  },

  validateOTP: (input: string): boolean => {
    const data = JSON.parse(localStorage.getItem(KEYS.OTP) || '{}');
    if (!data.otp || Date.now() > data.expiry) return false;
    return data.otp === input;
  }
};
