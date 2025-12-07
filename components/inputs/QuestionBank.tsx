import React, { useState, useEffect } from 'react';
import { ExamSection, QuestionType, Question, NIGERIAN_SUBJECTS } from '../../types';
import { getQuestionBank, saveQuestionsToBank } from '../../services/storageService';

interface QuestionBankProps {
    onSuccess: (sections: ExamSection[]) => void;
    onCancel: () => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({ onSuccess, onCancel }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [uploadText, setUploadText] = useState('');

    useEffect(() => {
        setQuestions(getQuestionBank());
    }, []);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleImport = () => {
        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
        const newSection: ExamSection = {
            id: crypto.randomUUID(),
            title: "Question Bank Import",
            instructions: "Answer all questions.",
            questions: selectedQuestions.map(q => ({...q, id: crypto.randomUUID()})) 
        };
        onSuccess([newSection]);
    };

    const handleUpload = () => {
        // Mock parsing simple format: Subject|Topic|Type|Text
        const lines = uploadText.split('\n');
        const newQuestions: Question[] = [];
        
        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length >= 4) {
                newQuestions.push({
                    id: crypto.randomUUID(),
                    subject: parts[0].trim(),
                    topic: parts[1].trim(),
                    type: parts[2].trim() === 'OBJ' ? QuestionType.OBJECTIVE : QuestionType.THEORY,
                    text: parts[3].trim(),
                    marks: 1
                });
            }
        });

        saveQuestionsToBank(newQuestions);
        setQuestions(getQuestionBank());
        setShowUpload(false);
        setUploadText('');
        alert(`Added ${newQuestions.length} questions to the bank.`);
    };

    const filteredQuestions = questions.filter(q => {
        const term = searchTerm.toLowerCase();
        const textMatch = q.text.toLowerCase().includes(term);
        const subjectFilter = selectedSubject ? q.subject === selectedSubject : true;
        return textMatch && subjectFilter;
    });

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-4 md:mt-10 h-[85vh] flex flex-col">
            <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <i className="fas fa-database mr-2 text-emerald-500"></i> Question Bank
                    </h2>
                    <button onClick={() => setShowUpload(!showUpload)} className="text-sm text-primary font-bold hover:underline">
                        {showUpload ? 'Back to Search' : 'Upload Questions'}
                    </button>
                </div>
                
                {showUpload ? (
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Format: Subject | Topic | Type (OBJ/THEORY) | Question Text</p>
                        <textarea 
                            className="w-full h-32 p-2 border rounded mb-2 text-sm font-mono bg-white text-slate-900"
                            placeholder="Mathematics | Algebra | OBJ | Solve for x: 2x=4"
                            value={uploadText}
                            onChange={e => setUploadText(e.target.value)}
                        />
                        <button onClick={handleUpload} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold text-sm">Add to Bank</button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Search questions..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" 
                            />
                            <i className="fas fa-search absolute left-3 top-3.5 text-slate-400 text-xs"></i>
                        </div>
                        <select 
                            className="p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 outline-none"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {NIGERIAN_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {!showUpload && (
                <>
                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                        {filteredQuestions.length > 0 ? (
                            filteredQuestions.map(q => (
                                <div 
                                    key={q.id} 
                                    onClick={() => toggleSelection(q.id)}
                                    className={`p-4 rounded-lg cursor-pointer border transition-all shadow-sm ${selectedIds.has(q.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">{q.type}</span>
                                                {q.subject && <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">{q.subject}</span>}
                                            </div>
                                            <p className="font-medium text-slate-900 leading-relaxed">{q.text}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedIds.has(q.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                            {selectedIds.has(q.id) && <i className="fas fa-check text-xs"></i>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <i className="fas fa-search-minus text-4xl mb-4 text-slate-300"></i>
                                <p>No questions found.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-between items-center border-t pt-4">
                        <span className="text-slate-600 text-sm font-medium">
                            {selectedIds.size} selected
                        </span>
                        <div className="flex gap-3">
                            <button onClick={onCancel} className="px-6 py-2.5 text-slate-700 font-bold bg-slate-100 border border-slate-300 hover:bg-slate-200 rounded-xl text-sm">
                                Cancel
                            </button>
                            <button 
                                onClick={handleImport} 
                                disabled={selectedIds.size === 0}
                                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-md text-sm"
                            >
                                Import Questions
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};