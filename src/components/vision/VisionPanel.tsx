"use client";

import { useState, useRef } from "react";
import { Camera, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VisionPanelProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

export default function VisionPanel({ onCapture, onClose }: VisionPanelProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const image = canvasRef.current.toDataURL("image/png");
        onCapture(image);
        stopCamera();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-[#11132d] border border-indigo-atenea/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]"
      >
        <div className="p-4 border-b border-indigo-atenea/20 flex items-center justify-between">
          <h3 className="font-medium text-indigo-100 flex items-center space-x-2">
            <Camera size={18} />
            <span>Captura de Visión Computacional</span>
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-indigo-400 hover:text-white">
             <X size={20} />
          </button>
        </div>

        <div className="aspect-video bg-black relative flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`}
          />
          {!stream && (
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-indigo-atenea text-white rounded-full font-medium hover:bg-indigo-500 transition-all flex items-center space-x-2"
            >
              <Camera size={20} />
              <span>Activar Cámara</span>
            </button>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 flex justify-center">
           {stream && (
             <button
               onClick={captureImage}
               className="w-16 h-16 bg-white rounded-full border-4 border-indigo-atenea shadow-[0_0_20px_white/30] flex items-center justify-center text-indigo-900 transition-transform active:scale-90"
             >
               <div className="w-10 h-10 rounded-full border-2 border-indigo-atenea" />
             </button>
           )}
        </div>

        <div className="p-4 bg-indigo-atenea-dark/10 text-[10px] text-indigo-300/60 text-center uppercase tracking-widest leading-relaxed">
          Análisis de Visión Nativa powered by Gemini 2.0 Flash
        </div>
      </motion.div>
    </div>
  );
}
