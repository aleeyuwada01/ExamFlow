
import React, { useState } from 'react';
import { loginUser, registerSchoolAndOfficer } from '../services/storageService';
import { User, NIGERIAN_STATES, UserRole } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [state, setState] = useState('Katsina');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError("Invalid credentials. Try the demo buttons below.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !schoolName || !password || !state) {
      setError("All fields are required.");
      return;
    }
    const user = registerSchoolAndOfficer(schoolName, state, fullName, email, password);
    onLogin(user);
  };

  const fillDemo = (role: UserRole) => {
      if (role === UserRole.EXAM_OFFICER) {
          setEmail('officer@demo.com');
          setPassword('officer123');
      } else if (role === UserRole.TEACHER) {
          setEmail('teacher@demo.com');
          setPassword('teacher123');
      }
  };

  const inputClasses = "w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                <i className="fas fa-layer-group"></i>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-primary dark:text-indigo-400 mb-2">ExamFlow AI</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Sign in to manage exams" : "Register your school"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 font-medium">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} placeholder="teacher@school.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg active:scale-95 transition-transform">
              Sign In
            </button>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 mb-3 text-center tracking-widest">Demo Credentials</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => fillDemo(UserRole.TEACHER)} className="flex-1 py-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors">
                        <i className="fas fa-chalkboard-teacher mr-1"></i> Teacher
                    </button>
                    <button type="button" onClick={() => fillDemo(UserRole.EXAM_OFFICER)} className="flex-1 py-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors">
                        <i className="fas fa-user-shield mr-1"></i> Officer
                    </button>
                </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">
              New School? <button type="button" onClick={() => setIsLogin(false)} className="text-primary font-bold hover:underline">Register here</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
             <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">School Name</label>
              <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className={inputClasses} placeholder="e.g. Lagos Model College" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                <select value={state} onChange={e => setState(e.target.value)} className={inputClasses}>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name (Exam Officer)</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} placeholder="e.g. Mr. Adebayo" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} placeholder="admin@school.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg transition-transform active:scale-95">
              Create School Account
            </button>
            <p className="text-center text-sm text-slate-500 mt-4">
              Already registered? <button type="button" onClick={() => setIsLogin(true)} className="text-primary font-bold hover:underline">Sign In</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
