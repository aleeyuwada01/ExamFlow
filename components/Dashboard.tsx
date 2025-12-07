
import React, { useEffect, useState } from 'react';
import { ViewState, User, UserRole, ExamPaper, ExamStatus, Difficulty } from '../types';
import { getMyPapers, getExamPapers } from '../services/storageService';

interface DashboardProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  onEditPaper: (paper: ExamPaper) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate, onLogout, onEditPaper, isDarkMode, toggleTheme }) => {
  const [recentPapers, setRecentPapers] = useState<ExamPaper[]>([]);
  const [stats, setStats] = useState({ pending: 0, total: 0 });
  const [mobileTab, setMobileTab] = useState<'HOME' | 'CREATE' | 'MENU'>('HOME');

  useEffect(() => {
    if (currentUser.role === UserRole.TEACHER) {
      const myPapers = getMyPapers(currentUser.id);
      setRecentPapers(myPapers.sort((a, b) => b.createdAt - a.createdAt));
    } else {
      const schoolPapers = getExamPapers(currentUser.schoolId);
      const pending = schoolPapers.filter(p => p.status === ExamStatus.PENDING_REVIEW).length;
      setStats({ pending, total: schoolPapers.length });
    }
  }, [currentUser]);

  // Insights Logic - Focus on the most recent paper/subject
  const calculateDifficultyDistribution = () => {
      if (recentPapers.length === 0) return null;
      
      // Get the most recent paper (first in array as it's sorted)
      const latestPaper = recentPapers[0];
      const subject = latestPaper.header.subject;

      let easy = 0, medium = 0, hard = 0, total = 0;
      
      latestPaper.sections.forEach(s => {
          s.questions.forEach(q => {
              total++;
              if(q.difficulty === Difficulty.HARD) hard++;
              else if(q.difficulty === Difficulty.MEDIUM) medium++;
              else easy++;
          });
      });

      if (total === 0) return null;
      
      return { 
          subject,
          easy: (easy/total)*100, 
          medium: (medium/total)*100, 
          hard: (hard/total)*100 
      };
  };

  const insights = calculateDifficultyDistribution();

