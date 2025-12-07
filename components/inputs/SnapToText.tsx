import React, { useState } from 'react';
import { ocrFromImage } from '../../services/geminiService';
import { ExamSection } from '../../types';

interface SnapToTextProps {
  onSuccess: (sections: ExamSection[]) => void;
  onCancel: () => void;
}

export const SnapToText: React.FC<SnapToTextProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      // Extract data and mime type
      // Format: data:image/jpeg;base64,/9j/4AAQSk...
      const mimeType = preview.split(';')[0].split(':')[1];
      const base64 = preview.split(',')[1];
      
      const sections = await ocrFromImage(base64, mimeType);
      onSuccess(sections);
    } catch (err) {
      setError("Failed to process image. Please try again or ensure the image is clear.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-slate-800"><i className="fas fa-camera mr-2 text-blue-500"></i> Snap to Text</h2>
      
      {!preview ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors">
          <i className="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-4"></i>
          <p className="text-slate-600 mb-4">Upload a clear photo of your handwritten questions</p>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
            "
          />
        </div>
      ) : (
        <div className="space-y-4">
          <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg border border-slate-200" />
          <div className="flex gap-3">
             <button 
                onClick={() => setPreview(null)}
                className="flex-1 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
             >
                Retake
             </button>
             <button 
                onClick={processImage}
                disabled={loading}
                className="flex-1 py-2 text-white bg-primary rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
             >
                {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-magic mr-2"></i>}
                {loading ? "Analyzing with Gemini 3..." : "Convert to Text"}
             </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}

      <button onClick={onCancel} className="mt-6 text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
    </div>
  );
};