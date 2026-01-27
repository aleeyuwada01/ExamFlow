
import React, { useState, useEffect } from 'react';
import { getSystemConfig } from '../services/storageService';
import { SystemConfig } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());

  useEffect(() => {
    setConfig(getSystemConfig());
  }, []);

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
                <i className="fas fa-layer-group"></i>
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden md:block">ExamFlow AI</span>
            <span className="text-xl font-extrabold tracking-tight md:hidden">ExamFlow</span>
        </div>
        <div className="flex items-center gap-6">
            <button onClick={scrollToPricing} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors hidden md:block">Pricing</button>
            <button onClick={onLogin} className="text-slate-600 font-bold hover:text-indigo-600 transition-colors">
                Log In
            </button>
            <button onClick={onGetStarted} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
                Get Started
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-7xl mx-auto px-6 pt-6 pb-16 md:pt-20 md:pb-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 relative z-10 order-2 md:order-1">
            <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full">
                For Nigerian Schools 🇳🇬
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900">
                Create Perfect Exam Papers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Minutes.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg">
                Stop typing questions for hours. Use AI to generate WAEC/NECO standard questions, or simply snap a photo of your handwritten notes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={onGetStarted} className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-300 flex items-center justify-center gap-2">
                    Start Creating Free <i className="fas fa-arrow-right"></i>
                </button>
                <button onClick={onLogin} className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 text-lg font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-sign-in-alt"></i> School Login
                </button>
            </div>
        </div>
        
        <div className="relative order-1 md:order-2">
            <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            {/* HERO CARD - RESTORED ORIGINAL VIBE */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 transform rotate-2 mx-auto max-w-sm">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div>
                            <div className="font-black text-slate-900 text-lg leading-none">JSS 2 Basic Science</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">First Term Examination</div>
                        </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter shadow-sm border border-emerald-200">READY</span>
                </div>
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Question 1</span>
                        <p className="font-bold text-slate-800 text-sm mt-1 leading-snug">Which of these is a biotic factor in a Nigerian forest ecosystem?</p>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="p-2 rounded border text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700">
                                <span className="mr-1">A.</span> Iroko Tree
                            </div>
                            <div className="p-2 rounded border text-[10px] font-bold bg-white border-slate-200 text-slate-500">
                                <span className="mr-1">B.</span> Soil Texture
                            </div>
                            <div className="p-2 rounded border text-[10px] font-bold bg-white border-slate-200 text-slate-500">
                                <span className="mr-1">C.</span> Water PH
                            </div>
                            <div className="p-2 rounded border text-[10px] font-bold bg-white border-slate-200 text-slate-500">
                                <span className="mr-1">D.</span> Sunlight
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 opacity-20">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                </div>
            </div>
            
            {/* Floating Decorations */}
            <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-xl shadow-xl border border-slate-100 transform -rotate-6 hidden md:block">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase">
                    <i className="fas fa-check-double"></i> WAEC Standard
                </div>
            </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Simple, Fair Pricing</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">Choose the plan that fits your school or individual needs. No hidden fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Plan */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Free Trial</h3>
                        <p className="text-slate-500 text-sm">Test the AI magic</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-4xl font-black">₦0</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-emerald-500"></i> {config.initialFreeTokens} Free AI Tokens</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-emerald-500"></i> Snap-to-Text OCR</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-emerald-500"></i> WAEC/NECO Standards</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-emerald-500"></i> PDF & Word Export</li>
                    </ul>
                    <button onClick={onGetStarted} className="w-full py-3 px-6 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Start Free</button>
                </div>

                {/* Starter Plan */}
                <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl flex flex-col h-full relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Refill</h3>
                        <p className="text-slate-500 text-sm">For consistent creators</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-4xl font-black">₦{config.starterPrice.toLocaleString()}</span>
                        <span className="text-slate-400 text-sm ml-2">/ 30 tokens</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-indigo-500"></i> 30 Additional AI Tokens</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-indigo-500"></i> Priority Question Generation</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-indigo-500"></i> Smart Answer Keys</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><i className="fas fa-check-circle text-indigo-500"></i> Question Bank Access</li>
                    </ul>
                    <button onClick={onLogin} className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Upgrade Now</button>
                </div>

                {/* Ultra Plan */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm flex flex-col h-full text-white">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold">Ultra (Per User)</h3>
                        <p className="text-slate-400 text-sm">Power users & Specialists</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-4xl font-black">₦{config.ultraPrice.toLocaleString()}</span>
                        <span className="text-slate-500 text-sm ml-2">/ account</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-center gap-2 text-sm text-slate-300"><i className="fas fa-crown text-amber-500"></i> UNLIMITED AI Usage</li>
                        <li className="flex items-center gap-2 text-sm text-slate-300"><i className="fas fa-check-circle text-amber-500"></i> Premium Exam Templates</li>
                        <li className="flex items-center gap-2 text-sm text-slate-300"><i className="fas fa-check-circle text-amber-500"></i> Advanced Compliance Checks</li>
                        <li className="flex items-center gap-2 text-sm text-slate-300"><i className="fas fa-check-circle text-amber-500"></i> Dedicated 24/7 Support</li>
                    </ul>
                    <button onClick={onLogin} className="w-full py-3 px-6 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">Go Unlimited</button>
                </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-12 italic">Note: Unlimited access is per-account. Even school officers must upgrade individual accounts for unlimited AI.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-800 pb-12 mb-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <span className="text-lg font-bold text-white">ExamFlow AI</span>
                </div>
                <p className="text-sm max-w-sm leading-relaxed text-slate-400">
                    Revolutionizing education in Nigeria with AI-powered assessment tools. Built by teachers, for teachers.
                </p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Navigation</h4>
                <ul className="space-y-2 text-sm">
                    <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-indigo-400 transition-colors">Home</button></li>
                    <li><button onClick={scrollToPricing} className="hover:text-indigo-400 transition-colors">Pricing</button></li>
                    <li><button onClick={onLogin} className="hover:text-indigo-400 transition-colors">Login</button></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Connect With Us</h4>
                <div className="flex gap-4 text-xl">
                    {config.socialLinks.twitter && (
                        <a href={config.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                            <i className="fab fa-twitter"></i>
                        </a>
                    )}
                    {config.socialLinks.facebook && (
                        <a href={config.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                            <i className="fab fa-facebook"></i>
                        </a>
                    )}
                    {config.socialLinks.instagram && (
                        <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                            <i className="fab fa-instagram"></i>
                        </a>
                    )}
                    {config.socialLinks.linkedin && (
                        <a href={config.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
                            <i className="fab fa-linkedin"></i>
                        </a>
                    )}
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} ExamFlow AI. Built with ❤️ in Nigeria.</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
        </div>
      </footer>
    </div>
  );
};
