import React, { useState } from 'react';
import { generateQuestionsFromAI } from '../../services/geminiService';
import { ExamSection, QuestionType, Difficulty, NIGERIAN_SUBJECTS } from '../../types';

interface AIGeneratorProps {
  onSuccess: (sections: ExamSection[]) => void;
  onCancel: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onSuccess, onCancel }) => {
  const [subject, setSubject] = useState(NIGERIAN_SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [qType, setQType] = useState<QuestionType>(QuestionType.OBJECTIVE);
  const [count, setCount] = useState(10);
  const [lessonPlan, setLessonPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sections = await generateQuestionsFromAI(subject, topic, difficulty, qType, count, lessonPlan);
      onSuccess(sections);
    } catch (error) {
      alert("Failed to generate questions. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 bg-white rounded-none md:rounded-2xl shadow-none md:shadow-xl mt-0 md:mt-10 min-h-screen md:min-h-0">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <i className="fas fa-wand-magic-sparkles mr-3 text-purple-600"></i> 
            AI Generator
        </h2>
        <p className="text-sm text-slate-500 mt-1">Generate questions based on Nigerian Curriculum</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject & Topic - Stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Subject</label>
                <div className="relative">
                    <select 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm appearance-none text-base"
                    >
                        {NIGERIAN_SUBJECTS.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-600">
                        <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-bold text-slate-800 mb-2">Topic</label>
                <input 
                    type="text" 
                    required 
                    className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-sm text-base"
                    placeholder="e.g. Nigerian Constitution"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Teacher's Plan / Context (Optional)</label>
            <textarea 
                className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-sm text-base"
                placeholder="Paste your lesson note summary here to make questions specific to what you taught..."
                rows={4}
                value={lessonPlan}
                onChange={e => setLessonPlan(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Difficulty</label>
                <div className="relative">
                    <select 
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm appearance-none text-base"
                    >
                        <option value={Difficulty.EASY}>Easy</option>
                        <option value={Difficulty.MEDIUM}>Medium</option>
                        <option value={Difficulty.HARD}>Hard</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-600">
                        <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Question Type</label>
                <div className="relative">
                    <select 
                        value={qType}
                        onChange={(e) => setQType(e.target.value as QuestionType)}
                        className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm appearance-none text-base"
                    >
                        <option value={QuestionType.OBJECTIVE}>Multiple Choice (OBJ)</option>
                        <option value={QuestionType.FILL_IN_THE_BLANK}>Fill-in-the-blank</option>
                        <option value={QuestionType.THEORY}>Essay / Theory</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-600">
                        <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Number of Questions</label>
            <div className="flex gap-4 items-center">
                <div className="flex-1">
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={count} 
                        onChange={e => setCount(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1</span>
                        <span>100</span>
                    </div>
                </div>
                <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={count} 
                    onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 p-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold text-center focus:ring-2 focus:ring-purple-500 outline-none shadow-sm text-lg"
                />
            </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row gap-3">
             <button type="button" onClick={onCancel} className="w-full md:flex-1 py-4 text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 font-bold text-base">
                Cancel
             </button>
             <button 
                type="submit" 
                disabled={loading}
                className="w-full md:flex-1 py-4 text-white bg-purple-600 rounded-xl hover:bg-purple-700 font-bold shadow-lg disabled:opacity-70 flex justify-center items-center text-base"
             >
                {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
                {loading ? "Thinking..." : "Generate Questions"}
             </button>
        </div>
      </form>
    </div>
  );
};