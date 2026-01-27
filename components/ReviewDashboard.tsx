
import React, { useState, useEffect } from 'react';
import { User, ExamPaper, ExamStatus, LogEntry } from '../types';
import { getExamPapers, getSchoolLogs } from '../services/storageService';

interface ReviewDashboardProps {
  currentUser: User;
  onNavigate: () => void;
  onEditPaper: (paper: ExamPaper) => void;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ currentUser, onNavigate, onEditPaper }) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<ExamStatus | 'ALL' | 'LOGS'>(ExamStatus.PENDING_REVIEW);

  useEffect(() => {
    const all = getExamPapers(currentUser.school_id);
    setPapers(all.sort((a, b) => b.updated_at - a.updated_at));
    setLogs(getSchoolLogs(currentUser.school_id));
  }, [currentUser]);

  const filteredPapers = papers.filter(p => filter === 'ALL' || filter === 'LOGS' ? true : p.status === filter);

  const getLogIcon = (type: LogEntry['action_type']) => {
      switch(type) {
          case 'AUTH': return 'fa-user-lock text-slate-400';
          case 'EXAM_CREATE': return 'fa-plus-circle text-blue-500';
          case 'EXAM_UPDATE': return 'fa-edit text-indigo-500';
          case 'EXAM_STATUS': return 'fa-exchange-alt text-amber-500';
          case 'SETTINGS': return 'fa-cog text-slate-500';
          case 'TEACHER_MGMT': return 'fa-users text-purple-500';
          default: return 'fa-info-circle';
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 transition-colors">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onNavigate} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Exam Review Center</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: ExamStatus.PENDING_REVIEW, label: 'Pending Review', icon: 'fa-clock', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
                { id: ExamStatus.APPROVED, label: 'Approved', icon: 'fa-check-circle', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
                { id: ExamStatus.REJECTED, label: 'Rejected', icon: 'fa-times-circle', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                { id: 'LOGS', label: 'Activity Logs', icon: 'fa-history', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
                { id: 'ALL', label: 'All Papers', icon: 'fa-list', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === tab.id ? 'ring-2 ring-offset-2 ring-primary ' + tab.color : 'bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                    <i className={`fas ${tab.icon}`}></i> {tab.label}
                </button>
            ))}
        </div>

        {filter === 'LOGS' ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">System Activity Logs</h3>
                    <span className="text-xs text-slate-500 uppercase font-bold">{logs.length} Entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs uppercase font-bold border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4">Time</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <td className="p-4 text-xs font-mono text-slate-500">
                                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold dark:text-white">{log.user_name}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-2 text-xs font-bold uppercase">
                                            <i className={`fas ${getLogIcon(log.action_type)}`}></i>
                                            {log.action_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">
                                        {log.description}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400">No activity logged yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4">Subject & Class</th>
                            <th className="p-4">Teacher</th>
                            <th className="p-4">Last Updated</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                        {filteredPapers.map(paper => (
                            <tr key={paper.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{paper.header.subject}</div>
                                    <div className="text-slate-500 dark:text-slate-400 text-xs">{paper.header.class_name} • {paper.header.term}</div>
                                </td>
                                <td className="p-4 text-slate-700 dark:text-slate-300">{paper.author_name}</td>
                                <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(paper.updated_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold 
                                        ${paper.status === ExamStatus.PENDING_REVIEW ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                          paper.status === ExamStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                          paper.status === ExamStatus.REJECTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                        {paper.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => onEditPaper(paper)}
                                        className="px-4 py-2 bg-primary text-white font-bold rounded hover:bg-indigo-700 shadow-sm text-xs transition-colors"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPapers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                    <i className="fas fa-inbox text-4xl mb-4 opacity-20"></i>
                                    <p>No papers found in this category.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};
