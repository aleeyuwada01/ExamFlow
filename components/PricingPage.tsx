
import React, { useState, useEffect } from 'react';
import { getSystemConfig } from '../services/storageService';
import { SystemConfig, ViewState } from '../types';

interface PricingPageProps {
  onBack: () => void;
  onSelectPlan: () => void; // Usually opens the Top-up modal in Dashboard
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSelectPlan }) => {
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Choose Your Power</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Whether you are a solo teacher or managing a whole department, we have a plan to speed up your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-2 dark:text-white">Free Trial</h3>
            <div className="text-3xl font-black mb-6 dark:text-white">₦0</div>
            <ul className="space-y-4 mb-10 text-sm text-slate-600 dark:text-slate-400">
              <li><i className="fas fa-check text-emerald-500 mr-2"></i> {config.initialFreeTokens} AI Tokens included</li>
              <li><i className="fas fa-check text-emerald-500 mr-2"></i> Standard Question Gen</li>
              <li><i className="fas fa-check text-emerald-500 mr-2"></i> Snap-to-Text OCR</li>
              <li><i className="fas fa-check text-emerald-500 mr-2"></i> PDF/Word Exports</li>
            </ul>
            <button disabled className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl">Current Plan</button>
          </div>

          {/* Starter Tier */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-indigo-600 shadow-xl relative scale-105 z-10">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Recommended</span>
            <h3 className="text-xl font-bold mb-2 dark:text-white">Starter Refill</h3>
            <div className="text-3xl font-black mb-6 dark:text-white">₦{config.starterPrice.toLocaleString()}<span className="text-sm text-slate-400 font-normal ml-1">/ 30 tokens</span></div>
            <ul className="space-y-4 mb-10 text-sm text-slate-600 dark:text-slate-400">
              <li><i className="fas fa-check text-indigo-500 mr-2"></i> 30 Premium AI Tokens</li>
              <li><i className="fas fa-check text-indigo-500 mr-2"></i> Higher reasoning logic</li>
              <li><i className="fas fa-check text-indigo-500 mr-2"></i> Question Bank Access</li>
              <li><i className="fas fa-check text-indigo-500 mr-2"></i> Standard Support</li>
            </ul>
            <button onClick={onSelectPlan} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Upgrade Now</button>
          </div>

          {/* Ultra Tier */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm text-white">
            <h3 className="text-xl font-bold mb-2">Ultra (Unlimited)</h3>
            <div className="text-3xl font-black mb-6">₦{config.ultraPrice.toLocaleString()}<span className="text-sm text-slate-500 font-normal ml-1">/ account</span></div>
            <ul className="space-y-4 mb-10 text-sm text-slate-400">
              <li><i className="fas fa-crown text-amber-500 mr-2"></i> UNLIMITED AI Usage</li>
              <li><i className="fas fa-check text-amber-500 mr-2"></i> All Premium Templates</li>
              <li><i className="fas fa-check text-amber-500 mr-2"></i> Batch OCR Processing</li>
              <li><i className="fas fa-check text-amber-500 mr-2"></i> 24/7 Priority Support</li>
            </ul>
            <button onClick={onSelectPlan} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">Go Unlimited</button>
          </div>
        </div>

        <div className="mt-20 p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 text-center">
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Note for School Owners</h2>
          <p className="text-indigo-700 dark:text-indigo-400 max-w-3xl mx-auto">
            The Ultra plan is per individual account. If you wish to provide unlimited access to all your teachers, each account must be upgraded to Ultra independently. This ensures high-performance dedicated AI resources for every staff member.
          </p>
        </div>
      </div>
    </div>
  );
};
