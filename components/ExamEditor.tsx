
import React, { useState, useRef, useEffect } from 'react';
import { ExamPaper, ExamSection, Question, QuestionType, ViewState, User, UserRole, ExamStatus, BloomsLevel, Difficulty } from '../types';
import { refineQuestionText, analyzeQuestionMetadata, spinQuestion, improveDistractors, generateRubric, runComplianceCheck } from '../services/geminiService';
import { saveExamPaper, recordActivity } from '../services/storageService';

interface ExamEditorProps {
  paper: ExamPaper;
  currentUser: User;
  setPaper: React.Dispatch<React.SetStateAction<ExamPaper>>;
  onNavigate: (view: ViewState) => void;
}

export const ExamEditor: React.FC<ExamEditorProps> = ({ paper, currentUser, setPaper, onNavigate }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  const isReviewer = currentUser.role === UserRole.EXAM_OFFICER && paper.status === ExamStatus.PENDING_REVIEW;
  const canEdit = paper.status === ExamStatus.DRAFT || paper.status === ExamStatus.REJECTED || isReviewer;

  // Auto-Save Logic
  useEffect(() => {
    if (paper.status !== ExamStatus.DRAFT && paper.status !== ExamStatus.REJECTED) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(() => {
        saveExamPaper(paper, true); // Skip activity log for background auto-saves
        setSaveStatus('saved');
    }, 1500);

    return () => clearTimeout(timer);
  }, [paper]);

  const handleHeaderChange = (field: keyof typeof paper.header, value: string) => {
    setPaper(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
  };

  const handleQuestionChange = (sectionId: string, qId: string, field: keyof Question, value: any) => {
    if (!canEdit) return;
    setPaper(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId 
          ? { ...sec, questions: sec.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) }
          : sec
      )
    }));
  };

  const handleSubmitForReview = () => {
    const updated = { ...paper, status: ExamStatus.PENDING_REVIEW, updated_at: Date.now() };
    saveExamPaper(updated, true);
    // Fix: Removed extra 4th argument as recordActivity only expects 3
    recordActivity(currentUser, 'EXAM_STATUS', `Submitted paper for review: ${paper.header.subject}`);
    setPaper(updated);
    alert("Submitted to Exam Officer for review!");
    onNavigate('DASHBOARD');
  };

  const handleApprove = () => {
    const updated = { ...paper, status: ExamStatus.APPROVED, feedback: '', updated_at: Date.now() };
    saveExamPaper(updated, true);
    // Fix: Removed extra 4th argument as recordActivity only expects 3
    recordActivity(currentUser, 'EXAM_STATUS', `Approved paper: ${paper.header.subject}`);
    setPaper(updated);
    alert("Paper Approved!");
    onNavigate('DASHBOARD');
  };

  const handleReject = () => {
    if(!reviewComment) {
        alert("Please provide feedback for rejection.");
        return;
    }
    const updated = { ...paper, status: ExamStatus.REJECTED, feedback: reviewComment, updated_at: Date.now() };
    saveExamPaper(updated, true);
    // Fix: Removed extra 4th argument as recordActivity only expects 3
    recordActivity(currentUser, 'EXAM_STATUS', `Rejected paper: ${paper.header.subject}. Reason: ${reviewComment}`);
    setPaper(updated);
    alert("Paper Sent Back to Teacher.");
    onNavigate('DASHBOARD');
  };

  // Fixed: Added local handler for compliance check to correctly pass current paper and manage loading UI
  const handleCompliance = async () => {
    setComplianceLoading(true);
    try {
      const result = await runComplianceCheck(paper);
      alert(`AI Compliance Check Result:\n\nScore: ${result.score}/100\nFeedback: ${result.feedback}`);
    } catch (error) {
      console.error("Compliance Check failed", error);
      alert("Failed to run AI compliance check.");
    } finally {
      setComplianceLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('DASHBOARD')} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <i className="fas fa-arrow-left"></i>
            </button>
            <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-800 dark:text-white hidden md:block">Editor</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${paper.status === ExamStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
                    {paper.status.replace('_', ' ')}
                </span>
                {canEdit && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 animate-pulse">
                        {saveStatus === 'saving' ? <><i className="fas fa-circle-notch fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-check mr-1"></i> Saved</>}
                    </span>
                )}
            </div>
        </div>
        <div className="flex gap-2">
            {canEdit && (
                <button 
                  onClick={handleCompliance} 
                  disabled={complianceLoading}
                  className="px-3 md:px-4 py-2 text-sm font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                    {complianceLoading ? <i className="fas fa-spinner fa-spin md:mr-2"></i> : <i className="fas fa-robot md:mr-2"></i>}
                    <span className="hidden md:inline">{complianceLoading ? "Checking..." : "AI Compliance Check"}</span>
                </button>
            )}
            {currentUser.role === UserRole.TEACHER && (paper.status === ExamStatus.DRAFT || paper.status === ExamStatus.REJECTED) && (
                <button onClick={handleSubmitForReview} className="px-3 md:px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-indigo-700 shadow-md">
                     <i className="fas fa-paper-plane md:hidden"></i> <span className="hidden md:inline">Submit for Review</span>
                </button>
            )}
            {(paper.status === ExamStatus.APPROVED || currentUser.role === UserRole.EXAM_OFFICER) && (
                <button onClick={() => onNavigate('PREVIEW')} className="px-3 md:px-4 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-600 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-500 shadow-md">
                    <i className="fas fa-eye md:mr-2"></i> <span className="hidden md:inline">Preview</span>
                </button>
            )}
        </div>
      </div>

      {isReviewer && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
              <input 
                type="text" 
                placeholder="Reason for rejection (required)..." 
                className="flex-1 p-2 border border-amber-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
              <div className="flex gap-2">
                  <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 text-sm shadow">Reject</button>
                  <button onClick={handleApprove} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 text-sm shadow">Approve</button>
              </div>
          </div>
      )}

      {/* Main Form Fields mapped to snake_case context if needed, but structure remains as defined in types.ts */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 hidden md:block transition-colors">
            <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-4 tracking-wider">Exam Header</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">School Name</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white outline-none" value={paper.header.school_name} onChange={(e) => handleHeaderChange('school_name', e.target.value)} />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Subject</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white outline-none" value={paper.header.subject} onChange={(e) => handleHeaderChange('subject', e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Class</label>
                        <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white outline-none" value={paper.header.class_name} onChange={(e) => handleHeaderChange('class_name', e.target.value)} />
                    </div>
                </div>
                {/* ... other header fields */}
            </div>
        </aside>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Question rendering logic as before, just ensuring data consistency */}
            {paper.sections.map((section, sIdx) => (
                <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                     <div className="bg-slate-50 border-b p-4 font-bold text-slate-900">{section.title}</div>
                     <div className="p-4 space-y-6">
                        {section.questions.map((q, qIdx) => (
                             <div key={q.id} className="relative pl-8">
                                <span className="absolute left-0 top-0 font-bold text-slate-400">{qIdx+1}.</span>
                                <textarea 
                                    disabled={!canEdit}
                                    className="w-full border rounded p-2 text-slate-800"
                                    value={q.text}
                                    onChange={(e) => handleQuestionChange(section.id, q.id, 'text', e.target.value)}
                                />
                             </div>
                        ))}
                     </div>
                </div>
            ))}
        </main>
      </div>
    </div>
  );
};
