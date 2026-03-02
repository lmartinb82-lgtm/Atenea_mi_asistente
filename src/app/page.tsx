"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/projects/Sidebar";
import VoiceCore from "@/components/voice/VoiceCore";
import VisionPanel from "@/components/vision/VisionPanel";
import { generatePDF, generateExcel } from "@/lib/reports";
import { Message, Project } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Paperclip, Camera, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [projects] = useState<Project[]>([{ id: "1", name: "Campaña 2026" }, { id: "2", name: "Análisis Técnico" }]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>("1");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola, soy ATENEA. Estoy lista para asistirte en tus proyectos. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const audioQueue = useRef<string[]>([]);
  const isAudioPlaying = useRef(false);

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

  const speakText = async (text: string) => {
    if (!text || text.trim().length === 0) return;
    audioQueue.current.push(text);
    processAudioQueue();
  };

  const handleSendMessage = async (content?: string, image?: string, fileData?: string) => {
    const text = content || inputValue;
    if (!text && !image && !fileData) return;

    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }

    const newMessage: Message = { role: "user", content: text || "Análisis de archivo adjunto", image };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

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
             if (data.type === 'text') {
               assistantMessage.content += data.text;
               accumulatedText += data.text;
               setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);

               // Speak in chunks of full sentences for lower latency
               if (accumulatedText.length - lastSpokenIndex > 100 && /[.!?]\s$/.test(accumulatedText)) {
                  const chunkToSpeak = accumulatedText.substring(lastSpokenIndex);
                  speakText(chunkToSpeak);
                  lastSpokenIndex = accumulatedText.length;
               }
             }
          }
        }
      }

      // Speak final chunk if any
      if (lastSpokenIndex < accumulatedText.length) {
         await speakText(accumulatedText.substring(lastSpokenIndex));
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Error procesando solicitud." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        handleSendMessage("Analiza esta imagen:", result);
      } else {
        handleSendMessage(`Analiza el archivo: ${file.name}`, undefined, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startVoiceCapture = () => {
     const SpeechRecognition = (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;
     if (!SpeechRecognition) return;
     const recognition = new SpeechRecognition();
     recognition.lang = 'es-ES';
     recognition.onstart = () => setIsListening(true);
     recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => handleSendMessage(event.results[0][0].transcript);
     recognition.onend = () => setIsListening(false);
     recognition.start();
  };

  const exportReport = (type: 'pdf' | 'excel') => {
    const lastMessage = messages.filter(m => m.role === 'assistant').pop()?.content || "";
    if (type === 'pdf') generatePDF('Reporte Atenea', lastMessage);
    else generateExcel([{ contenido: lastMessage, fecha: new Date().toLocaleString() }]);
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0b0c1e] text-indigo-50">
      <Sidebar projects={projects} currentProjectId={currentProjectId} onProjectSelect={setCurrentProjectId} onNewProject={() => {}} />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 px-8 flex items-center justify-between border-b border-indigo-atenea-dark/20 bg-[#0b0c1e]/50 backdrop-blur-xl z-20">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-widest truncate max-w-[150px]">
              {projects.find(p => p.id === currentProjectId)?.name || 'Sin Proyecto'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={() => exportReport('excel')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-2"><FileSpreadsheet size={16} /><span>Excel</span></button>
             <button onClick={() => exportReport('pdf')} className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 text-xs flex items-center space-x-2"><FileText size={16} /><span>PDF</span></button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 relative overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#11132d]/40 border border-indigo-atenea-dark/20 rounded-3xl backdrop-blur-sm relative overflow-hidden">
             <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-atenea text-white shadow-lg' : 'bg-indigo-atenea-dark/30 text-indigo-100 border border-indigo-atenea/20'}`}>
                        {m.image && <div className="relative w-full h-48 mb-3"><Image src={m.image} alt="Imagen adjunta" fill className="object-cover rounded-lg" /></div>}
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && <div className="flex justify-start"><Loader2 size={16} className="animate-spin text-indigo-400" /></div>}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>
             <div className="p-4 bg-[#0b0c1e]/60 border-t border-indigo-atenea-dark/20 backdrop-blur-md">
                <div className="flex items-center space-x-3 max-w-4xl mx-auto">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full"><Paperclip size={20} /></button>
                   <button onClick={() => setIsVisionOpen(true)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full"><Camera size={20} /></button>
                   <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe un mensaje..." className="flex-1 bg-indigo-500/5 border border-indigo-atenea-dark/30 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-indigo-atenea/50" />
                   <button disabled={isLoading} onClick={() => handleSendMessage()} className="p-3 bg-indigo-atenea hover:bg-indigo-500 text-white rounded-xl shadow-lg"><Send size={18} /></button>
                </div>
             </div>
          </div>
          <div className="w-full md:w-80 flex flex-col items-center justify-start space-y-12 py-10">
             <h2 className="text-xl font-medium text-indigo-200">Núcleo Central</h2>
             <VoiceCore isListening={isListening} isSpeaking={isSpeaking} onClick={startVoiceCapture} />
             <button onClick={startVoiceCapture} className={`flex items-center space-x-3 px-6 py-3 rounded-full border ${isListening ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-indigo-atenea-dark/20 border-indigo-atenea/30 text-indigo-300'}`}>
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                <span>{isListening ? 'Detener' : 'Hablar'}</span>
             </button>
          </div>
        </div>
      </div>
      <AnimatePresence>{isVisionOpen && <VisionPanel onCapture={(img) => handleSendMessage("Analiza esta captura:", img)} onClose={() => setIsVisionOpen(false)} />}</AnimatePresence>
    </main>
  );
}