  const ActionButtons = () => (
    <>
        {currentUser.role === UserRole.TEACHER ? (
          <>
            <button onClick={() => onNavigate('SNAP_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-primary dark:hover:border-indigo-500 text-left transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-camera text-6xl text-blue-600"></i>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><i className="fas fa-camera text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Snap-to-Text</h3>
              <p className="text-xs text-slate-500 mt-1 md:hidden">Convert handwriting to text</p>
            </button>
            <button onClick={() => onNavigate('AI_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-purple-500 text-left transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-magic text-6xl text-purple-600"></i>
              </div>
               <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400"><i className="fas fa-magic text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Generator</h3>
              <p className="text-xs text-slate-500 mt-1 md:hidden">Auto-generate questions</p>
            </button>
            <button onClick={() => onNavigate('BANK_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-emerald-500 text-left transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-database text-6xl text-emerald-600"></i>
              </div>
               <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400"><i className="fas fa-database text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Question Bank</h3>
              <p className="text-xs text-slate-500 mt-1 md:hidden">Select past questions</p>
            </button>
          </>
        ) : (
          <>
             <button onClick={() => onNavigate('REVIEW')} className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-amber-500 text-left transition-colors">
               {stats.pending > 0 && <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{stats.pending} New</span>}
               <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400"><i className="fas fa-clipboard-check text-xl"></i></div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Review Papers</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stats.pending} papers pending approval</p>
            </button>
            <button onClick={() => onNavigate('SETTINGS')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-blue-500 text-left transition-colors">
               <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><i className="fas fa-users-cog text-xl"></i></div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Manage School</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Teachers & Templates</p>
            </button>
            <button onClick={() => onNavigate('BANK_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-emerald-500 text-left transition-colors">
               <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400"><i className="fas fa-upload text-xl"></i></div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Manage Questions</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Upload to Bank</p>
            </button>
          </>
        )}
    </>
  );

  const InsightsWidget = () => (
      currentUser.role === UserRole.TEACHER && insights && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-6">
            <h4 className="font-bold text-lg mb-2"><i className="fas fa-chart-pie mr-2"></i> Pedagogical Insights</h4>
            <p className="text-sm opacity-90 mb-4">
                Here is the difficulty balance for your recent <strong>{insights.subject}</strong> questions.
            </p>
            <div className="flex gap-4 items-end h-24 mb-2">
                <div className="w-1/3 flex flex-col justify-end">
                    <div className="bg-green-300 rounded-t-lg transition-all" style={{ height: `${insights.easy}%` }}></div>
                    <span className="text-xs font-bold mt-1 text-center">Easy ({Math.round(insights.easy)}%)</span>
                </div>
                <div className="w-1/3 flex flex-col justify-end">
                    <div className="bg-amber-300 rounded-t-lg transition-all" style={{ height: `${insights.medium}%` }}></div>
                    <span className="text-xs font-bold mt-1 text-center">Med ({Math.round(insights.medium)}%)</span>
                </div>
                <div className="w-1/3 flex flex-col justify-end">
                        <div className="bg-red-300 rounded-t-lg transition-all" style={{ height: `${insights.hard}%` }}></div>
                        <span className="text-xs font-bold mt-1 text-center">Hard ({Math.round(insights.hard)}%)</span>
                </div>
            </div>
            {insights.easy > 60 && <p className="text-xs bg-white/20 p-2 rounded mt-2"><i className="fas fa-lightbulb text-yellow-300 mr-1"></i> Tip: Try adding more Medium questions for better assessment depth.</p>}
        </div>
    )
  );

  const RecentPapersList = () => (
     <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h4 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">
            {currentUser.role === UserRole.TEACHER ? "My Papers" : "Recent Activity"}
        </h4>
        <ul className="space-y-3">
            {(currentUser.role === UserRole.TEACHER ? recentPapers : []).map(p => (
                <li key={p.id} onClick={() => onEditPaper(p)} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors">
                    <div>
                        <p className="font-medium text-slate-800 dark:text-white line-clamp-1">{p.header.subject}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.header.className} • {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${p.status === ExamStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p.status === ExamStatus.REJECTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {p.status}
                    </span>
                </li>
            ))}
            {currentUser.role === UserRole.TEACHER && recentPapers.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm">No papers created yet.</p>}
            {currentUser.role === UserRole.EXAM_OFFICER && <p className="text-slate-400 dark:text-slate-500 text-sm">See Review Dashboard for all details.</p>}
        </ul>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto md:p-6 pb-24 md:pb-6 transition-colors duration-200">
      
      {/* Desktop Header */}
      <header className="hidden md:flex mb-10 justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-primary dark:text-indigo-400 mb-1">ExamFlow AI</h1>
            <p className="text-secondary dark:text-slate-400 text-sm">Welcome back, {currentUser.name} ({currentUser.role === UserRole.EXAM_OFFICER ? 'Exam Officer' : 'Teacher'})</p>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                title="Toggle Dark Mode"
            >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button onClick={onLogout} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-sm font-bold">
                <i className="fas fa-sign-out-alt mr-1"></i> Logout
            </button>
        </div>
      </header>

      {/* Mobile Sticky Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                <i className="fas fa-layer-group"></i>
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">ExamFlow</span>
         </div>
         <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
             <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
         </button>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <ActionButtons />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-6">
                {InsightsWidget()}
                {RecentPapersList()}
            </div>
            <div className="md:col-span-1 space-y-4">
                 <button onClick={() => onNavigate('SCAN')} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-xl shadow-lg hover:opacity-90 transition-all text-center">
                     <i className="fas fa-qrcode text-3xl mb-2 block"></i>
                     <span className="font-bold">Scan Exam QR</span>
                 </button>
                 <button onClick={() => onNavigate('QR_SUMMARY')} className="w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center">
                     <i className="fas fa-print text-3xl mb-2 block text-primary dark:text-indigo-400"></i>
                     <span className="font-bold">QR Code Sheet</span>
                 </button>
            </div>
        </div>
      </div>

      {/* Mobile Mobile Views */}
      <div className="md:hidden p-4 space-y-6">
          {mobileTab === 'HOME' && (
              <>
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <p className="opacity-80 text-xs uppercase font-bold tracking-wider mb-1">Welcome back,</p>
                    <h2 className="text-2xl font-bold truncate">{currentUser.name.split(' ')[0]}</h2>
                    <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded">{currentUser.role === UserRole.TEACHER ? 'Teacher' : 'Exam Officer'}</p>
                </div>
                {InsightsWidget()}
                {RecentPapersList()}
              </>
          )}

          {mobileTab === 'CREATE' && (
              <div className="space-y-4 pt-2 pb-24">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Create New Exam</h2>
                 <div className="grid grid-cols-1 gap-4">
                    <ActionButtons />
                 </div>
              </div>
          )}

          {mobileTab === 'MENU' && (
              <div className="space-y-4 pt-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Menu</h2>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
                      <button onClick={() => onNavigate('SCAN')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center"><i className="fas fa-qrcode"></i></div>
                          <div className="text-left">
                              <div className="font-bold text-slate-800 dark:text-white">Scan QR Code</div>
                              <div className="text-xs text-slate-500">Find paper details instantly</div>
                          </div>
                      </button>
                      <button onClick={() => onNavigate('QR_SUMMARY')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"><i className="fas fa-print"></i></div>
                          <div className="text-left">
                              <div className="font-bold text-slate-800 dark:text-white">QR Code Sheet</div>
                              <div className="text-xs text-slate-500">Print access codes for class</div>
                          </div>
                      </button>
                      {currentUser.role === UserRole.EXAM_OFFICER && (
                           <button onClick={() => onNavigate('SETTINGS')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><i className="fas fa-cog"></i></div>
                              <div className="text-left">
                                  <div className="font-bold text-slate-800 dark:text-white">School Settings</div>
                                  <div className="text-xs text-slate-500">Manage teachers & templates</div>
                              </div>
                          </button>
                      )}
                       <button onClick={onLogout} className="w-full p-4 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-900/10">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center"><i className="fas fa-sign-out-alt"></i></div>
                          <div className="text-left">
                              <div className="font-bold text-red-600 dark:text-red-400">Log Out</div>
                          </div>
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-around items-end pb-4 pt-2 px-2 z-40 safe-area-bottom shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
         <button onClick={() => setMobileTab('HOME')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mobileTab === 'HOME' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <i className="fas fa-home text-xl mb-0.5"></i>
            <span className="text-[10px] font-bold">Home</span>
         </button>
         <button onClick={() => setMobileTab('CREATE')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mobileTab === 'CREATE' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <div className={`w-14 h-14 -mt-10 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-slate-50 dark:border-slate-900 transition-transform ${mobileTab === 'CREATE' ? 'bg-indigo-600 scale-110' : 'bg-indigo-500'}`}>
                <i className="fas fa-plus text-2xl"></i>
            </div>
            <span className="text-[10px] font-bold mt-1">Create</span>
         </button>
         <button onClick={() => setMobileTab('MENU')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mobileTab === 'MENU' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <i className="fas fa-bars text-xl mb-0.5"></i>
            <span className="text-[10px] font-bold">Menu</span>
         </button>
      </div>

    </div>
  );
};
