import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import TopDashboard from '../components/dashboard/TopDashboard';
import Workspace from '../components/workspace/Workspace';
import SettingsWindow from '../components/SettingsWindow';
import { useAppStore } from '../store/useAppStore';
import { ChevronDown, FileCode, FolderOpen, Save, FilePlus, LogOut, Download, Minus, Square, X, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { AUTO_SAVE_INTERVAL } from '../store/useAppStore';
import { API_BASE } from '../config';

const appWindow = getCurrentWindow();

const AppLayout: React.FC = () => {
  const {
    setSettingsOpen, projectName, setProjectName, resetSession, triggerSave,
    hotkeyLiveAI, hotkeySnapshot, isCameraRunning, isAIRunning, setAIRunning,
    loadProjectData, shell,
    isDirty, autoSaveEnabled, lastAutoSave, autoSaveError,
    triggerAutoSave, setAutoSaveEnabled, clearAutoSaveError, setIsDirty, clearAutoSave,
    loadFromAutoSave, confirmAutoSaveRecovery,
  } = useAppStore();
  
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);

  // ── Auto-Save Interval ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      if (useAppStore.getState().isDirty) {
        triggerAutoSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, triggerAutoSave]);

  // ── Check for Auto-Save Recovery on Mount ──────────────────────────────────
  useEffect(() => {
    const checkRecovery = async () => {
      const hasAutoSave = await loadFromAutoSave();
      if (hasAutoSave) {
        setShowRecoverDialog(true);
      }
    };
    checkRecovery();
  }, []);

  // ── Cleanup auto-save on clean exit ────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear auto-save on clean exit
      useAppStore.getState().clearAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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
      clearAutoSave();
      setIsDirty(false);
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
        const response = await fetch(`${API_BASE}/api/load-project?path=${encodeURIComponent(selected)}`);
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

  // Format last auto-save time
  const formatAutoSaveTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col font-sans select-none relative bg-[var(--bg-window)] text-[var(--text1)]">
      <SettingsWindow />

      {/* ── Recovery Dialog ─────────────────────────────────────────────────── */}
      {showRecoverDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[420px] rounded-lg border mac-dialog-shadow overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={18} style={{ color: 'var(--mac-green)' }} />
                <span className="text-[14px] font-semibold">Recover Unsaved Work?</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
                We found an auto-saved session from <strong>{formatAutoSaveTime(lastAutoSave)}</strong>. 
                Would you like to recover it?
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ background: 'var(--bg-surface2)' }}>
              <button
                onClick={() => {
                  useAppStore.getState().clearAutoSave();
                  setShowRecoverDialog(false);
                }}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--bg-surface3)', color: 'var(--text2)' }}
              >
                Start Fresh
              </button>
              <button
                onClick={() => {
                  confirmAutoSaveRecovery();
                  setShowRecoverDialog(false);
                }}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Recover Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-Save Status Bar ───────────────────────────────────────────── */}
      <div
        className="h-6 flex items-center justify-between px-3 text-[10px] shrink-0"
        style={{
          background: autoSaveError ? 'rgba(239,68,68,0.1)' : 'var(--bg-titlebar)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          {autoSaveError ? (
            <>
              <AlertCircle size={11} style={{ color: 'var(--mac-red)' }} />
              <span style={{ color: 'var(--mac-red)' }}>Auto-save failed</span>
              <button
                onClick={clearAutoSaveError}
                className="underline"
                style={{ color: 'var(--text3)' }}
              >
                Dismiss
              </button>
            </>
          ) : (
            <>
              {isDirty ? (
                <>
                  <CloudOff size={11} style={{ color: 'var(--text4)' }} />
                  <span style={{ color: 'var(--text3)' }}>Unsaved changes</span>
                </>
              ) : (
                <>
                  <Cloud size={11} style={{ color: 'var(--mac-green)' }} />
                  <span style={{ color: 'var(--text3)' }}>
                    Saved {formatAutoSaveTime(lastAutoSave)}
                  </span>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer" style={{ color: 'var(--text3)' }}>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span className="text-[10px]">Auto-save</span>
          </label>
        </div>
      </div>

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
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-sidebar)] border border-[var(--border-strong)] rounded-[5px] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
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

        {/* Center Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <div
            className="w-[18px] h-[18px] flex items-center justify-center rounded"
            style={{ background: 'var(--accent)' }}
          >
            <FileCode size={11} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text1)' }}>
            DropDetect
          </span>
          <span className="text-[12px]" style={{ color: 'var(--text4)' }}>—</span>
          <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{projectName}</span>
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
