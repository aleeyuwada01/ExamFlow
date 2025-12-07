
import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { User, ExamPaper, SCHOOL_CLASSES, NIGERIAN_SUBJECTS } from '../types';
import { getExamPapers, getSchool } from '../services/storageService';

interface QRSummarySheetProps {
  currentUser: User;
  onNavigate: () => void;
}

export const QRSummarySheet: React.FC<QRSummarySheetProps> = ({ currentUser, onNavigate }) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  useEffect(() => {
    // Get all papers for the school
    const all = getExamPapers(currentUser.schoolId);
    setPapers(all);
  }, [currentUser]);

  const filteredPapers = papers.filter(p => {
    return (!selectedClass || p.header.className === selectedClass) &&
           (!selectedSubject || p.header.subject === selectedSubject);
  });

  const handlePrint = () => {
    window.print();
  };

  const school = getSchool(currentUser.schoolId);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans transition-colors">
      {/* Control Bar - Hidden on Print */}
      <div className="no-print bg-white dark:bg-slate-800 p-4 border-b dark:border-slate-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <button onClick={onNavigate} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <i className="fas fa-arrow-left"></i> Back
             </button>
             <h1 className="text-xl font-bold text-slate-800 dark:text-white">QR Code Summary Sheet</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
                <option value="">All Classes</option>
                {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
                value={selectedSubject} 
                onChange={e => setSelectedSubject(e.target.value)}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
                <option value="">All Subjects</option>
                {NIGERIAN_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button 
                onClick={handlePrint}
                disabled={filteredPapers.length === 0}
                className="px-4 py-2 bg-primary text-white font-bold rounded shadow hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
                <i className="fas fa-print mr-2"></i> Print Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-content" className="p-8 max-w-[210mm] mx-auto bg-white min-h-screen text-black">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
             {school?.logoUrl && <img src={school.logoUrl} alt="Logo" className="h-16 mx-auto mb-2" />}
             <h1 className="text-2xl font-black uppercase">{school?.name || "School Name"}</h1>
             <h2 className="text-lg font-bold">Exam Digital Access Codes</h2>
             <p className="text-sm mt-1">Class: {selectedClass || 'All'} | Subject: {selectedSubject || 'All'} | Session: {new Date().getFullYear()}</p>
        </div>

        {filteredPapers.length > 0 ? (
            <div className="grid grid-cols-2 gap-8">
                {filteredPapers.map((paper, idx) => (
                    <div key={paper.id} className="border-2 border-slate-800 rounded-xl p-4 flex gap-4 break-inside-avoid">
                        <div className="flex-shrink-0">
                            <QRCode value={paper.qrCodeData} size={96} />
                            <div className="text-[10px] text-center font-mono mt-1 text-slate-500">{paper.qrCodeData.substring(0,8)}</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-bold text-lg leading-tight uppercase mb-1">{paper.header.subject}</h3>
                            <div className="text-sm font-bold mb-1">{paper.header.className}</div>
                            <div className="text-xs text-slate-600 mb-1">{paper.header.examType}</div>
                            <div className="text-xs text-slate-600">{paper.header.term}</div>
                            
                            <div className="mt-4 pt-2 border-t border-dotted border-slate-400">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Teacher / Invigilator:</span>
                                <div className="text-sm font-medium">{paper.authorName}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <i className="fas fa-filter text-4xl mb-4"></i>
                <p>No papers match the selected filters.</p>
            </div>
        )}

        <div className="mt-12 text-center text-xs text-slate-400">
            Generated by ExamFlow AI • Secure Digital Exam Access
        </div>
      </div>
    </div>
  );
};
