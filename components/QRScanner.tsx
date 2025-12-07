
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError("Unable to access camera. Please ensure you have granted permission.");
        console.error(err);
      }
    };

    const tick = () => {
      if (!scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
             setScanning(false);
             onScan(code.data);
             return; // Stop loop
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      setScanning(false);
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md text-center relative shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Scan Exam QR Code</h2>
        
        {error ? (
          <div className="text-red-500 mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <i className="fas fa-exclamation-circle mr-2"></i> {error}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-black aspect-square mb-4">
             <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
             <canvas ref={canvasRef} className="hidden" />
             
             {/* Scanning Overlay */}
             <div className="absolute inset-0 border-2 border-blue-500/50 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/80 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>
                </div>
             </div>
          </div>
        )}

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Point your camera at the QR code on the exam paper header or summary sheet.
        </p>

        <button 
          onClick={onCancel}
          className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
