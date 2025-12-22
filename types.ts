
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
  classGroupId?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: Grade;
  waLink: string;
  description: string;
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

export interface ResultRecord {
  id: string;
  studentId: string;
  examName: string;
  score: number;
  grade: Grade;
  date: string;
}

export interface MaterialRecord {
  id: string;
  title: string;
  description: string;
  link: string;
  grade: Grade;
  type: 'PDF' | 'Video' | 'Link';
  date: string;
}

export interface MessageLog {
  id: string;
  studentId: string;
  type: 'SMS' | 'WhatsApp';
  category: 'Attendance' | 'Payment' | 'Reminder' | 'Announcement';
  content: string;
  status: 'Sent' | 'Failed';
  timestamp: number;
}

export interface ScheduleRecord {
  id: string;
  grade: Grade;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string; // HH:MM
  venue: string;
}

export interface AuthState {
  isStaff: boolean;
  isDemo: boolean;
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
  CLASS_ATTENDANCE = 'CLASS_ATTENDANCE',
  PAYMENTS = 'PAYMENTS',
  MESSENGER = 'MESSENGER',
  ENROLLMENT = 'ENROLLMENT',
  EXAMS = 'EXAMS',
  MATERIALS = 'MATERIALS',
  COMM_HUB = 'COMM_HUB',
  SCHEDULE = 'SCHEDULE',
  GROUPS = 'GROUPS'
}
