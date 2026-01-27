
import { User, School, ExamPaper, Question, UserRole, ExamStatus, LogEntry, UsageLog, PlanTier, TopUpRequest, SystemConfig } from "../types";

const STORAGE_KEYS = {
  USERS: 'users',
  SCHOOLS: 'schools',
  PAPERS: 'exam_papers',
  QUESTIONS: 'question_bank',
  LOGS: 'activity_logs',
  USAGE: 'usage_logs',
  CONFIG: 'system_config',
  CURRENT_USER: 'auth_session',
  THEME: 'ui_theme',
  TOPUP_REQUESTS: 'topup_requests'
};

const DEFAULT_CONFIG: SystemConfig = {
  gemini_api_key: '',
  initialFreeTokens: 30,
  maxTeachersWithFreeTokens: 3,
  starterPrice: 999,
  ultraPrice: 2999,
  socialLinks: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: ''
  },
  updated_at: Date.now()
};

// --- System Config ---

export const saveSystemConfig = (config: Partial<SystemConfig>) => {
  const existing = getSystemConfig();
  const updated = { ...existing, ...config, updated_at: Date.now() };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
};

export const getSystemConfig = (): SystemConfig => {
  const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
};

// --- Token & Business Logic ---

export const deductToken = (userId: string, amount: number = 1): boolean => {
    const users = getAllUsers();
    const schools = getAllSchools();
    const userIdx = users.findIndex(u => u.id === userId);
    
    if (userIdx === -1) return false;
    const user = users[userIdx];
    
    // BUSINESS RULE: Unlimited access is per-account.
    // If the specific user is on ULTRA, skip deduction.
    if (user.plan === PlanTier.ULTRA) {
        return true;
    }

    // 1. Check user personal tokens first
    if (user.tokens >= amount) {
        user.tokens -= amount;
        saveUser(user);
        const curr = getCurrentUser();
        if (curr?.id === userId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return true;
    }
    
    // 2. Check shared school tokens pool
    const schoolIdx = schools.findIndex(s => s.id === user.school_id);
    if (schoolIdx !== -1) {
        const school = schools[schoolIdx];
        if (school.tokens >= amount) {
            school.tokens -= amount;
            saveSchool(school);
            return true;
        }
    }
    
    return false;
};

export const getBalance = (userId: string) => {
    const user = getAllUsers().find(u => u.id === userId);
    const school = getAllSchools().find(s => s.id === user?.school_id);
    return {
        personal: user?.tokens || 0,
        school: school?.tokens || 0,
        plan: user?.plan || PlanTier.FREE
    };
};

export const createTopUpRequest = (userId: string, amount: number, plan?: PlanTier) => {
    const user = getAllUsers().find(u => u.id === userId);
    const school = getSchool(user?.school_id || '');
    const requests = getTopUpRequests();
    
    const newRequest: TopUpRequest = {
        id: crypto.randomUUID(),
        user_id: userId,
        user_name: user?.name || 'Unknown',
        school_id: school?.id || '',
        school_name: school?.name || 'Standalone Teacher',
        amount,
        plan,
        status: 'PENDING',
        timestamp: Date.now()
    };
    
    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(requests));
};

export const getTopUpRequests = (): TopUpRequest[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TOPUP_REQUESTS) || '[]');

export const resolveTopUpRequest = (requestId: string, status: 'COMPLETED' | 'CANCELLED') => {
    const requests = getTopUpRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return;
    
    const req = requests[idx];
    req.status = status;
    
    if (status === 'COMPLETED') {
        const users = getAllUsers();
        const userIdx = users.findIndex(u => u.id === req.user_id);
        
        if (userIdx !== -1) {
            const user = users[userIdx];
            user.tokens += req.amount;
            if (req.plan) user.plan = req.plan;
            saveUser(user);
            
            const curr = getCurrentUser();
            if (curr?.id === user.id) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
    }
    
    localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(requests));
};

