
import React, { useEffect, useState } from 'react';
import { ViewState, User, UserRole, ExamPaper, ExamStatus, Difficulty, PlanTier, SystemConfig } from '../types';
import { getMyPapers, getExamPapers, getBalance, createTopUpRequest, getSystemConfig } from '../services/storageService';

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
  const [wallet, setWallet] = useState<{ personal: number; school: number; plan: PlanTier }>({ personal: 0, school: 0, plan: PlanTier.FREE });
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    refreshDashboard();
    const handleExhaustion = () => setShowTopUp(true);
    window.addEventListener('ai-tokens-exhausted', handleExhaustion);
    return () => window.removeEventListener('ai-tokens-exhausted', handleExhaustion);
  }, [currentUser]);

  const refreshDashboard = () => {
    if (currentUser.role === UserRole.TEACHER) {
      const myPapers = getMyPapers(currentUser.id);
      setRecentPapers(myPapers.sort((a, b) => b.created_at - a.created_at));
    } else {
      const schoolPapers = getExamPapers(currentUser.school_id);
      const pending = schoolPapers.filter(p => p.status === ExamStatus.PENDING_REVIEW).length;
      setStats({ pending, total: schoolPapers.length });
    }
    setWallet(getBalance(currentUser.id));
    setConfig(getSystemConfig());
  };

  const handleTopUpSubmit = (amount: number, plan?: PlanTier) => {
      createTopUpRequest(currentUser.id, amount, plan); 
      alert("Top-up request sent to Admin! Please proceed to make payment to the account provided below to complete the transaction.");
      setShowTopUp(false);
  };

  const TopUpModal = () => (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-indigo-50 dark:bg-slate-900/50">
                  <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400">Upgrade Account</h3>
                  <button onClick={() => setShowTopUp(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-6 space-y-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Payment Credentials</p>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Bank: <span className="text-indigo-600">Zenith Bank</span></p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Account: <span className="font-mono bg-white dark:bg-slate-800 px-2 rounded select-all">1234567890</span></p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Name: <span className="italic uppercase">ExamFlow AI Tech</span></p>
                      </div>
                      <p className="text-[9px] mt-3 text-slate-500 italic bg-white/50 dark:bg-black/20 p-2 rounded">
                        <i className="fas fa-info-circle mr-1"></i> Memo: Use <b>{currentUser.email}</b> to identify your top-up.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Personal Plan</p>
                      <button onClick={() => handleTopUpSubmit(30, PlanTier.BASIC)} className="flex justify-between items-center p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all text-left group">
                          <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Starter Refill</div>
                              <div className="text-xs text-slate-500">30 AI Tokens Refill</div>
                          </div>
                          <div className="text-right">
                              <div className="text-xs font-black text-indigo-600">₦{config.starterPrice.toLocaleString()}</div>
                              <i className="fas fa-bolt text-indigo-400 mt-1"></i>
                          </div>
                      </button>
                      <button onClick={() => handleTopUpSubmit(0, PlanTier.ULTRA)} className="flex justify-between items-center p-4 border-2 border-indigo-200 dark:border-indigo-900 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all text-left relative group">
                          <span className="absolute -top-2 right-4 bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase shadow-lg">Unlimited Access</span>
                          <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Individual Ultra Plan</div>
                              <div className="text-xs text-slate-500">Unlimited AI Operations per User</div>
                          </div>
                          <div className="text-right">
                              <div className="text-xs font-black text-amber-500">₦{config.ultraPrice.toLocaleString()}</div>
                              <i className="fas fa-crown text-amber-500 mt-1"></i>
                          </div>
                      </button>
                      <p className="text-[9px] text-slate-500 text-center px-4 italic">
                        Note: Ultra plan provides unlimited access for this specific user account. School-wide unlimited requires Ultra for each staff member.
                      </p>
                  </div>
              </div>
          </div>
      </div>
  );

  const WalletWidget = () => (
      <div className="bg-slate-900 dark:bg-black rounded-xl p-5 text-white mb-6 border border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${wallet.plan === PlanTier.ULTRA ? 'text-amber-400' : 'text-indigo-400'}`}>{wallet.plan} Plan</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <button onClick={() => setShowTopUp(true)} className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full uppercase transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <i className="fas fa-plus-circle mr-1"></i> Upgrade
                </button>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">AI Credits Remaining</p>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-black">{wallet.plan === PlanTier.ULTRA ? '∞' : (wallet.personal)}</span>
                    </div>
                </div>
                <div className="text-right">
                    {wallet.plan !== PlanTier.ULTRA && wallet.personal === 0 && (
                        <p className="text-[10px] text-red-500 font-black animate-pulse">Balance Exhausted</p>
                    )}
                </div>
            </div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${wallet.plan === PlanTier.ULTRA ? 'bg-amber-500 w-full' : (wallet.personal < 5 ? 'bg-red-500' : 'bg-indigo-500')}`} style={{ width: wallet.plan === PlanTier.ULTRA ? '100%' : `${Math.min(100, (wallet.personal / 50) * 100)}%` }}></div>
            </div>
          </div>
          <i className="fas fa-wallet absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity"></i>
      </div>
  );

  const ActionButtons = () => (
    <>
        {currentUser.role === UserRole.TEACHER ? (
          <>
            <button onClick={() => onNavigate('SNAP_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-primary dark:hover:border-indigo-500 text-left transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fas fa-camera text-6xl text-blue-600"></i></div>
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><i className="fas fa-camera text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Snap-to-Text</h3>
            </button>
            <button onClick={() => onNavigate('AI_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-purple-500 text-left transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fas fa-magic text-6xl text-purple-600"></i></div>
               <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400"><i className="fas fa-magic text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Generator</h3>
            </button>
            <button onClick={() => onNavigate('BANK_INPUT')} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-emerald-500 text-left transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fas fa-database text-6xl text-emerald-600"></i></div>
               <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400"><i className="fas fa-database text-xl"></i></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Question Bank</h3>
            </button>
          </>
        ) : (
          <>
             <button onClick={() => onNavigate('REVIEW')} className="relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm md:shadow-lg border-2 border-transparent hover:border-amber-500 text-left transition-colors">
               {stats.pending > 0 && <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">{stats.pending} New</span>}
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

  return (
    <div className="max-w-5xl mx-auto md:p-6 pb-24 md:pb-6">
      {showTopUp && <TopUpModal />}
      
      <header className="hidden md:flex mb-10 justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-primary dark:text-indigo-400 mb-1">ExamFlow AI</h1>
            <p className="text-secondary dark:text-slate-400 text-sm">Hi {currentUser.name}, welcome to your digital office.</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('PRICING')} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">Pricing Plans</button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors">
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button onClick={onLogout} className="text-slate-500 dark:text-slate-400 hover:text-red-500 text-sm font-bold">Logout</button>
        </div>
      </header>

      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm"><i className="fas fa-layer-group"></i></div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">ExamFlow</span>
         </div>
         <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
             <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
         </button>
      </header>

      <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <ActionButtons />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-6">
                <WalletWidget />
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">
                        {currentUser.role === UserRole.TEACHER ? "My Exams" : "School Archive"}
                    </h4>
                    <ul className="space-y-3">
                        {recentPapers.map(p => (
                            <li key={p.id} onClick={() => onEditPaper(p)} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors">
                                <div className="truncate flex-1 pr-4">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{p.header.subject}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.header.class_name} • {new Date(p.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded whitespace-nowrap ${p.status === ExamStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p.status === ExamStatus.REJECTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {p.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-1 space-y-4">
                 <button onClick={() => onNavigate('SCAN')} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-xl shadow-lg hover:opacity-90 transition-all text-center">
                     <i className="fas fa-qrcode text-3xl mb-2 block"></i>
                     <span className="font-bold">Scan Exam QR</span>
                 </button>
                 <button onClick={() => onNavigate('QR_SUMMARY')} className="w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center">
                     <i className="fas fa-print text-3xl mb-2 block text-primary dark:text-indigo-400"></i>
                     <span className="font-bold">QR Summary Sheet</span>
                 </button>
            </div>
        </div>
      </div>

      <div className="md:hidden p-4 space-y-6">
          {mobileTab === 'HOME' && (
              <>
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <p className="opacity-80 text-[10px] uppercase font-black tracking-widest mb-1">Active User</p>
                    <h2 className="text-2xl font-bold truncate">{currentUser.name}</h2>
                    <p className="text-[10px] mt-2 bg-white/20 inline-block px-2 py-1 rounded font-bold">{currentUser.role === UserRole.TEACHER ? 'Teacher' : 'Exam Officer'}</p>
                </div>
                <WalletWidget />
                {/* List contents here too */}
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
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Utilities</h2>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700">
                      <button onClick={() => onNavigate('SCAN')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center"><i className="fas fa-qrcode"></i></div>
                          <div className="text-left"><div className="font-bold text-slate-800 dark:text-white">Scan QR Code</div></div>
                      </button>
                      <button onClick={() => onNavigate('PRICING')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="fas fa-tags"></i></div>
                          <div className="text-left"><div className="font-bold text-slate-800 dark:text-white">Pricing Plans</div></div>
                      </button>
                  </div>
              </div>
          )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-around items-end pb-4 pt-2 px-2 z-40 safe-area-bottom shadow-xl">
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
