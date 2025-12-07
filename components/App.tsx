
import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { ExamEditor } from './ExamEditor';
import { Preview } from './Preview';
import { Auth } from './Auth';
import { SchoolSettings } from './SchoolSettings';
import { ReviewDashboard } from './ReviewDashboard';
import { SnapToText } from './inputs/SnapToText';
import { AIGenerator } from './inputs/AIGenerator';
import { QuestionBank } from './inputs/QuestionBank';
import { QRScanner } from './QRScanner';
import { QRSummarySheet } from './QRSummarySheet';
import { LandingPage } from './LandingPage';
import { ExamPaper, ExamSection, ViewState, User, ExamStatus } from '../types';
import { getCurrentUser, logoutUser, getSchool, getPaperByQR, saveTheme, getTheme, saveExamPaper } from '../services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Auth Check
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView('DASHBOARD');
    }

    // Theme Check
    const savedTheme = getTheme();
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
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
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentView('LANDING');
    setPaper(null);
  };

  const createNewPaper = () => {
    if (!currentUser) return undefined;
    const school = getSchool(currentUser.schoolId);
    
    // Create new blank paper
    const newPaper: ExamPaper = {
      id: crypto.randomUUID(),
      schoolId: currentUser.schoolId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      status: ExamStatus.DRAFT,
      createdAt: Date.now(),
      qrCodeData: `EXAM-${crypto.randomUUID()}`,
      header: {
        schoolName: school?.name || "School Name",
        className: "JSS 1",
        subject: currentUser.subjects[0] || "Mathematics",
        term: "First Term",
        duration: "1 Hour",
        examType: "Continuous Assessment",
        generalInstructions: "Answer all questions.",
      },
      sections: []
    };
    setPaper(newPaper);
    // Also save initial draft immediately
    saveExamPaper(newPaper);
    return newPaper;
  };

  const handleInputSuccess = (newSections: ExamSection[]) => {
    // Use current state or create new if null
    let updatedPaper = paper;
    
    if (!updatedPaper) {
        updatedPaper = createNewPaper() || null;
    }

    if (updatedPaper) {
        const newPaperState = {
             ...updatedPaper,
             sections: [...updatedPaper.sections, ...newSections]
        };
        setPaper(newPaperState);
        saveExamPaper(newPaperState); // Auto-save immediately
    }
    
    setCurrentView('EDITOR');
  };

  const handleEditPaper = (p: ExamPaper) => {
      setPaper(p);
      setCurrentView('EDITOR');
  };

  const handleQRScan = (data: string) => {
      const foundPaper = getPaperByQR(data);
      if (foundPaper) {
          setPaper(foundPaper);
          setCurrentView('EDITOR'); // Or PREVIEW, depending on preference
      } else {
          alert("Paper not found for this QR code.");
          setCurrentView('DASHBOARD');
      }
  };

  // Router
  const renderView = () => {
    // If NOT logged in, allow specific public views or auth
    if (!currentUser) {
        if (currentView === 'AUTH') return <Auth onLogin={handleLogin} />;
        return <LandingPage onGetStarted={() => setCurrentView('AUTH')} onLogin={() => setCurrentView('AUTH')} />;
    }

    switch (currentView) {
      case 'AUTH':
        // If logged in, auth redirects to dashboard
        return <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={handleEditPaper} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case 'LANDING':
         // Logged in users shouldn't really see landing, but if they do, redirect to dashboard
         return <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={handleEditPaper} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case 'DASHBOARD':
        return (
            <Dashboard 
                currentUser={currentUser} 
                onNavigate={setCurrentView} 
                onLogout={handleLogout} 
                onEditPaper={handleEditPaper} 
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />
        );
      case 'SNAP_INPUT':
        if(!paper) createNewPaper();
        return <SnapToText onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'AI_INPUT':
        if(!paper) createNewPaper();
        return <AIGenerator onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'BANK_INPUT':
        if(!paper) createNewPaper();
        return <QuestionBank onSuccess={handleInputSuccess} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'EDITOR':
        return paper ? <ExamEditor paper={paper} currentUser={currentUser} setPaper={(p) => setPaper(p as ExamPaper)} onNavigate={setCurrentView} /> : <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={handleEditPaper} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case 'PREVIEW':
        return paper ? <Preview paper={paper} onNavigate={setCurrentView} currentUser={currentUser} /> : null;
      case 'SETTINGS':
        return <SchoolSettings currentUser={currentUser} onBack={() => setCurrentView('DASHBOARD')} />;
      case 'REVIEW':
        return <ReviewDashboard currentUser={currentUser} onNavigate={() => setCurrentView('DASHBOARD')} onEditPaper={handleEditPaper} />;
      case 'SCAN':
        return <QRScanner onScan={handleQRScan} onCancel={() => setCurrentView('DASHBOARD')} />;
      case 'QR_SUMMARY':
        return <QRSummarySheet currentUser={currentUser} onNavigate={() => setCurrentView('DASHBOARD')} />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} onEditPaper={handleEditPaper} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {renderView()}
    </div>
  );
};

export default App;
