
import React, { useState } from 'react';
import { loginUser, registerSchoolAndOfficer } from '../services/storageService';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError("Invalid email or password. Please check your credentials.");
    }
  };

  const calculateStrength = (pass: string) => {
      let score = 0;
      if (!pass) return 0;
      if (pass.length > 7) score++; // Length
      if (/[A-Z]/.test(pass)) score++; // Uppercase
      if (/[0-9]/.test(pass)) score++; // Number
      if (/[^A-Za-z0-9]/.test(pass)) score++; // Special char
      return score;
  };

  const strength = calculateStrength(password);
  const getStrengthColor = () => {
      if (strength <= 1) return 'bg-red-500';
      if (strength === 2) return 'bg-yellow-500';
      if (strength === 3) return 'bg-blue-500';
      return 'bg-green-500';
  };
  const getStrengthText = () => {
      if (strength <= 1) return 'Weak';
      if (strength === 2) return 'Fair';
      if (strength === 3) return 'Good';
      return 'Strong';
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !schoolName || !password) {
      setError("All fields are required.");
      return;
    }
    if (strength < 2) {
        setError("Password is too weak. Please use a stronger password.");
        return;
    }
    const user = registerSchoolAndOfficer(schoolName, fullName, email, password);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                <i className="fas fa-layer-group"></i>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-primary dark:text-indigo-400 mb-2">ExamFlow AI</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Sign in to manage exams" : "Register your school"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="teacher@school.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg transition-colors">
              Sign In
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              New School? <button type="button" onClick={() => setIsLogin(false)} className="text-primary dark:text-indigo-400 font-bold hover:underline">Register here</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
             <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">School Name</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Lagos Model College"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name (Exam Officer)</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Mr. Adebayo"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="admin@school.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="Create a strong password"
              />
              {/* Strength Meter */}
              {password && (
                  <div className="mt-2">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full ${strength > 0 ? getStrengthColor() : 'bg-transparent'} w-1/4 transition-all`}></div>
                          <div className={`h-full ${strength > 1 ? getStrengthColor() : 'bg-transparent'} w-1/4 transition-all`}></div>
                          <div className={`h-full ${strength > 2 ? getStrengthColor() : 'bg-transparent'} w-1/4 transition-all`}></div>
                          <div className={`h-full ${strength > 3 ? getStrengthColor() : 'bg-transparent'} w-1/4 transition-all`}></div>
                      </div>
                      <p className="text-xs mt-1 text-right text-slate-500 dark:text-slate-400">Strength: {getStrengthText()}</p>
                  </div>
              )}
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg transition-colors">
              Create School Account
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Already registered? <button type="button" onClick={() => setIsLogin(true)} className="text-primary dark:text-indigo-400 font-bold hover:underline">Sign In</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
