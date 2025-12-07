
import React, { useState, useRef, useEffect } from 'react';
import { ExamPaper, ExamSection, Question, QuestionType, ViewState, User, UserRole, ExamStatus, BloomsLevel, Difficulty } from '../types';
import { refineQuestionText, analyzeQuestionMetadata, spinQuestion, improveDistractors, generateRubric, runComplianceCheck } from '../services/geminiService';
import { saveExamPaper } from '../services/storageService';

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
  
  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ type: 'SECTION' | 'QUESTION', sectionIdx: number, questionIdx?: number } | null>(null);
  const dragOverItem = useRef<{ type: 'SECTION' | 'QUESTION', sectionIdx: number, questionIdx?: number } | null>(null);

  const isReviewer = currentUser.role === UserRole.EXAM_OFFICER && paper.status === ExamStatus.PENDING_REVIEW;
  const canEdit = paper.status === ExamStatus.DRAFT || paper.status === ExamStatus.REJECTED || isReviewer;

  // Auto-Save Logic
  useEffect(() => {
    if (paper.status !== ExamStatus.DRAFT && paper.status !== ExamStatus.REJECTED) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(() => {
        saveExamPaper(paper);
        setSaveStatus('saved');
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [paper]);


  // --- Header Handlers ---
  const handleHeaderChange = (field: keyof typeof paper.header, value: string) => {
    setPaper(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
  };

  // --- Section/Question Handlers ---
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

  const addQuestion = (sectionId: string, type: QuestionType) => {
    if (!canEdit) return;
    const newQ: Question = {
      id: crypto.randomUUID(),
      type,
      text: "New Question...",
      marks: 1,
      options: type === QuestionType.OBJECTIVE ? ["Option A", "Option B", "Option C", "Option D"] : undefined
    };
    setPaper(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, questions: [...sec.questions, newQ] } : sec
      )
    }));
  };

  const deleteQuestion = (sectionId: string, qId: string) => {
    if (!canEdit) return;
    setPaper(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, questions: sec.questions.filter(q => q.id !== qId) } : sec
      )
    }));
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, type: 'SECTION' | 'QUESTION', sectionIdx: number, questionIdx?: number) => {
      setDraggedItem({ type, sectionIdx, questionIdx });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, type: 'SECTION' | 'QUESTION', sectionIdx: number, questionIdx?: number) => {
      dragOverItem.current = { type, sectionIdx, questionIdx };
  };

  const handleDragEnd = () => {
      setDraggedItem(null);
      dragOverItem.current = null;
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const dragged = draggedItem;
      const target = dragOverItem.current;

      if (!dragged || !target || !canEdit) return;

      if (dragged.type === 'SECTION' && target.type === 'SECTION') {
          const newSections = [...paper.sections];
          const [movedSection] = newSections.splice(dragged.sectionIdx, 1);
          newSections.splice(target.sectionIdx, 0, movedSection);
          setPaper({ ...paper, sections: newSections });
      }

      if (dragged.type === 'QUESTION' && target.type === 'QUESTION') {
          const newSections = [...paper.sections];
          const sourceQuestions = newSections[dragged.sectionIdx].questions;
          const [movedQuestion] = sourceQuestions.splice(dragged.questionIdx!, 1);
          const targetQuestions = newSections[target.sectionIdx].questions;
          targetQuestions.splice(target.questionIdx!, 0, movedQuestion);
          setPaper({ ...paper, sections: newSections });
      }

      setDraggedItem(null);
      dragOverItem.current = null;
  };


  // --- Actions ---
  const handleSave = () => {
    saveExamPaper(paper);
    setSaveStatus('saved');
  };

  const handleSubmitForReview = () => {
    const updated = { ...paper, status: ExamStatus.PENDING_REVIEW };
    saveExamPaper(updated);
    setPaper(updated);
    alert("Submitted to Exam Officer for review!");
    onNavigate('DASHBOARD');
  };

  const handleApprove = () => {
    const updated = { ...paper, status: ExamStatus.APPROVED, feedback: '' };
    saveExamPaper(updated);
    setPaper(updated);
    alert("Paper Approved!");
    onNavigate('DASHBOARD');
  };

  const handleReject = () => {
    if(!reviewComment) {
        alert("Please provide feedback for rejection.");
        return;
    }
    const updated = { ...paper, status: ExamStatus.REJECTED, feedback: reviewComment };
    saveExamPaper(updated);
    setPaper(updated);
    alert("Paper Sent Back to Teacher.");
    onNavigate('DASHBOARD');
  };

  // --- Advanced AI Tools ---
  const handleAnalyze = async (q: Question, sectionId: string) => {
      setProcessingId(q.id);
      try {
          const metadata = await analyzeQuestionMetadata(q.text);
          const updatedQ = { ...q, difficulty: metadata.difficulty, bloomsLevel: metadata.blooms };
          
          setPaper(prev => ({
              ...prev,
              sections: prev.sections.map(sec => 
                  sec.id === sectionId ? { ...sec, questions: sec.questions.map(qi => qi.id === q.id ? updatedQ : qi) } : sec
              )
          }));
      } finally {
          setProcessingId(null);
      }
  };

  const handleSpin = async (q: Question, sectionId: string, mode: "HARDER" | "CONTEXT" | "TYPE_SWAP") => {
      setProcessingId(q.id);
      try {
          const spunQ = await spinQuestion(q, mode);
          setPaper(prev => ({
              ...prev,
              sections: prev.sections.map(sec => 
                  sec.id === sectionId ? { ...sec, questions: sec.questions.map(qi => qi.id === q.id ? spunQ : qi) } : sec
              )
          }));
      } finally {
          setProcessingId(null);
      }
  };

  const handleFixDistractors = async (q: Question, sectionId: string) => {
      setProcessingId(q.id);
      try {
          const newOptions = await improveDistractors(q);
          handleQuestionChange(sectionId, q.id, 'options', newOptions);
      } finally {
          setProcessingId(null);
      }
  };

  const handleGenerateRubric = async (q: Question, sectionId: string) => {
      setProcessingId(q.id);
      try {
          const rubric = await generateRubric(q);
          handleQuestionChange(sectionId, q.id, 'rubric', rubric);
      } finally {
          setProcessingId(null);
      }
  };

  const handleComplianceCheck = async () => {
      setComplianceLoading(true);
      setShowCompliance(true);
      try {
          const report = await runComplianceCheck(paper);
          setPaper(prev => ({ ...prev, complianceReport: report }));
      } finally {
          setComplianceLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Toolbar */}
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
                
                {/* Auto Save Status */}
                {canEdit && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 animate-pulse">
                        {saveStatus === 'saving' ? <><i className="fas fa-circle-notch fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-check mr-1"></i> Saved</>}
                    </span>
                )}
            </div>
        </div>
        <div className="flex gap-2">
            {canEdit && (
                <>
                    <button onClick={handleComplianceCheck} title="AI Compliance Check" className="px-3 md:px-4 py-2 text-sm font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors">
                        <i className="fas fa-robot md:mr-2"></i> <span className="hidden md:inline">AI Compliance Check</span>
                    </button>
                </>
            )}
            
            {currentUser.role === UserRole.TEACHER && (paper.status === ExamStatus.DRAFT || paper.status === ExamStatus.REJECTED) && (
                <button onClick={handleSubmitForReview} title="Submit for Review" className="px-3 md:px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-indigo-700 shadow-md">
                     <i className="fas fa-paper-plane md:hidden"></i> <span className="hidden md:inline">Submit for Review</span>
                </button>
            )}

            {(paper.status === ExamStatus.APPROVED || currentUser.role === UserRole.EXAM_OFFICER) && (
                <button onClick={() => onNavigate('PREVIEW')} title="Preview" className="px-3 md:px-4 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-600 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-500 shadow-md">
                    <i className="fas fa-eye md:mr-2"></i> <span className="hidden md:inline">Preview</span>
                </button>
            )}
        </div>
      </div>

      {/* Compliance Modal */}
      {showCompliance && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center">
                      <i className="fas fa-clipboard-check text-purple-600 mr-2"></i> Compliance Report
                  </h3>
                  {complianceLoading ? (
                      <div className="text-center py-8 text-slate-500">
                          <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
                          <p>AI is auditing your paper...</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                              <span className="font-bold dark:text-white">Compliance Score</span>
                              <span className={`text-2xl font-black ${paper.complianceReport?.score && paper.complianceReport.score > 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {paper.complianceReport?.score || 0}%
                              </span>
                          </div>
                          <div>
                              <h4 className="font-bold text-red-500 text-sm mb-1 uppercase">Issues Found</h4>
                              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                                  {paper.complianceReport?.issues.length ? paper.complianceReport.issues.map((i, idx) => <li key={idx}>{i}</li>) : <li>No critical issues found.</li>}
                              </ul>
                          </div>
                          <div>
                              <h4 className="font-bold text-blue-500 text-sm mb-1 uppercase">Suggestions</h4>
                              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                                  {paper.complianceReport?.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                              </ul>
                          </div>
                          <button onClick={() => setShowCompliance(false)} className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg mt-4">Close Report</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Reviewer Feedback Panel */}
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

      {/* Teacher Feedback Display */}
      {paper.status === ExamStatus.REJECTED && paper.feedback && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-start gap-3">
              <i className="fas fa-exclamation-triangle mt-1"></i>
              <div>
                <strong className="block font-bold">Feedback from Exam Officer:</strong> 
                {paper.feedback}
              </div>
          </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Settings) */}
        <aside className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 hidden md:block transition-colors">
            <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-4 tracking-wider">Exam Header</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">School Name</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.schoolName} onChange={(e) => handleHeaderChange('schoolName', e.target.value)} />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Subject</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.subject} onChange={(e) => handleHeaderChange('subject', e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Class</label>
                        <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.className} onChange={(e) => handleHeaderChange('className', e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Term</label>
                        <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.term} onChange={(e) => handleHeaderChange('term', e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Duration</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.duration} onChange={(e) => handleHeaderChange('duration', e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Exam Type</label>
                    <input disabled={!canEdit} type="text" className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={paper.header.examType} onChange={(e) => handleHeaderChange('examType', e.target.value)} />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">General Instructions</label>
                    <textarea disabled={!canEdit} className="bg-white border text-slate-900 w-full p-2.5 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" rows={4} value={paper.header.generalInstructions} onChange={(e) => handleHeaderChange('generalInstructions', e.target.value)}></textarea>
                </div>
            </div>
        </aside>

        {/* Main Content (Questions) */}
        <main 
            className="flex-1 overflow-y-auto p-4 md:p-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                {/* AI Disclaimer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex gap-3">
                        <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <div>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">AI Disclaimer</p>
                            <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                                AI-generated questions, answers, and distractors may contain errors or inaccuracies. 
                                Please <strong>review all content specifically</strong> for Nigerian curriculum alignment and correctness before finalizing.
                            </p>
                        </div>
                    </div>
                </div>

                {paper.sections.map((section, sIdx) => (
                    <div 
                        key={section.id} 
                        className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${draggedItem?.type === 'SECTION' && draggedItem.sectionIdx === sIdx ? 'opacity-40 border-dashed border-2 border-slate-400' : 'border-slate-200'}`}
                        draggable={canEdit}
                        onDragStart={(e) => handleDragStart(e, 'SECTION', sIdx)}
                        onDragEnter={(e) => handleDragEnter(e, 'SECTION', sIdx)}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="bg-slate-50 border-b p-4 flex justify-between items-center cursor-move">
                            <div className="flex items-center gap-3 w-full">
                                {canEdit && <i className="fas fa-grip-vertical text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"></i>}
                                <input 
                                    disabled={!canEdit}
                                    className="bg-transparent border border-transparent hover:border-slate-300 rounded px-2 py-1 font-bold text-slate-900 outline-none w-1/2 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary" 
                                    value={section.title} 
                                    onChange={(e) => {
                                        const newSections = [...paper.sections];
                                        newSections[sIdx].title = e.target.value;
                                        setPaper({...paper, sections: newSections});
                                    }}
                                />
                            </div>
                            {canEdit && (
                                <div className="flex gap-2 text-xs flex-shrink-0">
                                    <button onClick={() => addQuestion(section.id, QuestionType.OBJECTIVE)} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 font-bold shadow-sm">+ OBJ</button>
                                    <button onClick={() => addQuestion(section.id, QuestionType.THEORY)} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 font-bold shadow-sm">+ Theory</button>
                                    <button 
                                        onClick={() => {
                                            const newSections = paper.sections.filter(s => s.id !== section.id);
                                            setPaper({...paper, sections: newSections});
                                        }} 
                                        className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-red-50 text-red-500 font-bold shadow-sm"
                                        title="Delete Section"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {section.questions.map((q, qIdx) => (
                                <div 
                                    key={q.id} 
                                    className={`group relative pl-10 pr-4 py-4 rounded-lg border transition-all ${draggedItem?.type === 'QUESTION' && draggedItem.questionIdx === qIdx && draggedItem.sectionIdx === sIdx ? 'opacity-40 border-dashed border-2 border-primary bg-indigo-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                                    draggable={canEdit}
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, 'QUESTION', sIdx, qIdx);
                                    }}
                                    onDragEnter={(e) => {
                                        e.stopPropagation();
                                        handleDragEnter(e, 'QUESTION', sIdx, qIdx);
                                    }}
                                    onDragEnd={handleDragEnd}
                                >
                                    {canEdit && (
                                        <div className="absolute left-3 top-5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                                            <i className="fas fa-grip-vertical"></i>
                                        </div>
                                    )}
                                    <span className="absolute left-8 top-5 text-slate-400 font-mono text-sm font-bold">{qIdx + 1}.</span>
                                    
                                    {/* Question Text */}
                                    <div className="mb-3">
                                        <textarea 
                                            disabled={!canEdit}
                                            className="w-full resize-none outline-none text-slate-900 bg-white border border-slate-300 rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                                            rows={2}
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(section.id, q.id, 'text', e.target.value)}
                                        />
                                    </div>

                                    {/* Metadata Badges */}
                                    <div className="flex gap-2 mb-3">
                                        {q.difficulty && (
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${q.difficulty === Difficulty.HARD ? 'bg-red-50 text-red-600 border-red-100' : q.difficulty === Difficulty.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {q.difficulty}
                                            </span>
                                        )}
                                        {q.bloomsLevel && (
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-100">
                                                Bloom: {q.bloomsLevel}
                                            </span>
                                        )}
                                    </div>

                                    {/* Question Options */}
                                    {q.type === QuestionType.OBJECTIVE && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            {q.options?.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-600 bg-white w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 shadow-sm">{String.fromCharCode(65+oIdx)}</span>
                                                    <input 
                                                        disabled={!canEdit}
                                                        className={`flex-1 text-sm border rounded-lg px-3 py-2 bg-white text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm ${q.correctAnswer && opt.includes(q.correctAnswer) ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-300'}`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...(q.options || [])];
                                                            newOpts[oIdx] = e.target.value;
                                                            handleQuestionChange(section.id, q.id, 'options', newOpts);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rubric View */}
                                    {q.type === QuestionType.THEORY && q.rubric && (
                                        <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap">
                                            <strong>Marking Guide:</strong>
                                            {q.rubric}
                                        </div>
                                    )}

                                    {/* AI Tools Toolbar */}
                                    {canEdit && (
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                                            {/* Primary Actions */}
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAnalyze(q, section.id)} disabled={!!processingId} className="text-xs hover:text-blue-600 flex items-center gap-1 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                    {processingId === q.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-chart-bar text-blue-500"></i>} Analyze
                                                </button>
                                                
                                                {/* Spin Dropdown */}
                                                <div className="relative group/spin">
                                                    <button className="text-xs hover:text-purple-600 flex items-center gap-1 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                        <i className="fas fa-sync-alt text-purple-500"></i> Spin <i className="fas fa-chevron-down text-[10px]"></i>
                                                    </button>
                                                    <div className="absolute left-0 bottom-full mb-1 w-40 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden hidden group-hover/spin:block z-10">
                                                        <button onClick={() => handleSpin(q, section.id, 'HARDER')} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">Make Harder</button>
                                                        <button onClick={() => handleSpin(q, section.id, 'CONTEXT')} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">Local Context</button>
                                                        <button onClick={() => handleSpin(q, section.id, 'TYPE_SWAP')} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">Change Type</button>
                                                    </div>
                                                </div>

                                                {q.type === QuestionType.OBJECTIVE && (
                                                    <div className="relative group/tooltip">
                                                        <button onClick={() => handleFixDistractors(q, section.id)} disabled={!!processingId} className="text-xs hover:text-amber-600 flex items-center gap-1 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                        <i className="fas fa-magic text-amber-500"></i> Fix Wrong Options
                                                        </button>
                                                        {/* Tooltip */}
                                                        <div className="absolute hidden group-hover/tooltip:block bg-slate-900 text-white text-[10px] p-2 rounded w-48 bottom-full mb-2 left-0 z-20 shadow-lg">
                                                            Replaces easy wrong answers with harder ones so students can't just guess.
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {q.type === QuestionType.THEORY && (
                                                    <div className="relative group/tooltip">
                                                        <button onClick={() => handleGenerateRubric(q, section.id)} disabled={!!processingId} className="text-xs hover:text-green-600 flex items-center gap-1 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                            <i className="fas fa-list-check text-green-500"></i> Marking Guide
                                                        </button>
                                                        {/* Tooltip */}
                                                        <div className="absolute hidden group-hover/tooltip:block bg-slate-900 text-white text-[10px] p-2 rounded w-48 bottom-full mb-2 left-0 z-20 shadow-lg">
                                                            Generates a guide on how to award marks for this question.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Standard Actions */}
                                            <div className="ml-auto flex items-center gap-2">
                                                 <button onClick={() => deleteQuestion(section.id, q.id)} className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1"><i className="fas fa-trash"></i></button>
                                                <span className="font-bold text-xs text-slate-600">Marks:</span>
                                                <input 
                                                    type="number" 
                                                    className="w-12 border border-slate-300 rounded px-1 py-1 bg-white text-slate-900 text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-xs" 
                                                    value={q.marks || 1} 
                                                    onChange={(e) => handleQuestionChange(section.id, q.id, 'marks', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {section.questions.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                    No questions in this section yet.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {canEdit && (
                    <button 
                        onClick={() => {
                            const newSec: ExamSection = {
                                id: crypto.randomUUID(),
                                title: "New Section",
                                instructions: "",
                                questions: []
                            };
                            setPaper({...paper, sections: [...paper.sections, newSec]});
                        }}
                        className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all font-bold bg-white dark:bg-slate-800 shadow-sm"
                    >
                        <i className="fas fa-plus-circle mr-2"></i> Add New Section
                    </button>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};
