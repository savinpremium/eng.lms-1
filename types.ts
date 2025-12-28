
export type Grade = 
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' 
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' 
  | 'Grade 11';

export type Tier = 'Lite' | 'Platinum' | 'Golden';
export type PaymentMode = 'Subscription' | 'OneTime';
export type InstitutionStatus = 'Active' | 'Suspended' | 'Frozen';

export interface Institution {
  id: string; // The "Class ID"
  name: string;
  email: string;
  password: string;
  ownerPhone: string;
  ownerNIC: string;
  registrationNumber: string;
  address: string;
  digitalSignature: string; // Base64 data
  termsAccepted: boolean;
  tier: Tier;
  paymentMode: PaymentMode;
  status: InstitutionStatus;
  subjects: string[];
  location: string;
  createdAt: number;
  emailVerified: boolean;
}

export interface Student {
  id: string;
  institutionId: string;
  name: string;
  grade: Grade;
  subject?: string;
  parentName: string;
  contact: string;
  lastPaymentMonth: string;
  registrationDate: string;
}

export interface AttendanceRecord {
  id: string;
  institutionId: string;
  studentId: string;
  subject?: string;
  date: string;
  timestamp: number;
}

export interface PaymentRecord {
  id: string;
  institutionId: string;
  studentId: string;
  amount: number;
  month: string;
  method: 'Cash' | 'Online';
  timestamp: number;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: Grade;
  waLink?: string;
  description?: string;
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
  grade: string;
  type: 'PDF' | 'Video' | 'Link';
  date: string;
}

export interface MessageLog {
  id: string;
  studentId: string;
  type: 'SMS' | 'WhatsApp';
  category: string;
  content: string;
  status: 'Sent' | 'Failed';
  timestamp: number;
}

export interface ScheduleRecord {
  id: string;
  grade: Grade;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  venue: string;
}

export interface AuthState {
  role: 'SUPER_ADMIN' | 'INSTITUTE' | 'STUDENT' | 'NONE';
  institutionId: string | null;
  institutionName?: string;
  tier?: Tier;
}

export enum Page {
  LANDING = 'LANDING',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  ATTENDANCE = 'ATTENDANCE',
  PAYMENTS = 'PAYMENTS',
  MESSENGER = 'MESSENGER',
  REGISTRATION = 'REGISTRATION',
  EXAMS = 'EXAMS',
  MATERIALS = 'MATERIALS',
  COMM_HUB = 'COMM_HUB',
  GROUPS = 'GROUPS',
  PORTAL = 'PORTAL',
  CLASS_ATTENDANCE = 'CLASS_ATTENDANCE',
  SCHEDULE = 'SCHEDULE'
}
