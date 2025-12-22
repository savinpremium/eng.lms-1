
export type Grade = 
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' 
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' 
  | 'Grade 11';

export interface Student {
  id: string; // STU-2025-XXXX
  name: string;
  grade: Grade;
  parentName: string;
  contact: string;
  lastPaymentMonth: string; // YYYY-MM
  registrationDate: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  amount: number;
  month: string; // YYYY-MM
  method: 'Cash' | 'Online';
  timestamp: number;
}

export interface AuthState {
  isStaff: boolean;
  staffId: string | null;
  otp: string | null;
  otpExpiry: number | null;
}

export enum Page {
  LANDING = 'LANDING',
  PORTAL = 'PORTAL',
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  ATTENDANCE = 'ATTENDANCE',
  PAYMENTS = 'PAYMENTS',
  MESSENGER = 'MESSENGER',
  ENROLLMENT = 'ENROLLMENT'
}