// --- Authentication & Identity ---

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const loginUser = (email: string, password?: string): User | null => {
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail === 'admin@examflow.ai' && password === 'admin123') {
      const admin: User = {
          id: 'admin-master',
          name: 'Site Owner',
          email: 'admin@examflow.ai',
          role: UserRole.SUPER_ADMIN,
          school_id: 'SYSTEM_HQ',
          state: 'FCT - Abuja',
          subjects: [],
          created_at: Date.now(),
          tokens: 999999,
          plan: PlanTier.ULTRA
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(admin));
      return admin;
  }

  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (user) {
    if (password && user.password && user.password !== password) return null;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const registerSchoolAndOfficer = (schoolName: string, state: string, officerName: string, email: string, password?: string): User => {
  const config = getSystemConfig();
  const schoolId = crypto.randomUUID();
  const school: School = {
    id: schoolId,
    name: schoolName,
    state: state,
    plan: PlanTier.FREE,
    tokens: config.initialFreeTokens,
    created_at: Date.now(),
    template: {
      header_layout: 'CENTER',
      show_exam_type: true,
      footer_text: 'Exam produced by ExamFlow AI',
      font_family: 'sans',
      theme_color: '#4F46E5'
    }
  };

  const officer: User = {
    id: crypto.randomUUID(),
    name: officerName,
    email: email,
    role: UserRole.EXAM_OFFICER,
    school_id: schoolId,
    state: state,
    subjects: [],
    password: password,
    created_at: Date.now(),
    tokens: config.initialFreeTokens,
    plan: PlanTier.FREE
  };

  saveSchool(school);
  saveUser(officer);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(officer));
  return officer;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// --- Storage Utilities ---

export const getAllSchools = (): School[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHOOLS) || '[]');
export const getSchool = (schoolId: string): School | undefined => getAllSchools().find(s => s.id === schoolId);
export const saveSchool = (school: School) => {
  const schools = getAllSchools();
  const idx = schools.findIndex(s => s.id === school.id);
  if (idx >= 0) schools[idx] = school;
  else schools.push(school);
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
};

export const getAllUsers = (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
export const saveUser = (user: User) => {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const recordActivity = (user: User, action_type: LogEntry['action_type'], description: string) => {
  const logs: LogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  logs.unshift({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_name: user.name,
    school_id: user.school_id,
    action_type,
    description,
    timestamp: Date.now()
  });
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 1000)));
};

export const getAllLogs = (): LogEntry[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
export const getSchoolLogs = (schoolId: string) => getAllLogs().filter(l => l.school_id === schoolId);
export const getQuestionBank = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
export const saveQuestionsToBank = (qs: Question[]) => {
    const existing = getQuestionBank();
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([...existing, ...qs]));
};

export const saveExamPaper = (paper: ExamPaper, skipLog: boolean = false) => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  const idx = papers.findIndex((p: ExamPaper) => p.id === paper.id);
  const updatedPaper = { ...paper, updated_at: Date.now() };
  if (idx >= 0) papers[idx] = updatedPaper;
  else papers.push(updatedPaper);
  localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
  if (!skipLog) {
      const user = getCurrentUser();
      if (user) recordActivity(user, idx >= 0 ? 'EXAM_UPDATE' : 'EXAM_CREATE', `Exam: ${paper.header.subject}`);
  }
};

export const getExamPapers = (schoolId: string): ExamPaper[] => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  return papers.filter((p: ExamPaper) => p.school_id === schoolId);
};

export const getMyPapers = (userId: string): ExamPaper[] => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  return papers.filter((p: ExamPaper) => p.author_id === userId);
};

export const getPaperByQR = (qrData: string): ExamPaper | undefined => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  return papers.find((p: ExamPaper) => p.qr_code_data === qrData);
};

export const trackAIUsage = (user_id: string, school_id: string, feature: UsageLog['feature'], model: string) => {
  const logs: UsageLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USAGE) || '[]');
  logs.unshift({
    id: crypto.randomUUID(),
    user_id,
    school_id,
    feature,
    model,
    timestamp: Date.now()
  });
  localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(logs.slice(0, 5000)));
};

export const getUsageStats = (): UsageLog[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USAGE) || '[]');

export const saveTheme = (theme: 'light' | 'dark') => localStorage.setItem(STORAGE_KEYS.THEME, theme);
export const getTheme = (): 'light' | 'dark' => (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';

export const bulkCreateUsers = (csv: string, school_id: string) => {
    const lines = csv.split('\n').filter(l => l.trim());
    lines.forEach(l => {
        const [name, email, password] = l.split(',');
        saveUser({
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.trim(),
            password: password?.trim() || 'teacher123',
            role: UserRole.TEACHER,
            school_id,
            state: 'Unknown',
            subjects: [],
            created_at: Date.now(),
            tokens: 0,
            plan: PlanTier.FREE
        });
    });
    return { created: lines.length, errors: [] };
};

export const getSchoolTeachers = (schoolId: string): User[] => {
  return getAllUsers().filter(u => u.school_id === schoolId && u.role === UserRole.TEACHER);
};

export const generateTeacherCredentials = (schoolName: string, subject: string, cls: string) => {
    return {
        name: `${subject} (${cls}) Teacher`,
        email: `${subject.toLowerCase()}.${cls.toLowerCase().replace(' ','')}@school.edu.ng`,
        password: Math.random().toString(36).slice(-8)
    };
};
