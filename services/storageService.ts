
import { User, School, ExamPaper, Question, UserRole, ExamStatus } from "../types";

const STORAGE_KEYS = {
  USERS: 'examflow_users',
  SCHOOLS: 'examflow_schools',
  PAPERS: 'examflow_papers',
  QUESTIONS: 'examflow_questions',
  CURRENT_USER: 'examflow_auth_user',
  THEME: 'examflow_theme'
};

// --- Authentication ---

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const loginUser = (email: string, password?: string): User | null => {
  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    // Check password if one is provided and user has one
    if (password && user.password && user.password !== password) {
        return null;
    }
    // If user has no password (legacy) or password matches
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const registerSchoolAndOfficer = (schoolName: string, officerName: string, email: string, password?: string): User => {
  const schoolId = crypto.randomUUID();
  const school: School = {
    id: schoolId,
    name: schoolName,
    template: {
      headerLayout: 'CENTER',
      showExamType: true,
      footerText: 'Exam produced by ExamFlow',
      fontFamily: 'sans',
      themeColor: '#000000'
    }
  };

  const officer: User = {
    id: crypto.randomUUID(),
    name: officerName,
    email: email,
    role: UserRole.EXAM_OFFICER,
    schoolId: schoolId,
    subjects: [],
    password: password
  };

  saveSchool(school);
  saveUser(officer);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(officer));
  return officer;
};

// --- Data Management ---

export const getSchool = (schoolId: string): School | undefined => {
  const schools = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHOOLS) || '[]');
  return schools.find((s: School) => s.id === schoolId);
};

export const saveSchool = (school: School) => {
  const schools = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHOOLS) || '[]');
  const idx = schools.findIndex((s: School) => s.id === school.id);
  if (idx >= 0) schools[idx] = school;
  else schools.push(school);
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
};

export const getAllUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

export const saveUser = (user: User) => {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getSchoolTeachers = (schoolId: string): User[] => {
  return getAllUsers().filter(u => u.schoolId === schoolId && u.role === UserRole.TEACHER);
};

export const generateTeacherCredentials = (schoolName: string, subject: string, className: string) => {
    // Create a slug for the school name (e.g. "Lagos Model College" -> "lagosmodelcollege")
    const schoolSlug = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
    const subjectSlug = subject.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const classSlug = className.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const email = `${subjectSlug}.${classSlug}@${schoolSlug}.examflow.com`;
    const name = `${subject} Teacher (${className})`;
    // Generate simple random password
    const password = Math.random().toString(36).slice(-8); 
    
    return { name, email, password };
};

export const bulkCreateUsers = (csvText: string, schoolId: string): { created: number, errors: string[] } => {
    const lines = csvText.split('\n');
    let created = 0;
    const errors: string[] = [];
    const users = getAllUsers();

    // Check if first line looks like header
    const startIdx = lines[0].toLowerCase().includes('email') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Expected CSV format: Name, Email, Password, Subjects(pipe separated), Classes(pipe separated)
        // e.g. "John Doe, john@school.com, pass123, Maths|English, JSS1|JSS2"
        
        // Handle basic CSV splitting (ignoring quoted commas for simplicity in this MVP)
        const parts = line.split(',');

        if (parts.length < 2) {
            errors.push(`Line ${i+1}: Invalid format. Requires Name and Email.`);
            continue;
        }

        const name = parts[0].trim();
        const email = parts[1].trim();
        const password = parts[2]?.trim() || 'password123'; // Default password if missing
        const subjects = parts[3] ? parts[3].split('|').map(s => s.trim()) : [];
        const classes = parts[4] ? parts[4].split('|').map(c => c.trim()) : [];

        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            errors.push(`Line ${i+1}: Email ${email} already exists.`);
            continue;
        }

        const newUser: User = {
            id: crypto.randomUUID(),
            name,
            email,
            password,
            role: UserRole.TEACHER,
            schoolId,
            subjects,
            classes
        };

        users.push(newUser);
        created++;
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { created, errors };
};

// --- Exam Papers ---

export const saveExamPaper = (paper: ExamPaper) => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  const idx = papers.findIndex((p: ExamPaper) => p.id === paper.id);
  if (idx >= 0) papers[idx] = paper;
  else papers.push(paper);
  localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
};

export const getExamPapers = (schoolId: string): ExamPaper[] => {
  const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
  return papers.filter((p: ExamPaper) => p.schoolId === schoolId);
};

export const getMyPapers = (userId: string): ExamPaper[] => {
    const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
    return papers.filter((p: ExamPaper) => p.authorId === userId);
}

export const getPaperByQR = (qrData: string): ExamPaper | undefined => {
    const papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
    return papers.find((p: ExamPaper) => p.qrCodeData === qrData);
}

// --- Question Bank ---

export const saveQuestionsToBank = (questions: Question[]) => {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
  const updated = [...existing, ...questions];
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
};

export const getQuestionBank = (schoolId?: string): Question[] => {
    // Returns global questions (no schoolId) OR school specific questions
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
    return all.filter((q: Question) => !q.schoolId || q.schoolId === schoolId);
};

// --- Settings ---
export const saveTheme = (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
};

export const getTheme = (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
};
