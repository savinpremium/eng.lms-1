
export type Grade = 
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' 
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' 
  | 'Grade 11';

export type Tier = 'Lite' | 'Platinum' | 'Golden';

export interface Institution {
  id: string;
  name: string;
  email: string;
  password: string;
  ownerPhone: string;
  tier: Tier;
  subjects: string[];
  location: string;
  createdAt: number;
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

// Added missing ClassGroup interface
export interface ClassGroup {
  id: string;
  name: string;
  grade: Grade;
  waLink?: string;
  description?: string;
}

// Added missing ResultRecord interface
export interface ResultRecord {
  id: string;
  studentId: string;
  examName: string;
  score: number;
  grade: Grade;
  date: string;
}

// Added missing MaterialRecord interface
export interface MaterialRecord {
  id: string;
  title: string;
  description: string;
  link: string;
  grade: string;
  type: 'PDF' | 'Video' | 'Link';
  date: string;
}

// Added missing MessageLog interface
export interface MessageLog {
  id: string;
  studentId: string;
  type: 'SMS' | 'WhatsApp';
  category: string;
  content: string;
  status: 'Sent' | 'Failed';
  timestamp: number;
}

// Added missing ScheduleRecord interface
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
  ENROLLMENT = 'ENROLLMENT',
  EXAMS = 'EXAMS',
  MATERIALS = 'MATERIALS',
  COMM_HUB = 'COMM_HUB',
  GROUPS = 'GROUPS',
  PORTAL = 'PORTAL',
  CLASS_ATTENDANCE = 'CLASS_ATTENDANCE'
}
