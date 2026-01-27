
import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { ExamEditor } from './ExamEditor';
import { Preview } from './Preview';
import { Auth } from './Auth';
import { SchoolSettings } from './SchoolSettings';
import { ReviewDashboard } from './ReviewDashboard';
import { AdminDashboard } from './AdminDashboard';
import { PricingPage } from './PricingPage';
import { SnapToText } from './inputs/SnapToText';
import { AIGenerator } from './inputs/AIGenerator';
import { QuestionBank } from './inputs/QuestionBank';
import { QRScanner } from './QRScanner';
import { QRSummarySheet } from './QRSummarySheet';
import { LandingPage } from './LandingPage';
import { ExamPaper, ExamSection, ViewState, User, ExamStatus, UserRole } from '../types';
import { getCurrentUser, logoutUser, getSchool, getPaperByQR, saveTheme, getTheme, saveExamPaper, recordActivity } from '../services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView(user.role === UserRole.SUPER_ADMIN ? 'ADMIN_DASHBOARD' : 'DASHBOARD');
    }

    const savedTheme = getTheme();
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          saveTheme('dark');
      } else {
          document.documentElement.classList.remove('dark');
          saveTheme('light');
      }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView(user.role === UserRole.SUPER_ADMIN ? 'ADMIN_DASHBOARD' : 'DASHBOARD');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentView('LANDING');
    setPaper(null);
  };

  const handleInputSuccess = (newSections: ExamSection[]) => {
    try {
        let updatedPaper = paper;
        if (!updatedPaper) {
            const school = getSchool(currentUser!.school_id);
            updatedPaper = {
                id: crypto.randomUUID(),
                school_id: currentUser!.school_id,
                author_id: currentUser!.id,
                author_name: currentUser!.name,
                status: ExamStatus.DRAFT,
                created_at: Date.now(),
                updated_at: Date.now(),
                qr_code_data: `EXAM-${crypto.randomUUID()}`,
                header: {
                  school_name: school?.name || "School Name",
                  class_name: "JSS 1",
                  subject: currentUser!.subjects[0] || "Mathematics",
                  term: "First Term",
                  duration: "1 Hour",
                  exam_type: "Continuous Assessment",
                  general_instructions: "Answer all questions.",
                },
                sections: []
            };
        }
        
        const newPaperState = {
             ...updatedPaper,
             sections: [...updatedPaper.sections, ...newSections],
             updated_at: Date.now()
        };
        setPaper(newPaperState);
        saveExamPaper(newPaperState, true); 
        setCurrentView('EDITOR');
    } catch (e: any) {
        if (e.message.includes("Insufficient AI Tokens")) {
            window.dispatchEvent(new CustomEvent('ai-tokens-exhausted'));
            setCurrentView('DASHBOARD');
        } else {
            alert(e.message || "An error occurred.");
        }
    }
  };

  const renderView = () => {
    if (!currentUser) {
        if (currentView === 'AUTH') return <Auth onLogin={handleLogin} />;
        if (currentView === 'PRICING') return <PricingPage onBack={() => setCurrentView('LANDING')} onSelectPlan={() => setCurrentView('AUTH')} />;
        return <LandingPage onGetStarted={() => setCurrentView('AUTH')} onLogin={() => setCurrentView('AUTH')} />;
    }

    switch (currentView) {
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard onBack={handleLogout} />;
      case 'DASHBOARD':
        return <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={(p) => { setPaper(p); setCurrentView('EDITOR'); }} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case 'PRICING':
        return <PricingPage onBack={() => setCurrentView('DASHBOARD')} onSelectPlan={() => setCurrentView('DASHBOARD')} />;
      case 'SNAP_INPUT':
        return <SnapToText onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'AI_INPUT':
        return <AIGenerator onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'BANK_INPUT':
        return <QuestionBank onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'EDITOR':
        return paper ? <ExamEditor paper={paper} currentUser={currentUser} setPaper={(p) => setPaper(p as ExamPaper)} onNavigate={setCurrentView} /> : null;
      case 'PREVIEW':
        return paper ? <Preview paper={paper} onNavigate={setCurrentView} currentUser={currentUser} /> : null;
      case 'SETTINGS':
        return <SchoolSettings currentUser={currentUser} onBack={() => setCurrentView('DASHBOARD')} />;
      case 'REVIEW':
        return <ReviewDashboard currentUser={currentUser} onNavigate={() => setCurrentView('DASHBOARD')} onEditPaper={(p) => { setPaper(p); setCurrentView('EDITOR'); }} />;
      case 'SCAN':
        return <QRScanner onScan={(data) => {
            const found = getPaperByQR(data);
            if (found) { setPaper(found); setCurrentView('EDITOR'); } else alert("Not found");
        }} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'QR_SUMMARY':
        return <QRSummarySheet currentUser={currentUser} onNavigate={() => setCurrentView('DASHBOARD')} />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={(p) => { setPaper(p); setCurrentView('EDITOR'); }} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {renderView()}
    </div>
  );
};

export default App;
