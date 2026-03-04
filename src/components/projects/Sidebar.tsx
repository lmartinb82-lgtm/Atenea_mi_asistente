"use client";

import { motion } from "framer-motion";
import { Plus, FolderClosed, FileText, Database, Settings, MessageSquare, Info, X } from "lucide-react";

interface SidebarProps {
  projects: any[];
  currentProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
  onClose?: () => void;
}

export default function Sidebar({ projects = [], currentProjectId, onProjectSelect, onNewProject, onClose }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-[#0b0c1e] border-r border-indigo-atenea-dark/30 flex flex-col relative">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-atenea to-purple-500">
            ATENEA
          </h1>
          <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-[0.2em] font-semibold opacity-60">
            Neural Portal
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-indigo-400">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-bold text-indigo-300/40 uppercase tracking-widest">Proyectos</h3>
            <button onClick={onNewProject} className="p-1 hover:bg-indigo-500/10 rounded-full text-indigo-400">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <motion.button
                  key={project.id}
                  onClick={() => onProjectSelect(project.id)}
                  whileHover={{ x: 4 }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-3 ${
                    currentProjectId === project.id
                      ? "bg-indigo-500/10 text-indigo-50 border border-indigo-500/20"
                      : "text-indigo-300/50 hover:bg-indigo-500/5"
                  }`}
                >
                  <FolderClosed size={14} className={currentProjectId === project.id ? "text-indigo-400" : "text-indigo-500/30"} />
                  <span className="truncate font-medium">{project.name}</span>
                </motion.button>
              ))
            ) : (
              <div className="px-3 py-2 text-[10px] text-indigo-300/30 italic">Sin proyectos</div>
            )}
          </div>
        </div>

        <div>
           <h3 className="text-[10px] font-bold text-indigo-300/40 uppercase tracking-widest px-2 mb-4">Sistemas</h3>
           <div className="space-y-1">
              <SidebarItem icon={<MessageSquare size={14} />} label="Conversación" active />
              <SidebarItem icon={<Database size={14} />} label="Memoria" />
              <SidebarItem icon={<FileText size={14} />} label="Reportes" />
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-indigo-atenea-dark/20 space-y-1">
        <SidebarItem icon={<Settings size={14} />} label="Configuración" />
        <div className="px-3 py-2 mt-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center space-x-2 text-[9px] text-indigo-300/60 uppercase tracking-tighter">
          <Info size={10} />
          <span>Acceso Público</span>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, color = "text-indigo-300/50" }: any) {
  return (
    <button className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-all ${active ? "bg-indigo-500/10 text-indigo-100 font-medium" : `${color} hover:bg-indigo-500/5`}`}>
      <span className={active ? "text-indigo-400" : ""}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
