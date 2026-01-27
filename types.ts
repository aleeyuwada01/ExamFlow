
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
  TEACHER = 'TEACHER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PlanTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  ULTRA = 'ULTRA'
}

export interface TopUpRequest {
  id: string;
  user_id: string;
  user_name: string;
  school_id: string;
  school_name: string;
  amount: number;
  plan?: PlanTier;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  timestamp: number;
}

export interface SystemConfig {
  gemini_api_key: string;
  initialFreeTokens: number;
  maxTeachersWithFreeTokens: number;
  starterPrice: number;
  ultraPrice: number;
  socialLinks: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  updated_at: number;
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export const NIGERIAN_SUBJECTS = [
  "Mathematics", "English Language", "Basic Science", "Basic Technology",
  "Civic Education", "Social Studies", "Agricultural Science", "Business Studies",
  "Home Economics", "Christian Religious Studies", "Islamic Religious Studies",
  "Yoruba", "Igbo", "Hausa", "Physics", "Chemistry", "Biology", "Economics",
  "Government", "Literature-in-English", "Geography", "History",
  "Computer Studies", "Physical & Health Education"
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
  school_id: string;
  state: string;
  subjects: string[];
  classes?: string[]; 
  password?: string; 
  created_at: number;
  tokens: number;
  plan: PlanTier; 
}

export interface School {
  id: string;
  name: string;
  state: string;
  logo_url?: string; 
  plan: PlanTier;
  tokens: number; 
  template: {
    header_layout: 'LEFT' | 'CENTER';
    show_exam_type: boolean;
    footer_text: string;
    font_family: 'sans' | 'serif' | 'mono';
    theme_color: string;
  };
  created_at: number;
}

export interface UsageLog {
  id: string;
  user_id: string;
  school_id: string;
  feature: 'OCR' | 'GENERATION' | 'REFINEMENT' | 'COMPLIANCE';
  model: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  user_id: string;
  user_name: string;
  school_id: string;
  action_type: 'AUTH' | 'EXAM_CREATE' | 'EXAM_UPDATE' | 'EXAM_STATUS' | 'SETTINGS' | 'TEACHER_MGMT' | 'ADMIN_CONFIG' | 'TOPUP';
  description: string;
  timestamp: number;
  metadata?: any;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correct_answer?: string;
  marks?: number;
  subject?: string; 
  topic?: string;
  difficulty?: Difficulty;
  blooms_level?: BloomsLevel;
  rubric?: string;
  school_id?: string; 
  created_at?: number;
}

export interface ExamSection {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
}

export interface ExamHeader {
  school_name: string;
  class_name: string;
  subject: string;
  term: string;
  duration: string;
  exam_type: string;
  general_instructions: string;
}

export interface ExamPaper {
  id: string;
  school_id: string;
  author_id: string;
  author_name: string;
  status: ExamStatus;
  feedback?: string; 
  header: ExamHeader;
  sections: ExamSection[];
  created_at: number;
  updated_at: number;
  qr_code_data: string;
}

export type ViewState = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'SNAP_INPUT' | 'AI_INPUT' | 'BANK_INPUT' | 'EDITOR' | 'PREVIEW' | 'SETTINGS' | 'REVIEW' | 'SCAN' | 'QR_SUMMARY' | 'ADMIN_DASHBOARD' | 'PRICING';
