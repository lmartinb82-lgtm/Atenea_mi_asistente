"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "@/components/projects/Sidebar";
import VoiceCore from "@/components/voice/VoiceCore";
import VisionPanel from "@/components/vision/VisionPanel";
import { generatePDF, generateExcel } from "@/lib/reports";
import { Message, Project } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Paperclip, Camera, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
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

  // Load Projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data && data.length > 0) {
          setProjects(data);
          setCurrentProjectId(data[0].id);
          fetchHistory(data[0].id);
        } else {
          // Create a default project if none exist
          handleNewProject("Proyecto Principal");
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      }
    };
    fetchProjects();
  }, []);

  const fetchHistory = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/history`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([{ role: "assistant", content: "Hola, soy ATENEA. ¿En qué puedo ayudarte en este proyecto?" }]);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleNewProject = async (name: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newProject = await res.json();
      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      setMessages([{ role: "assistant", content: `Nuevo proyecto "${name}" creado. Estoy lista.` }]);
    } catch (err) {
      console.error("Error creating project:", err);
    }
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

  const processAudioQueue = async () => {
    if (isAudioPlaying.current || audioQueue.current.length === 0) return;

    isAudioPlaying.current = true;
    const text = audioQueue.current.shift();
    if (!text) {
      isAudioPlaying.current = false;
      return;
    }

    setIsSpeaking(true);
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Voice API error');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        isAudioPlaying.current = false;
        processAudioQueue();
      };
      audio.play();
    } catch (err) {
      console.error("Voice Error:", err);
      setIsSpeaking(false);
      isAudioPlaying.current = false;
      processAudioQueue();
    }
  };

  const speakText = (text: string) => {
    if (!text || text.trim().length === 0) return;
    audioQueue.current.push(text);
    processAudioQueue();
  };

  const handleSendMessage = async (content?: string, image?: string, fileData?: string) => {
    const text = content || inputValue;
    if (!text && !image && !fileData) return;

    stopAudio();

    const newMessage: Message = { role: "user", content: text || "Análisis de archivo adjunto", image };
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
             const data = JSON.parse(line);
             if (data.type === 'status') {
                setIsThinking(true);
             }
             if (data.type === 'text') {
               setIsThinking(false);
               assistantMessage.content += data.text;
               accumulatedText += data.text;
               setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);

               // Speak in chunks of full sentences for lower latency
               if (accumulatedText.length - lastSpokenIndex > 60 && /[.!?]\s$/.test(accumulatedText)) {
                  const chunkToSpeak = accumulatedText.substring(lastSpokenIndex);
                  speakText(chunkToSpeak);
                  lastSpokenIndex = accumulatedText.length;
               }
             }
          }
        }
      }

      if (lastSpokenIndex < accumulatedText.length) {
         speakText(accumulatedText.substring(lastSpokenIndex));
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error técnico. Revisa tu conexión o las claves de API." }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const startVoiceCapture = () => {
     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if (!SpeechRecognition) return;

     if (isListening) {
        recognitionRef.current?.stop();
        return;
     }

     const recognition = new SpeechRecognition();
     recognitionRef.current = recognition;
     recognition.lang = 'es-ES';
     recognition.continuous = false;
     recognition.interimResults = false;

     recognition.onstart = () => {
        setIsListening(true);
        stopAudio(); // Interruption logic
     };

     recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
     };

     recognition.onerror = () => setIsListening(false);
     recognition.onend = () => setIsListening(false);

     recognition.start();
  };

  // Simple voice detection to interrupt
  useEffect(() => {
    if (isSpeaking && !isListening) {
       // Optional: auto-activate mic or just listen for volume
    }
  }, [isSpeaking, isListening]);

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
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectSelect={(id) => { setCurrentProjectId(id); fetchHistory(id); }}
        onNewProject={() => {
           const name = prompt("Nombre del nuevo proyecto:");
           if (name) handleNewProject(name);
        }}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 px-8 flex items-center justify-between border-b border-indigo-atenea-dark/20 bg-[#0b0c1e]/50 backdrop-blur-xl z-20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-purple-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-widest truncate max-w-[200px]">
              {projects.find(p => p.id === currentProjectId)?.name || 'Cargando...'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={() => exportReport('excel')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-2">
                <FileSpreadsheet size={16} />
                <span className="hidden sm:inline">Excel</span>
             </button>
             <button onClick={() => exportReport('pdf')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-2">
                <FileText size={16} />
                <span className="hidden sm:inline">PDF</span>
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row p-4 sm:p-6 gap-6 relative overflow-hidden">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col bg-[#11132d]/40 border border-indigo-atenea-dark/20 rounded-3xl backdrop-blur-sm relative overflow-hidden">
             <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-hide">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                        m.role === 'user'
                          ? 'bg-indigo-atenea text-white shadow-lg'
                          : 'bg-indigo-atenea-dark/30 text-indigo-100 border border-indigo-atenea/20'
                      }`}>
                        {m.image && (
                          <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg">
                            <Image src={m.image} alt="Adjunto" fill className="object-cover" />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start items-center space-x-2 text-indigo-400/60">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest">Atenea procesando...</span>
                    </div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>

             <div className="p-4 bg-[#0b0c1e]/60 border-t border-indigo-atenea-dark/20 backdrop-blur-md">
                <div className="flex items-center space-x-3 max-w-4xl mx-auto">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors">
                      <Paperclip size={20} />
                   </button>
                   <button onClick={() => setIsVisionOpen(true)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors">
                      <Camera size={20} />
                   </button>
                   <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe a ATENEA..."
                    className="flex-1 bg-indigo-500/5 border border-indigo-atenea-dark/30 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-indigo-atenea/50 transition-all placeholder:text-indigo-300/30"
                   />
                   <button
                    disabled={isLoading}
                    onClick={() => handleSendMessage()}
                    className="p-3 bg-indigo-atenea hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all active:scale-95"
                   >
                    <Send size={18} />
                   </button>
                </div>
             </div>
          </div>

          {/* Voice Core Section */}
          <div className="w-full md:w-80 flex flex-col items-center justify-start space-y-8 sm:space-y-12 py-6 sm:py-10">
             <div className="text-center">
                <h2 className="text-xl font-medium text-indigo-100 tracking-tight">Núcleo Visual</h2>
                <p className="text-[10px] text-indigo-400/60 uppercase tracking-[0.3em] mt-1 font-semibold">Status: {isThinking ? 'Procesando' : isSpeaking ? 'Hablando' : isListening ? 'Escuchando' : 'En espera'}</p>
             </div>

             <VoiceCore
                isListening={isListening}
                isSpeaking={isSpeaking}
                isThinking={isThinking}
                onClick={startVoiceCapture}
             />

             <div className="flex flex-col items-center space-y-4 w-full px-8">
                <button
                  onClick={startVoiceCapture}
                  className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                      : 'bg-indigo-atenea-dark/20 border-indigo-atenea/30 text-indigo-300 hover:border-indigo-atenea/60'
                  }`}
                >
                  {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
                  <span className="font-medium tracking-wide">{isListening ? 'Detener Escucha' : 'Iniciar Voz'}</span>
                </button>

                <p className="text-[10px] text-center text-indigo-300/40 uppercase tracking-widest leading-relaxed">
                  Sistema Multimodal ATENEA v2.0<br/>Flash Latency Optimization
                </p>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isVisionOpen && (
          <VisionPanel
            onCapture={(img) => handleSendMessage("Analiza esta captura de visión:", img)}
            onClose={() => setIsVisionOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
