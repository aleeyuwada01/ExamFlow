
import React, { useState, useEffect } from 'react';
import { User, ExamPaper, ExamStatus } from '../types';
import { getExamPapers, saveExamPaper } from '../services/storageService';

interface ReviewDashboardProps {
  currentUser: User;
  onNavigate: () => void;
  onEditPaper: (paper: ExamPaper) => void;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ currentUser, onNavigate, onEditPaper }) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [filter, setFilter] = useState<ExamStatus | 'ALL'>(ExamStatus.PENDING_REVIEW);

  useEffect(() => {
    const all = getExamPapers(currentUser.schoolId);
    setPapers(all.sort((a, b) => b.createdAt - a.createdAt));
  }, [currentUser]);

  const filteredPapers = papers.filter(p => filter === 'ALL' ? true : p.status === filter);

  return (
    <div className="max-w-6xl mx-auto p-6 transition-colors">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onNavigate} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Exam Review Center</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: ExamStatus.PENDING_REVIEW, label: 'Pending Review', icon: 'fa-clock', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
                { id: ExamStatus.APPROVED, label: 'Approved', icon: 'fa-check-circle', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
                { id: ExamStatus.REJECTED, label: 'Rejected', icon: 'fa-times-circle', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                { id: 'ALL', label: 'All Papers', icon: 'fa-list', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as ExamStatus | 'ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === tab.id ? 'ring-2 ring-offset-2 ring-primary ' + tab.color : 'bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                    <i className={`fas ${tab.icon}`}></i> {tab.label}
                </button>
            ))}
        </div>

        {/* Updated Container: overflow-x-auto for mobile scrolling */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <tr>
                        <th className="p-4">Subject & Class</th>
                        <th className="p-4">Teacher</th>
                        <th className="p-4">Submitted</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                    {filteredPapers.map(paper => (
                        <tr key={paper.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white">{paper.header.subject}</div>
                                <div className="text-slate-500 dark:text-slate-400 text-xs">{paper.header.className} • {paper.header.term}</div>
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-300">{paper.authorName}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(paper.createdAt).toLocaleDateString()}</td>
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
                                    className="px-4 py-2 bg-primary text-white font-bold rounded hover:bg-indigo-700 shadow-sm text-xs"
                                >
                                    Review
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredPapers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                <i className="fas fa-inbox text-4xl mb-4"></i>
                                <p>No papers found in this category.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
