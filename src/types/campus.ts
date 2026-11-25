export type UserRole = 'student' | 'admin';

export type NavSection =
  | 'overview'
  | 'assistant'
  | 'profile'
  | 'attendance'
  | 'faculty'
  | 'timetable'
  | 'timings'
  | 'notices'
  | 'fees'
  | 'scholarships'
  | 'placements'
  | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  rollNumber: string;
  department: string;
  semester: number;
  cgpa: number;
  phone?: string;
  mentorName?: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  attendedClasses: number;
  totalClasses: number;
  semester: number;
  updatedAt?: unknown;
}

export interface FeeRecord {
  id: string;
  userId: string;
  studentName: string;
  title: string;
  category: 'Tuition' | 'Laboratory' | 'Examination' | 'Library' | 'Hostel';
  semester: number;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  receiptNo: string;
  updatedAt?: unknown;
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  officeEmail: string;
  officeRoom: string;
  officeHours: string;
  specialization: string;
  photoUrl: string;
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  courseCode: string;
  courseTitle: string;
  facultyName: string;
  room: string;
  department: string;
  semester: number;
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface CollegeTiming {
  id: string;
  facility: string;
  category: 'Academic' | 'Library' | 'Administration' | 'Laboratory' | 'Student Services';
  weekdaysHours: string;
  weekendHours: string;
  location: string;
  notes: string;
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: 'Examination' | 'Academic' | 'Administration' | 'Events' | 'Scholarship';
  priority: 'Normal' | 'Important' | 'Urgent';
  summary: string;
  body: string;
  publishedDate: string;
  postedBy: string;
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface ScholarshipItem {
  id: string;
  name: string;
  provider: string;
  amount: string;
  eligibility: string;
  deadline: string;
  category: 'Merit' | 'Need-Based' | 'Research' | 'Sports' | 'STEM';
  status: 'Open' | 'Closing Soon' | 'Closed';
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface PlacementDrive {
  id: string;
  company: string;
  role: string;
  packageLpa: string;
  minCgpa: number;
  driveDate: string;
  location: string;
  eligibleBranches: string;
  status: 'Upcoming' | 'Registration Open' | 'Completed';
  isPublished: boolean;
  updatedAt?: unknown;
}

export interface SystemSettings {
  institutionName: string;
  academicYear: string;
  currentSemester: string;
  minAttendancePercent: number;
  aiAssistantEnabled: boolean;
  strictAcademicMode: boolean;
  googleSearchRedirectBase: string;
  supportEmail: string;
  supportPhone: string;
  portalAnnouncement: string;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scope?: 'academic' | 'general';
  searchQuery?: string;
  searchUrl?: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: string;
}
