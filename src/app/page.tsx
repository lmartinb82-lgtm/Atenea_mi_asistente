"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "@/components/projects/Sidebar";
import VoiceCore from "@/components/voice/VoiceCore";
import VisionPanel from "@/components/vision/VisionPanel";
import { generatePDF, generateExcel } from "@/lib/reports";
import { Message, Project } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Paperclip, Camera, Loader2, FileSpreadsheet, FileText, AlertTriangle, Menu, X as CloseIcon } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola, soy ATENEA. Estoy lista para asistirte en tus proyectos de forma multimodal. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioQueue = useRef<string[]>([]);
  const isAudioPlaying = useRef(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setProjects(data);
          setCurrentProjectId(data[0].id);
          fetchHistory(data[0].id);
        } else {
          handleNewProject("Proyecto Principal");
        }
      } catch (err: any) {
        setAppError(`Error de base de datos: ${err.message}.`);
      }
    };
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async (projectId: string) => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/history`);
      const data = await res.json();
      if (data && data.length > 0) setMessages(data);
    } catch (err) { console.error(err); }
  };

  const handleNewProject = async (name: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newProject = await res.json();
      if (newProject?.id) {
        setProjects(prev => [newProject, ...prev]);
        setCurrentProjectId(newProject.id);
        setMessages([{ role: "assistant", content: `Nuevo proyecto "${name}" creado.` }]);
      }
    } catch (err: any) { setAppError(err.message); }
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioQueue.current = [];
    isAudioPlaying.current = false;
    setIsSpeaking(false);
  }, []);

  const processAudioQueue = useCallback(async () => {
    if (isAudioPlaying.current || audioQueue.current.length === 0) return;
    isAudioPlaying.current = true;
    const text = audioQueue.current.shift();
    if (!text) { isAudioPlaying.current = false; return; }
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        isAudioPlaying.current = false;
        processAudioQueue();
      };
      audio.play();
    } catch (err) {
      console.error("Audio error:", err);
      isAudioPlaying.current = false;
      setIsSpeaking(false);
      processAudioQueue();
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return;
    audioQueue.current.push(text);
    if (!isAudioPlaying.current) processAudioQueue();
  }, [processAudioQueue]);

  const handleSendMessage = async (content?: string, image?: string, fileData?: string) => {
    const text = content || inputValue;
    if (!text && !image && !fileData) return;
    if (!currentProjectId) return;

    stopAudio();
    const newMessage: Message = { role: "user", content: text || "Archivo adjunto", image };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage], projectId: currentProjectId, image, fileData }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      let accumulatedText = "";
      let lastSpokenIndex = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
             try {
                const data = JSON.parse(line);
                if (data.type === 'status') setIsThinking(true);
                if (data.type === 'report') {
                    if (data.format === 'pdf') generatePDF('Reporte Atenea', data.data);
                    else generateExcel([{ data: data.data }], 'atenea_auto_report.xlsx');
                }
                if (data.type === 'text') {
                  setIsThinking(false);
                  assistantMessage.content += data.text;
                  accumulatedText += data.text;
                  setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);

                  if (accumulatedText.length - lastSpokenIndex > 60 && /[.!?]\s$/.test(accumulatedText)) {
                      speakText(accumulatedText.substring(lastSpokenIndex));
                      lastSpokenIndex = accumulatedText.length;
                  }
                }
             } catch (e) {
                // Ignore parsing errors for non-json chunks
             }
          }
        }
      }
      if (lastSpokenIndex < accumulatedText.length) speakText(accumulatedText.substring(lastSpokenIndex));
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const startVoiceCapture = () => {
     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if (!SpeechRecognition) return;
     if (isListening) { recognitionRef.current?.stop(); return; }
     const recognition = new SpeechRecognition();
     recognitionRef.current = recognition;
     recognition.lang = 'es-ES';
     recognition.onstart = () => { setIsListening(true); stopAudio(); };
     recognition.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
     recognition.onend = () => setIsListening(false);
     recognition.start();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        handleSendMessage(`Analiza esta imagen: ${file.name}`, result);
      } else {
        handleSendMessage(`Analiza el archivo: ${file.name}`, undefined, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportReport = (type: 'pdf' | 'excel') => {
    const lastMessage = messages.filter(m => m.role === 'assistant').pop()?.content || "";
    if (type === 'pdf') generatePDF('Reporte Atenea', lastMessage);
    else generateExcel([{ contenido: lastMessage, fecha: new Date().toLocaleString() }]);
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0b0c1e] text-indigo-50">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar
            projects={projects}
            currentProjectId={currentProjectId}
            onProjectSelect={(id) => { setCurrentProjectId(id); fetchHistory(id); setIsSidebarOpen(false); }}
            onNewProject={() => {
              const name = prompt("Nombre:");
              if (name) handleNewProject(name);
            }}
            onClose={() => setIsSidebarOpen(false)}
         />
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {appError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
             <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-xl p-4 rounded-2xl flex items-start space-x-3 text-red-200">
                <AlertTriangle className="shrink-0" size={20} />
                <div className="text-xs">
                   <p className="font-bold mb-1">Status Base de Datos</p>
                   <p className="opacity-90">{appError}</p>
                   <button onClick={() => setAppError(null)} className="mt-2 text-[10px] underline font-bold uppercase">Cerrar</button>
                </div>
             </div>
          </div>
        )}

        <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-indigo-atenea-dark/20 bg-[#0b0c1e]/50 backdrop-blur-xl z-20">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-indigo-400 md:hidden"><Menu size={20} /></button>
            <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-purple-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-widest truncate max-w-[150px] sm:max-w-[300px]">
              {projects.find(p => p.id === currentProjectId)?.name || 'Cargando...'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
             <button onClick={() => exportReport('excel')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-1 sm:space-x-2">
                <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
             </button>
             <button onClick={() => exportReport('pdf')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-1 sm:space-x-2">
                <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 relative overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#11132d]/40 border border-indigo-atenea-dark/20 rounded-3xl backdrop-blur-sm relative overflow-hidden">
             <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-hide">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-atenea text-white shadow-lg' : 'bg-indigo-atenea-dark/30 text-indigo-100 border border-indigo-atenea/20'}`}>
                        {m.image && <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg"><Image src={m.image} alt="Adjunto" fill className="object-cover" /></div>}
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && <div className="flex justify-start items-center space-x-2 text-indigo-400/60"><Loader2 size={16} className="animate-spin" /><span className="text-[10px] uppercase tracking-widest">Atenea...</span></div>}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>

             <div className="p-4 bg-[#0b0c1e]/60 border-t border-indigo-atenea-dark/20 backdrop-blur-md">
                <div className="flex items-center space-x-3 max-w-4xl mx-auto">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors"><Paperclip size={20} /></button>
                   <button onClick={() => setIsVisionOpen(true)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors"><Camera size={20} /></button>
                   <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe a ATENEA..." className="flex-1 bg-indigo-500/5 border border-indigo-atenea-dark/30 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-indigo-atenea/50 transition-all" />
                   <button onClick={() => handleSendMessage()} className="p-3 bg-indigo-atenea hover:bg-indigo-600 text-white rounded-xl shadow-lg transition-all active:scale-95"><Send size={18} /></button>
                </div>
             </div>
          </div>

          <div className="w-full lg:w-80 flex flex-col items-center justify-start space-y-8 lg:py-10">
             <div className="text-center">
                <h2 className="text-xl font-medium text-indigo-100">Núcleo Visual</h2>
                <p className="text-[10px] text-indigo-400/60 uppercase tracking-[0.3em] mt-1">Status: {isThinking ? 'Procesando' : isSpeaking ? 'Hablando' : isListening ? 'Escuchando' : 'Espera'}</p>
             </div>

             <div className="scale-90 sm:scale-100">
               <VoiceCore isListening={isListening} isSpeaking={isSpeaking} isThinking={isThinking} onClick={startVoiceCapture} />
             </div>

             <div className="flex flex-col items-center space-y-4 w-full px-8">
                <button onClick={startVoiceCapture} className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl border transition-all ${isListening ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-indigo-atenea-dark/20 border-indigo-atenea/30 text-indigo-300'}`}>
                  {isListening ? <CloseIcon size={20} /> : <Mic size={20} />}
                  <span className="font-medium">{isListening ? 'Detener' : 'Iniciar Voz'}</span>
                </button>
                <p className="text-[10px] text-center text-indigo-300/40 uppercase tracking-widest leading-relaxed">ATENEA v2.5 Public Edition</p>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>{isVisionOpen && <VisionPanel onCapture={(img) => handleSendMessage("Captura de visión:", img)} onClose={() => setIsVisionOpen(false)} />}</AnimatePresence>
    </main>
  );
}
