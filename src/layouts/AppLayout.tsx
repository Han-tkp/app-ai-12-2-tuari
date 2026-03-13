import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import TopDashboard from '../components/dashboard/TopDashboard';
import Workspace from '../components/workspace/Workspace';
import SettingsWindow from '../components/SettingsWindow';
import { useAppStore } from '../store/useAppStore';
import { ChevronDown, FileCode, FolderOpen, Save, FilePlus, LogOut, Download, Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

const appWindow = getCurrentWindow();

const AppLayout: React.FC = () => {
  const {
    setSettingsOpen, projectName, setProjectName, resetSession, triggerSave,
    hotkeyLiveAI, hotkeySnapshot, isCameraRunning, isAIRunning, setAIRunning,
    loadProjectData, shell,
  } = useAppStore();
  // triggerSave is used by Export Excel Data menu item and Ctrl+S shortcut
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // File menu shortcuts
      if (e.ctrlKey) {
        if (!e.shiftKey && e.key === 'n') { e.preventDefault(); handleNewProject(); return; }
        if (!e.shiftKey && e.key === 'o') { e.preventDefault(); handleOpenProject(); return; }
        if (e.shiftKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); handleSaveAs(); return; }
        if (!e.shiftKey && e.key === 's') { e.preventDefault(); handleSaveProject(); return; }
      }

      const keyCombo = (e.ctrlKey ? 'Ctrl+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.code === 'Space' ? 'Space' : e.key);

      if (keyCombo === hotkeyLiveAI) {
        e.preventDefault();
        if (isCameraRunning) setAIRunning(!isAIRunning);
      } else if (keyCombo === hotkeySnapshot) {
        e.preventDefault();
        if (isCameraRunning) {
          window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'take_snapshot' } }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeyLiveAI, hotkeySnapshot, isCameraRunning, isAIRunning, setAIRunning]);

  const handleNewProject = () => {
    const name = prompt("Enter new project name:", "Untitled Project");
    if (name) {
      resetSession();
      setProjectName(name);
    }
    setFileMenuOpen(false);
  };

  const handleOpenProject = async () => {
    setFileMenuOpen(false);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'DropDetect Project', extensions: ['drop'] }]
      });

      if (selected && typeof selected === 'string') {
        // Since .drop is a zip, we'd normally need a zip lib or backend helper.
        // For simplicity, let's add a backend endpoint to "load" if needed, 
        // or just expect project.json if we want to be quick.
        // Let's assume we can fetch the project info from backend for safety.
        const response = await fetch(`http://localhost:8000/api/load-project?path=${encodeURIComponent(selected)}`);
        if (response.ok) {
          const data = await response.json();
          loadProjectData(data);
        } else {
          alert("Failed to load project file.");
        }
      }
    } catch (err) {
      console.error("Open project error:", err);
    }
  };

  const handleSaveProject = async () => {
    setFileMenuOpen(false);
    await triggerSave();
  };

  const handleSaveAs = async () => {
    setFileMenuOpen(false);
    const newName = prompt('Save as (Enter new project name):', projectName);
    if (newName && newName !== projectName) {
      // Zustand set() is synchronous — triggerSave() will read the updated name via get()
      setProjectName(newName);
      await triggerSave();
    }
  };

  const handleExit = () => {
    appWindow.close();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col font-sans select-none relative bg-[var(--bg-window)] text-[var(--text1)]">
      <SettingsWindow />

      {/* Title Bar — layout adapts to shell preference */}
      <div
        data-tauri-drag-region
        className="h-11 flex items-center border-b shrink-0 z-[100] transition-colors cursor-default"
        style={{ backgroundColor: 'var(--bg-titlebar)', backdropFilter: 'var(--blur)', WebkitBackdropFilter: 'var(--blur)', borderColor: 'var(--border)' }}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-2 px-4">
          {/* macOS traffic lights — left side */}
          {shell === 'macos' && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={handleExit}
                className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] border border-black/10 flex items-center justify-center group hover:brightness-110 transition-all shadow-sm"
                title="Close"
              >
                <X size={8} strokeWidth={4} className="text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => appWindow.minimize()}
                className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] border border-black/10 flex items-center justify-center group hover:brightness-110 transition-all shadow-sm"
                title="Minimize"
              >
                <Minus size={8} strokeWidth={4} className="text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => appWindow.toggleMaximize()}
                className="w-3.5 h-3.5 rounded-full bg-[#28C840] border border-black/10 flex items-center justify-center group hover:brightness-110 transition-all shadow-sm"
                title="Maximize"
              >
                <Square size={7} strokeWidth={4} className="text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {/* File menu + Settings */}
          <div className="flex gap-0.5 relative">
            <div className="relative">
              <button
                onClick={() => setFileMenuOpen(!isFileMenuOpen)}
                className={`text-[12px] text-[var(--text2)] hover:bg-[var(--bg-hover)] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${isFileMenuOpen ? 'bg-[var(--bg-hover)] text-[var(--text1)]' : ''}`}
              >
                File <ChevronDown size={10} strokeWidth={3} />
              </button>

              {isFileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFileMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-sidebar)] backdrop-blur-2xl border border-[var(--border)] rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <MenuItem icon={<FilePlus size={14}/>} label="New Project..." shortcut="Ctrl+N" onClick={handleNewProject} />
                    <MenuItem icon={<FolderOpen size={14}/>} label="Open Project..." shortcut="Ctrl+O" onClick={handleOpenProject} />
                    <div className="h-px bg-[var(--separator)] my-1.5 mx-2"></div>
                    <MenuItem icon={<Save size={14}/>} label="Save Project" shortcut="Ctrl+S" onClick={handleSaveProject} />
                    <MenuItem icon={<Save size={14}/>} label="Save As New Project..." shortcut="Ctrl+Shift+S" onClick={handleSaveAs} />
                    <div className="h-px bg-[var(--separator)] my-1.5 mx-2"></div>
                    <MenuItem icon={<Download size={14}/>} label="Export Excel Data..." onClick={() => { setFileMenuOpen(false); triggerSave(); }} />
                    <div className="h-px bg-[var(--separator)] my-1.5 mx-2"></div>
                    <MenuItem icon={<LogOut size={14}/>} label="Exit" color="var(--mac-red)" onClick={handleExit} />
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSettingsOpen(true)} className="text-[12px] text-[var(--text2)] hover:bg-[var(--bg-hover)] px-2.5 py-1 rounded-md transition-colors font-medium">Settings</button>
          </div>
        </div>

        {/* Center Title — absolute so it stays truly centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2 pointer-events-none">
          <div className="w-[18px] h-[18px] bg-[var(--accent)] rounded-[4px] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            <FileCode size={11} color="white" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-[var(--text1)]">
            DropDetect <span className="text-[var(--text3)] font-normal ml-1">— {projectName}*</span>
          </span>
        </div>

        {/* Right cluster — Windows chrome buttons */}
        <div className="ml-auto flex h-full">
          {shell === 'windows' && (
            <>
              <button
                onClick={() => appWindow.minimize()}
                className="w-11 h-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text3)] transition-all"
                title="Minimize"
              >
                <Minus size={11} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => appWindow.toggleMaximize()}
                className="w-11 h-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text3)] transition-all"
                title="Maximize"
              >
                <Square size={10} strokeWidth={1.5} />
              </button>
              <button
                onClick={handleExit}
                className="w-11 h-full flex items-center justify-center hover:bg-[var(--mac-red)] hover:text-white text-[var(--text3)] transition-all"
                title="Close"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[260px] flex flex-col shrink-0 border-r transition-colors" style={{ backgroundColor: 'var(--bg-sidebar)', backdropFilter: 'var(--blur)', WebkitBackdropFilter: 'var(--blur)', borderColor: 'var(--border)' }}>
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-[54px] border-b shrink-0 transition-colors" style={{ backgroundColor: 'var(--bg-titlebar)', backdropFilter: 'var(--blur)', WebkitBackdropFilter: 'var(--blur)', borderColor: 'var(--border)' }}>
            <TopDashboard />
          </header>

          <div className="flex-1 relative overflow-hidden bg-[var(--bg-viewport)] shadow-inner">
            <Workspace />
          </div>
        </main>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; shortcut?: string; color?: string; onClick?: () => void }> = ({ icon, label, shortcut, color, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-all group text-left"
  >
    <div className="flex items-center gap-2.5">
      <span className="text-[var(--text3)] group-hover:text-white" style={{ color }}>{icon}</span>
      <span className="text-[12.5px] font-medium" style={{ color }}>{label}</span>
    </div>
    {shortcut && <span className="text-[10px] text-[var(--text4)] group-hover:text-white/70 font-mono">{shortcut}</span>}
  </button>
);

export default AppLayout;
