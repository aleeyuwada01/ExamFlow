
import React, { useState, useEffect } from 'react';
import { User, School, UserRole, NIGERIAN_SUBJECTS, SCHOOL_CLASSES } from '../types';
import { getSchool, saveSchool, getSchoolTeachers, saveUser, bulkCreateUsers, generateTeacherCredentials } from '../services/storageService';

interface SchoolSettingsProps {
  currentUser: User;
  onBack: () => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ currentUser, onBack }) => {
  const [school, setSchool] = useState<School | undefined>(undefined);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'TEMPLATE' | 'TEACHERS'>('TEMPLATE');
  
  // Template State
  const [footerText, setFooterText] = useState('');
  const [headerLayout, setHeaderLayout] = useState<'LEFT' | 'CENTER'>('CENTER');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [themeColor, setThemeColor] = useState('#000000');
  
  // Teacher Management State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [formSuccess, setFormSuccess] = useState('');
  
  // Bulk Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Auto Generate State
  const [autoGenSubject, setAutoGenSubject] = useState(NIGERIAN_SUBJECTS[0]);
  const [autoGenClasses, setAutoGenClasses] = useState<Set<string>>(new Set());
  const [generatedPreview, setGeneratedPreview] = useState<any[]>([]);

  useEffect(() => {
    const s = getSchool(currentUser.schoolId);
    if (s) {
      setSchool(s);
      setFooterText(s.template.footerText);
      setHeaderLayout(s.template.headerLayout);
      setFontFamily(s.template.fontFamily);
      setThemeColor(s.template.themeColor || '#000000');
    }
    setTeachers(getSchoolTeachers(currentUser.schoolId));
  }, [currentUser]);

  // --- Template Logic ---

  const handleSaveTemplate = () => {
    if (!school) return;
    const updatedSchool: School = {
      ...school,
      template: {
        ...school.template,
        footerText,
        headerLayout,
        fontFamily,
        themeColor
      }
    };
    saveSchool(updatedSchool);
    setSchool(updatedSchool);
    alert("Template settings saved successfully!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && school) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedSchool = { ...school, logoUrl: reader.result as string };
        saveSchool(updatedSchool);
        setSchool(updatedSchool);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Teacher Logic ---

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    let pass = "";
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewTeacherPassword(pass);
  };

  const toggleSubject = (sub: string) => {
    const next = new Set(selectedSubjects);
    if(next.has(sub)) next.delete(sub);
    else next.add(sub);
    setSelectedSubjects(next);
  };

  const toggleClass = (cls: string) => {
    const next = new Set(selectedClasses);
    if(next.has(cls)) next.delete(cls);
    else next.add(cls);
    setSelectedClasses(next);
  };

  const toggleAutoGenClass = (cls: string) => {
      const next = new Set(autoGenClasses);
      if(next.has(cls)) next.delete(cls);
      else next.add(cls);
      setAutoGenClasses(next);
  };

  const handleAddTeacher = () => {
    if(!newTeacherName || !newTeacherEmail || !newTeacherPassword) {
        alert("Please fill in Name, Email and Password.");
        return;
    }

    const newUser: User = {
        id: crypto.randomUUID(),
        name: newTeacherName,
        email: newTeacherEmail,
        role: UserRole.TEACHER,
        schoolId: currentUser.schoolId,
        subjects: Array.from(selectedSubjects),
        classes: Array.from(selectedClasses),
        password: newTeacherPassword // In a real app, hash this!
    };

    saveUser(newUser);
    setTeachers(getSchoolTeachers(currentUser.schoolId));
    setFormSuccess(`Created account for ${newTeacherName} with password: ${newTeacherPassword}`);
    
    // Reset
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherPassword('');
    setSelectedSubjects(new Set());
    setSelectedClasses(new Set());
    setShowAddForm(false);
  };

  const handleBulkUpload = async () => {
      if (!csvFile) return;
      const text = await csvFile.text();
      const result = bulkCreateUsers(text, currentUser.schoolId);
      
      setTeachers(getSchoolTeachers(currentUser.schoolId));
      let message = `Created ${result.created} accounts successfully.`;
      if (result.errors.length > 0) {
          message += `\nEncountered ${result.errors.length} errors. Check console details.`;
          console.warn('Bulk Upload Errors:', result.errors);
      }
      alert(message);
      setCsvFile(null);
  };

  const handlePreviewGeneration = () => {
      if (!school || autoGenClasses.size === 0) {
          alert("Please select a school and at least one class.");
          return;
      }
      const previews: any[] = [];
      autoGenClasses.forEach(cls => {
          const creds = generateTeacherCredentials(school.name, autoGenSubject, cls);
          previews.push({ ...creds, subject: autoGenSubject, className: cls });
      });
      setGeneratedPreview(previews);
  };

  const handleConfirmGeneration = () => {
      if (!generatedPreview.length) return;
      
      let createdCount = 0;
      generatedPreview.forEach(p => {
           const newUser: User = {
            id: crypto.randomUUID(),
            name: p.name,
            email: p.email,
            password: p.password,
            role: UserRole.TEACHER,
            schoolId: currentUser.schoolId,
            subjects: [p.subject],
            classes: [p.className]
          };
          saveUser(newUser);
          createdCount++;
      });
      
      setTeachers(getSchoolTeachers(currentUser.schoolId));
      alert(`Successfully created ${createdCount} teacher accounts!`);
      setGeneratedPreview([]);
      setAutoGenClasses(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="bg-white dark:bg-slate-800 p-2 rounded-full shadow hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">School Administration</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage settings for {school?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-1">
        <button 
          onClick={() => setActiveTab('TEMPLATE')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 ${activeTab === 'TEMPLATE' ? 'border-primary text-primary dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <i className="fas fa-palette mr-2"></i> Exam Template
        </button>
        <button 
           onClick={() => setActiveTab('TEACHERS')}
           className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-all border-b-2 ${activeTab === 'TEACHERS' ? 'border-primary text-primary dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <i className="fas fa-chalkboard-teacher mr-2"></i> Manage Teachers
        </button>
      </div>

      {activeTab === 'TEMPLATE' && school && (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-250px)]">
           {/* Controls Panel */}
           <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-y-auto">
                <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Visual Editor</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">School Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 rounded flex items-center justify-center overflow-hidden">
                                {school.logoUrl ? <img src={school.logoUrl} className="w-full h-full object-contain" /> : <i className="fas fa-school text-slate-300 dark:text-slate-500"></i>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-600" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Header Layout</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setHeaderLayout('CENTER')}
                                className={`p-3 border rounded-lg text-sm flex flex-col items-center gap-2 ${headerLayout === 'CENTER' ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-indigo-400' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <div className="w-full h-2 bg-current rounded opacity-20"></div>
                                <div className="w-1/2 h-2 bg-current rounded opacity-40"></div>
                                <span className="font-bold">Centered</span>
                            </button>
                            <button 
                                onClick={() => setHeaderLayout('LEFT')}
                                className={`p-3 border rounded-lg text-sm flex flex-col items-start gap-2 ${headerLayout === 'LEFT' ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-indigo-400' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <div className="flex gap-2 w-full">
                                    <div className="w-4 h-4 bg-current rounded-full opacity-20"></div>
                                    <div className="flex-1 space-y-1">
                                         <div className="w-full h-2 bg-current rounded opacity-40"></div>
                                         <div className="w-2/3 h-2 bg-current rounded opacity-40"></div>
                                    </div>
                                </div>
                                <span className="font-bold self-center">Left Aligned</span>
                            </button>
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Theme Color</label>
                         <div className="flex gap-2">
                             {['#000000', '#4F46E5', '#059669', '#DC2626', '#D97706'].map(c => (
                                 <button 
                                    key={c}
                                    onClick={() => setThemeColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 ${themeColor === c ? 'border-slate-800 dark:border-white ring-2 ring-slate-200 dark:ring-slate-600' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                 />
                             ))}
                         </div>
                    </div>

                     <div>
                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Font Family</label>
                        <select 
                            value={fontFamily} 
                            onChange={(e) => setFontFamily(e.target.value as any)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="sans">Sans Serif (Modern)</option>
                            <option value="serif">Serif (Formal)</option>
                            <option value="mono">Monospace (Technical)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Footer Text</label>
                        <input 
                            type="text" 
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    <button onClick={handleSaveTemplate} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
                        Save Changes
                    </button>
                </div>
           </div>

           {/* Live Preview Panel - Keeps paper white context */}
           <div className="flex-1 bg-slate-200 dark:bg-slate-900 rounded-2xl p-8 overflow-y-auto flex justify-center items-start shadow-inner border dark:border-slate-700">
                <div 
                    className="bg-white shadow-2xl transition-all duration-300"
                    style={{ 
                        width: '210mm', 
                        minHeight: '297mm', 
                        padding: '15mm',
                        transform: 'scale(0.8)',
                        transformOrigin: 'top center',
                        fontFamily: fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : 'monospace',
                        color: themeColor
                    }}
                >
                    {/* Live Header Preview */}
                    <div className="border-b-2 pb-6 mb-8" style={{ borderColor: themeColor }}>
                        {headerLayout === 'CENTER' ? (
                            <div className="text-center">
                                {school.logoUrl && <img src={school.logoUrl} className="h-16 mx-auto mb-2" />}
                                <h1 className="text-3xl font-extrabold uppercase mb-1">{school.name}</h1>
                                <p className="font-bold text-lg opacity-80">First Term Examination 2024</p>
                            </div>
                        ) : (
                             <div className="flex items-center gap-6">
                                {school.logoUrl && <img src={school.logoUrl} className="h-24 w-24 object-contain" />}
                                <div>
                                    <h1 className="text-3xl font-extrabold uppercase mb-1">{school.name}</h1>
                                    <p className="font-bold text-lg opacity-80">First Term Examination 2024</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-8 grid grid-cols-2 gap-y-2 font-medium text-black">
                             <div className="flex"><span className="w-24 opacity-60">Subject:</span> <span className="uppercase font-bold border-b border-dotted border-slate-400 flex-1">MATHEMATICS</span></div>
                             <div className="flex"><span className="w-24 opacity-60">Class:</span> <span className="font-bold border-b border-dotted border-slate-400 flex-1">JSS 2</span></div>
                             <div className="flex"><span className="w-24 opacity-60">Duration:</span> <span className="font-bold border-b border-dotted border-slate-400 flex-1">2 HOURS</span></div>
                             <div className="flex"><span className="w-24 opacity-60">Name:</span> <span className="border-b border-dotted border-slate-400 flex-1"></span></div>
                        </div>
                    </div>

                    <div className="space-y-6 opacity-40">
                        <div>
                            <h3 className="font-bold text-lg uppercase border-b mb-2 inline-block">Section A: Objective</h3>
                            <p className="mb-2">1. This is a sample question showing how the font looks?</p>
                            <div className="grid grid-cols-4 gap-4 text-sm ml-4">
                                <span>A. Option</span>
                                <span>B. Option</span>
                                <span>C. Option</span>
                                <span>D. Option</span>
                            </div>
                        </div>
                         <div>
                            <p className="mb-2">2. Another sample question to test readability.</p>
                            <div className="grid grid-cols-4 gap-4 text-sm ml-4">
                                <span>A. Option</span>
                                <span>B. Option</span>
                                <span>C. Option</span>
                                <span>D. Option</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-4 border-t text-center text-sm opacity-60" style={{ borderColor: themeColor }}>
                        {footerText}
                    </div>
                </div>
           </div>
        </div>
      )}

      {activeTab === 'TEACHERS' && (
         <div className="max-w-5xl mx-auto">
            {/* Add Teacher Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 overflow-hidden">
                <div 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white"><i className="fas fa-user-plus mr-2 text-primary"></i> Add New Teacher</h2>
                    <i className={`fas fa-chevron-${showAddForm ? 'up' : 'down'} text-slate-400`}></i>
                </div>
                
                {showAddForm && (
                    <div className="p-6 bg-white dark:bg-slate-800">
                        {formSuccess && (
                            <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center gap-3">
                                <i className="fas fa-check-circle text-xl"></i>
                                <div>
                                    <p className="font-bold">Success!</p>
                                    <p className="text-sm">{formSuccess}</p>
                                </div>
                                <button onClick={() => setFormSuccess('')} className="ml-auto text-green-700 hover:text-green-900 dark:hover:text-green-200"><i className="fas fa-times"></i></button>
                            </div>
                        )}

                        {/* Auto Generate Teachers Section */}
                        <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl">
                            <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center">
                                <i className="fas fa-robot mr-2"></i> Auto-Generate Subject Teachers
                            </h4>
                            <p className="text-sm text-purple-600 dark:text-purple-200 mb-4">
                                Quickly create accounts for specific subject teachers across multiple classes.
                                (e.g., Creates "Maths JSS1", "Maths JSS2" accounts).
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Select Subject</label>
                                    <select 
                                        value={autoGenSubject}
                                        onChange={(e) => setAutoGenSubject(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {NIGERIAN_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Select Classes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SCHOOL_CLASSES.map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => toggleAutoGenClass(cls)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${autoGenClasses.has(cls) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {generatedPreview.length > 0 && (
                                <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-300">Preview Accounts to Create</div>
                                    <div className="max-h-40 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 border-b dark:border-slate-700">
                                                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Password</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {generatedPreview.map((p, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 dark:text-white">{p.name}</td>
                                                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{p.email}</td>
                                                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{p.password}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    onClick={handlePreviewGeneration}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Preview Accounts
                                </button>
                                <button 
                                    onClick={handleConfirmGeneration}
                                    disabled={generatedPreview.length === 0}
                                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Confirm & Create {generatedPreview.length > 0 ? `(${generatedPreview.length})` : ''}
                                </button>
                            </div>
                        </div>
                        
                        {/* Bulk Upload Section */}
                        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2"><i className="fas fa-file-csv mr-2"></i> Bulk Upload CSV</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-200 mb-4">Upload a CSV file to create multiple accounts at once. <br/>Format: <code>Name, Email, Password, Subjects(pipe separated), Classes(pipe separated)</code></p>
                            <div className="flex gap-4">
                                <input 
                                    type="file" 
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-blue-100 file:text-blue-700
                                      hover:file:bg-blue-200
                                      dark:file:bg-blue-900 dark:file:text-blue-300
                                    "
                                />
                                <button 
                                    onClick={handleBulkUpload}
                                    disabled={!csvFile}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Upload & Create
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-6 dark:border-slate-700 mt-6">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Manual Entry</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g. Mr. John Doe"
                                        value={newTeacherName}
                                        onChange={e => setNewTeacherName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="teacher@school.com"
                                        value={newTeacherEmail}
                                        onChange={e => setNewTeacherEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Password</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Secure Password"
                                            value={newTeacherPassword}
                                            onChange={e => setNewTeacherPassword(e.target.value)}
                                        />
                                        <button 
                                            onClick={generatePassword}
                                            className="bg-slate-100 dark:bg-slate-700 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                                            title="Generate Password"
                                        >
                                            <i className="fas fa-random"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">Classes Taught</label>
                                <div className="flex flex-wrap gap-2">
                                    {SCHOOL_CLASSES.map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => toggleClass(cls)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedClasses.has(cls) ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">Subjects</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    {NIGERIAN_SUBJECTS.map(sub => (
                                        <label key={sub} className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-2 rounded transition-colors">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedSubjects.has(sub) ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500'}`}>
                                                {selectedSubjects.has(sub) && <i className="fas fa-check text-xs text-white"></i>}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={selectedSubjects.has(sub)}
                                                onChange={() => toggleSubject(sub)}
                                            />
                                            <span className={`text-sm ${selectedSubjects.has(sub) ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{sub}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={handleAddTeacher}
                                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition-colors"
                                >
                                    <i className="fas fa-plus mr-2"></i> Create Teacher Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Teachers List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Staff List ({teachers.length})</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b dark:border-slate-700">
                        <tr>
                            <th className="p-4">Teacher Info</th>
                            <th className="p-4">Classes</th>
                            <th className="p-4">Subjects</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {teachers.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.email}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {t.classes?.map(c => <span key={c} className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{c}</span>) || '-'}
                                    </div>
                                </td>
                                <td className="p-4">
                                     <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2" title={t.subjects.join(', ')}>
                                        {t.subjects.join(', ')}
                                     </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {teachers.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">No teachers added yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
      )}
    </div>
  );
};
