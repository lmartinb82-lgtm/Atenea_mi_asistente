"use client";

import { motion } from "framer-motion";
import { Plus, FolderClosed, FileText, Database, Settings, LogOut, MessageSquare } from "lucide-react";

interface SidebarProps {
  projects: any[];
  currentProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
}

export default function Sidebar({ projects, currentProjectId, onProjectSelect, onNewProject }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-[#0b0c1e] border-r border-indigo-atenea-dark/30 flex flex-col">
      {/* Brand Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-atenea to-neon-violet">
          ATENEA
        </h1>
        <p className="text-xs text-indigo-400 mt-1 uppercase tracking-widest font-semibold opacity-60">
          Neural Intelligence
        </p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-indigo-300/60 uppercase tracking-wider px-2">Proyectos</h3>
            <button
              onClick={onNewProject}
              className="p-1 hover:bg-indigo-500/10 rounded-full transition-colors text-indigo-400"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <motion.button
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                whileHover={{ x: 4 }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-3 ${
                  currentProjectId === project.id
                    ? "bg-indigo-atenea-dark/40 text-indigo-50 border border-indigo-atenea/30"
                    : "text-indigo-300/70 hover:bg-indigo-500/5 hover:text-indigo-200"
                }`}
              >
                <FolderClosed size={16} />
                <span className="truncate">{project.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-indigo-300/60 uppercase tracking-wider px-2 mb-4">Sistemas</h3>
          <div className="space-y-1">
             <SidebarItem icon={<MessageSquare size={16} />} label="Conversación" active />
             <SidebarItem icon={<Database size={16} />} label="Memoria" />
             <SidebarItem icon={<FileText size={16} />} label="Reportes" />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-indigo-atenea-dark/20 space-y-1">
        <SidebarItem icon={<Settings size={16} />} label="Configuración" />
        <SidebarItem icon={<LogOut size={16} />} label="Cerrar Sesión" color="text-red-400" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, color = "text-indigo-300/70" }: any) {
  return (
    <button
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all ${
        active ? "bg-indigo-atenea-dark/20 text-indigo-50" : `${color} hover:bg-indigo-500/5`
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
