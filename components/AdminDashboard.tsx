
import React, { useState, useEffect } from 'react';
import { School, User, UsageLog, LogEntry, NIGERIAN_STATES, UserRole, TopUpRequest, SystemConfig } from '../types';
import { getAllSchools, getAllUsers, getUsageStats, getAllLogs, getSystemConfig, saveSystemConfig, recordActivity, getTopUpRequests, resolveTopUpRequest } from '../services/storageService';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usage, setUsage] = useState<UsageLog[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHOOLS' | 'REQUESTS' | 'SETTINGS'>('OVERVIEW');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSchools(getAllSchools());
    setUsers(getAllUsers());
    setUsage(getUsageStats());
    setLogs(getAllLogs().sort((a,b) => b.timestamp - a.timestamp));
    setRequests(getTopUpRequests());
    setConfig(getSystemConfig());
  };

  const handleResolve = (reqId: string, status: 'COMPLETED' | 'CANCELLED') => {
      resolveTopUpRequest(reqId, status);
      refreshData();
      alert(`Top-up request ${status === 'COMPLETED' ? 'Approved & Credited' : 'Cancelled'}`);
  };

  const handleSaveConfig = () => {
      saveSystemConfig(config);
      alert("System Configuration & Pricing Updated!");
  };

  const navItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'SCHOOLS', label: 'Schools', icon: 'fa-school' },
    { id: 'REQUESTS', label: 'Top-ups', icon: 'fa-file-invoice-dollar' },
    { id: 'SETTINGS', label: 'System', icon: 'fa-cog' }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-20 lg:pb-0">
        <header className="p-4 md:p-6 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-crown text-sm md:text-base"></i>
                </div>
                <div>
                    <h1 className="text-base md:text-xl font-bold tracking-tight">Owner Console</h1>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest hidden sm:block">ExamFlow AI Network</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="bg-slate-800 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="hidden lg:block lg:col-span-2 space-y-2">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all relative ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <i className={`fas ${item.icon} w-5`}></i> {item.label}
                        {item.id === 'REQUESTS' && requests.filter(r => r.status === 'PENDING').length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                ))}
            </aside>

            <main className="lg:col-span-10">
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[
                                { label: 'Active Schools', value: schools.length, color: 'text-blue-400', icon: 'fa-school' },
                                { label: 'Pending Top-ups', value: requests.filter(r => r.status === 'PENDING').length, color: 'text-purple-400', icon: 'fa-receipt' },
                                { label: 'AI Transactions', value: usage.length, color: 'text-emerald-400', icon: 'fa-bolt' },
                                { label: 'Revenue Est.', value: `₦${requests.filter(r => r.status === 'COMPLETED').reduce((a,b)=>a+(b.amount*10),0).toLocaleString()}`, color: 'text-amber-400', icon: 'fa-coins' }
                            ].map((m, i) => (
                                <div key={i} className="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl flex justify-between items-start transition-all hover:bg-slate-800/60">
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{m.label}</div>
                                        <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                                    </div>
                                    <div className={`${m.color} opacity-20 text-xl`}><i className={`fas ${m.icon}`}></i></div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
                                <h3 className="font-bold text-sm">Real-time Network Feed</h3>
                                <span className="text-[10px] font-black text-slate-500 uppercase">Latest 15 Events</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[10px]">
                                    <thead className="bg-slate-900/50 text-slate-500 uppercase font-black">
                                        <tr>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Identity</th>
                                            <th className="p-4">Activity</th>
                                            <th className="p-4 text-right">Node</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {logs.slice(0, 15).map(log => (
                                            <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-4 text-slate-500 font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-200">{log.user_name}</span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{schools.find(s => s.id === log.school_id)?.name || 'System Root'}</div>
                                                </td>
                                                <td className="p-4 text-slate-300 italic min-w-[200px]">"{log.description}"</td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.action_type === 'TOPUP' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-400'}`}>
                                                        {log.action_type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No network activity recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SCHOOLS' && (
                    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                                <tr>
                                    <th className="p-6">Entity</th>
                                    <th className="p-6">State</th>
                                    <th className="p-6 text-center">Wallet</th>
                                    <th className="p-6">Onboarded</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {schools.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-700/20">
                                        <td className="p-6">
                                            <div className="font-bold text-sm">{s.name}</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-tighter">ID: {s.id.substring(0,8)}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-700 text-slate-400 uppercase">
                                                {s.state}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center font-black text-emerald-400">{s.tokens}</td>
                                        <td className="p-6 text-slate-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {schools.length === 0 && (
                                    <tr><td colSpan={4} className="p-12 text-center text-slate-500">No schools onboarded yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'REQUESTS' && (
                    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700 bg-slate-900/50">
                            <h3 className="font-black text-indigo-400 uppercase tracking-widest text-xs">Top-up Ledger</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">
                                    <tr>
                                        <th className="p-6">Request From</th>
                                        <th className="p-6">Plan / Tokens</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {requests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-700/20">
                                            <td className="p-6">
                                                <div className="font-bold">{req.user_name}</div>
                                                <div className="text-[9px] text-slate-500 font-black uppercase">{req.school_name}</div>
                                            </td>
                                            <td className="p-6 font-mono font-bold text-indigo-400">
                                                {req.plan || `+${req.amount} Tokens`}
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' : req.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => handleResolve(req.id, 'CANCELLED')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all">
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                        <button onClick={() => handleResolve(req.id, 'COMPLETED')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all">
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-600 font-bold uppercase">Closed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.length === 0 && (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-500">No active top-up requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'SETTINGS' && (
                    <div className="max-w-4xl space-y-8 pb-10">
                        {/* INFRA SECTION */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-microchip text-indigo-400"></i> Infrastructure Control
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Master Gemini API Key</label>
                                    <input 
                                        type="password" 
                                        value={config.gemini_api_key}
                                        onChange={e => setConfig({ ...config, gemini_api_key: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-indigo-400 font-mono text-sm outline-none focus:border-indigo-500"
                                        placeholder="Enter secure API key..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BUSINESS RULES SECTION */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-hand-holding-dollar text-emerald-400"></i> Business Rules & Pricing
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Initial Free Tokens (Per Account)</label>
                                        <input 
                                            type="number" 
                                            value={config.initialFreeTokens}
                                            onChange={e => setConfig({ ...config, initialFreeTokens: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Starter Price (₦)</label>
                                        <input 
                                            type="number" 
                                            value={config.starterPrice}
                                            onChange={e => setConfig({ ...config, starterPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ultra Price (₦)</label>
                                        <input 
                                            type="number" 
                                            value={config.ultraPrice}
                                            onChange={e => setConfig({ ...config, ultraPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Max Teachers with Free Start</label>
                                        <input 
                                            type="number" 
                                            value={config.maxTeachersWithFreeTokens}
                                            onChange={e => setConfig({ ...config, maxTeachersWithFreeTokens: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL LINKS SECTION */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-share-nodes text-blue-400"></i> Social Media Links
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Twitter / X URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://x.com/examflow"
                                        value={config.socialLinks.twitter}
                                        onChange={e => setConfig({ ...config, socialLinks: { ...config.socialLinks, twitter: e.target.value } })}
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Facebook URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://facebook.com/examflow"
                                        value={config.socialLinks.facebook}
                                        onChange={e => setConfig({ ...config, socialLinks: { ...config.socialLinks, facebook: e.target.value } })}
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Instagram URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://instagram.com/examflow"
                                        value={config.socialLinks.instagram}
                                        onChange={e => setConfig({ ...config, socialLinks: { ...config.socialLinks, instagram: e.target.value } })}
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">LinkedIn URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://linkedin.com/company/examflow"
                                        value={config.socialLinks.linkedin}
                                        onChange={e => setConfig({ ...config, socialLinks: { ...config.socialLinks, linkedin: e.target.value } })}
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveConfig} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95 text-lg uppercase tracking-widest">
                            Update Global System Logic
                        </button>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};
