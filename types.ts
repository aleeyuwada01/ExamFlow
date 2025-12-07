
export enum QuestionType {
  OBJECTIVE = 'OBJ',
  FILL_IN_THE_BLANK = 'FILL',
  THEORY = 'THEORY'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum BloomsLevel {
  REMEMBER = 'Remember',
  UNDERSTAND = 'Understand',
  APPLY = 'Apply',
  ANALYZE = 'Analyze',
  EVALUATE = 'Evaluate',
  CREATE = 'Create'
}

export enum UserRole {
  EXAM_OFFICER = 'EXAM_OFFICER',
  TEACHER = 'TEACHER'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export const NIGERIAN_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Basic Technology",
  "Civic Education",
  "Social Studies",
  "Agricultural Science",
  "Business Studies",
  "Home Economics",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Yoruba",
  "Igbo",
  "Hausa",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature-in-English",
  "Geography",
  "History",
  "Computer Studies",
  "Physical & Health Education"
];

export const SCHOOL_CLASSES = [
  "JSS 1", "JSS 2", "JSS 3", 
  "SS 1", "SS 2", "SS 3"
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  subjects: string[];
  classes?: string[]; 
  password?: string; 
}

export interface School {
  id: string;
  name: string;
  logoUrl?: string; 
  template: {
    headerLayout: 'LEFT' | 'CENTER';
    showExamType: boolean;
    footerText: string;
    fontFamily: 'sans' | 'serif' | 'mono';
    themeColor: string;
  }
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For OBJ
  correctAnswer?: string; // For Marking Scheme
  marks?: number;
  subject?: string; 
  topic?: string;
  difficulty?: Difficulty;
  bloomsLevel?: BloomsLevel; // New
  rubric?: string; // New for Theory
  schoolId?: string; 
}

export interface ExamSection {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
}

export interface ExamHeader {
  schoolName: string;
  className: string;
  subject: string;
  term: string;
  duration: string;
  examType: string;
  generalInstructions: string;
}

export interface ComplianceReport {
    score: number;
    issues: string[];
    suggestions: string[];
}

export interface ExamPaper {
  id: string;
  schoolId: string;
  authorId: string;
  authorName: string;
  status: ExamStatus;
  feedback?: string; 
  header: ExamHeader;
  sections: ExamSection[];
  createdAt: number;
  qrCodeData: string;
  complianceReport?: ComplianceReport; // New
}

export type ViewState = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'SNAP_INPUT' | 'AI_INPUT' | 'BANK_INPUT' | 'EDITOR' | 'PREVIEW' | 'SETTINGS' | 'REVIEW' | 'SCAN' | 'QR_SUMMARY';
