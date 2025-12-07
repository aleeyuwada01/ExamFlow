
import React, { useEffect, useState } from 'react';
import QRCode from "react-qr-code";
import { ExamPaper, ViewState, QuestionType, School, User } from '../types';
import { getSchool } from '../services/storageService';

interface PreviewProps {
  paper: ExamPaper;
  onNavigate: (view: ViewState) => void;
  currentUser?: User; // Pass user to allow access to answer key
}

export const Preview: React.FC<PreviewProps> = ({ paper, onNavigate, currentUser }) => {
  const [school, setSchool] = useState<School | undefined>(undefined);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  useEffect(() => {
    if (paper.schoolId) {
      const s = getSchool(paper.schoolId);
      setSchool(s);
    }
  }, [paper.schoolId]);

  const handlePrint = () => {
    // Timeout helps ensure any pending React renders finish and prevents
    // strict mode or event loop issues from blocking the print dialog.
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const handleDownloadDocx = () => {
    // Mock DOCX download
    const content = document.getElementById('printable-content')?.innerHTML;
    const blob = new Blob(['<!DOCTYPE html><html><body>' + content + '</body></html>'], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.header.subject}_Exam.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Template Styles
  const themeColor = school?.template.themeColor || '#000000';
  const fontFamily = school?.template.fontFamily === 'serif' ? 'serif' : school?.template.fontFamily === 'mono' ? 'monospace' : 'sans-serif';
  const isCentered = school?.template.headerLayout !== 'LEFT';

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Top Bar - No Print */}
      <div className="no-print bg-slate-800 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('EDITOR')} className="text-sm hover:text-slate-300 transition-colors">
                <i className="fas fa-arrow-left mr-2"></i> Back to Editor
            </button>
            {currentUser && (
                <div className="flex items-center gap-3 bg-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                    <span className="text-xs font-bold text-slate-300">Answer Key Mode</span>
                    <button 
                        onClick={() => setShowAnswerKey(!showAnswerKey)} 
                        className={`w-10 h-5 rounded-full relative transition-colors ${showAnswerKey ? 'bg-green-500' : 'bg-slate-500'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${showAnswerKey ? 'left-6' : 'left-1'}`}></div>
                    </button>
                    {/* Tooltip for Answer Key */}
                    <div className="relative group cursor-help">
                        <i className="fas fa-question-circle text-slate-400 hover:text-white text-xs"></i>
                        <div className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded w-48 top-full mt-2 left-1/2 -translate-x-1/2 z-20 shadow-lg text-center">
                            Enable this view during invigilation or marking. It reveals correct answers and marking guides. Hidden from students.
                        </div>
                    </div>
                </div>
            )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadDocx} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
            <i className="fas fa-file-word mr-2"></i> Download DOCX
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-primary hover:bg-indigo-500 rounded text-sm font-bold shadow transition-colors">
            <i className="fas fa-print mr-2"></i> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Paper Area - Use flex-center for on-screen, but block for print */}
      <div className="flex justify-center p-4 md:p-8 overflow-auto print:overflow-visible print:block print:p-0">
        <div 
            id="printable-content" 
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl text-black print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-0 print:m-0"
            style={{ fontFamily }}
        >
            
          {/* Exam Header */}
          <div className="border-b-2 pb-6 mb-6 relative" style={{ borderColor: themeColor }}>
            
            {/* Header Content Wrapper */}
            <div className={`flex ${isCentered ? 'flex-col items-center text-center' : 'flex-row items-center gap-6 text-left'} mb-6`}>
                
                {/* Logo */}
                {school?.logoUrl && (
                    <img 
                        src={school.logoUrl} 
                        alt="School Logo" 
                        className={`${isCentered ? 'h-20 mb-3' : 'h-24 w-24 object-contain'}`} 
                    />
                )}

                {/* School Name & Exam Title */}
                <div className="flex-1">
                    <h1 
                        className="text-3xl font-extrabold uppercase leading-tight" 
                        style={{ color: themeColor }}
                    >
                        {paper.header.schoolName || school?.name || "School Name"}
                    </h1>
                    <h2 className="text-lg font-bold mt-1 text-black opacity-90 uppercase">
                        {paper.header.term} • {paper.header.examType}
                    </h2>
                    <p className="font-semibold text-sm opacity-75 mt-1">Academic Session: {new Date().getFullYear()}</p>
                </div>

                {/* QR Code (Visible on Print) */}
                <div className="hidden print:block absolute top-0 right-0">
                    <QRCode value={paper.qrCodeData} size={64} />
                </div>
            </div>
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-medium border-t border-slate-300 pt-4">
                <div className="flex items-end">
                    <span className="w-24 font-bold opacity-70">SUBJECT:</span> 
                    <span className="flex-1 border-b border-dotted border-black uppercase font-bold text-lg leading-none pb-1">{paper.header.subject}</span>
                </div>
                <div className="flex items-end">
                    <span className="w-24 font-bold opacity-70">CLASS:</span> 
                    <span className="flex-1 border-b border-dotted border-black uppercase font-bold text-lg leading-none pb-1">{paper.header.className}</span>
                </div>
                <div className="flex items-end">
                    <span className="w-24 font-bold opacity-70">TIME:</span> 
                    <span className="flex-1 border-b border-dotted border-black uppercase font-bold text-lg leading-none pb-1">{paper.header.duration}</span>
                </div>
                <div className="flex items-end">
                    <span className="w-24 font-bold opacity-70">DATE:</span> 
                    <span className="flex-1 border-b border-dotted border-black uppercase font-bold text-lg leading-none pb-1"></span>
                </div>
                <div className="flex items-end col-span-2 mt-2">
                    <span className="w-24 font-bold opacity-70">NAME:</span> 
                    <span className="flex-1 border-b border-dotted border-black"></span>
                </div>
            </div>

            {/* Instructions */}
            {paper.header.generalInstructions && (
                <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded text-sm italic print:bg-transparent print:border-none print:p-0 print:mt-4">
                    <strong>INSTRUCTIONS:</strong> {paper.header.generalInstructions}
                </div>
            )}
          </div>

          {/* Questions Body */}
          <div className="space-y-8">
            {paper.sections.map((section, idx) => (
              <div key={section.id}>
                <h3 
                    className="font-bold text-lg mb-3 uppercase inline-block border-b-2 break-after-avoid"
                    style={{ borderColor: themeColor, color: themeColor }}
                >
                  {section.title}
                </h3>
                {section.instructions && <p className="text-sm mb-4 italic text-slate-700">{section.instructions}</p>}

                <div className={`space-y-4 ${section.questions.some(q => q.type === QuestionType.OBJECTIVE) ? 'columns-1' : ''}`}>
                  {section.questions.map((q, qIdx) => (
                    <div key={q.id} className="break-inside-avoid mb-6 relative page-break-inside-avoid">
                      <div className="flex gap-2">
                        <span className="font-bold text-lg leading-none">{qIdx + 1}.</span>
                        <div className="flex-1">
                          <div className="mb-2 text-base leading-snug">
                            {q.text} 
                            <span className="float-right text-xs font-bold opacity-60 ml-2">[{q.marks} marks]</span>
                          </div>

                          {q.type === QuestionType.OBJECTIVE && q.options && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 ml-1 mt-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`text-sm flex items-start gap-2 ${showAnswerKey && q.correctAnswer && opt.includes(q.correctAnswer) ? 'font-bold text-green-700 bg-green-100 rounded px-1' : ''}`}>
                                  <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === QuestionType.FILL_IN_THE_BLANK && (
                             <div className="border-b-2 border-slate-300 w-full max-w-xs h-6 inline-block ml-1">
                                {showAnswerKey && q.correctAnswer && <span className="text-green-700 font-bold font-mono px-2">{q.correctAnswer}</span>}
                             </div>
                          )}

                          {q.type === QuestionType.THEORY && (
                            <>
                                <div className="h-24 border border-slate-200 mt-2 bg-slate-50 print:hidden rounded relative">
                                    <span className="text-xs text-slate-300 p-2 block">Student Answer Space</span>
                                    {showAnswerKey && q.rubric && (
                                        <div className="absolute inset-0 bg-green-50 p-2 overflow-auto text-xs text-green-900">
                                            <strong>Marking Guide:</strong>
                                            <div className="whitespace-pre-wrap mt-1">{q.rubric}</div>
                                        </div>
                                    )}
                                </div>
                                {/* Print Only Lines for Theory */}
                                <div className="hidden print:block mt-8 space-y-6">
                                    <div className="border-b border-slate-300 w-full"></div>
                                    <div className="border-b border-slate-300 w-full"></div>
                                    <div className="border-b border-slate-300 w-full"></div>
                                </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with QR Code for tracking */}
          <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-end break-inside-avoid">
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              Generated by ExamFlow AI
            </div>
            <div className="flex flex-col items-center">
              <QRCode value={paper.qrCodeData} size={48} />
              <span className="text-[10px] text-gray-400 mt-1 font-mono">{paper.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
