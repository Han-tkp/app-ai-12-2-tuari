import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import TopDashboard from '../components/dashboard/TopDashboard';
import Workspace from '../components/workspace/Workspace';
import SettingsWindow from '../components/SettingsWindow';
import StartScreen, { addRecentProject } from '../components/StartScreen';
import { useAppStore } from '../store/useAppStore';
import { ChevronDown, FolderOpen, Save, FilePlus, LogOut, Download, Minus, Square, X, Cloud, CloudOff, AlertCircle, Home } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { AUTO_SAVE_INTERVAL } from '../store/useAppStore';
import { API_BASE } from '../config';
import { initializeSafeWorkspace } from '../utils/fsUtils';

const appWindow = getCurrentWindow();

const AppLayout: React.FC = () => {
  const {
    setSettingsOpen, projectName, setProjectName, triggerSave,
    hotkeyLiveAI, hotkeySnapshot, isCameraRunning, isAIRunning, setAIRunning,
    loadProjectData, shell, importedMediaPath, newProject,
    isDirty, autoSaveEnabled, lastAutoSave, autoSaveError,
    triggerAutoSave, setAutoSaveEnabled, clearAutoSaveError,
    loadFromAutoSave,
  } = useAppStore();

  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);

  // Modal states for file operations
  const [modalType, setModalType] = useState<'new' | 'save-as' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const modalInputRef = useRef<HTMLInputElement>(null);

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

  // ── Initialize Safe Workspace on Mount ─────────────────────────────────────
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const workspacePath = await initializeSafeWorkspace();
        console.log('Safe workspace initialized');
        // Set default export path on first install (when no path is stored)
        const store = useAppStore.getState();
        if (!store.exportPath) {
          store.setExportPath(workspacePath);
        }
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
      }
    };
    initWorkspace();
  }, []);

  // ── Cleanup auto-save on clean exit ────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      useAppStore.getState().clearAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Focus modal input when modal opens
  useEffect(() => {
    if (modalType && modalInputRef.current) {
      setTimeout(() => modalInputRef.current?.focus(), 100);
    }
  }, [modalType]);

  // AI/Snapshot available when camera running OR imported media
  const canUseAI = isCameraRunning || !!importedMediaPath;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.ctrlKey) {
        if (!e.shiftKey && e.key === 'n') { e.preventDefault(); handleNewProject(); return; }
        if (!e.shiftKey && e.key === 'o') { e.preventDefault(); handleOpenProject(); return; }
        if (e.shiftKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); handleSaveAs(); return; }
        if (!e.shiftKey && e.key === 's') { e.preventDefault(); handleSaveProject(); return; }

        if (e.shiftKey && e.key === '1') { e.preventDefault(); useAppStore.getState().setFilterRange(10, 30); return; }
        if (e.shiftKey && e.key === '2') { e.preventDefault(); useAppStore.getState().setFilterRange(15, 25); return; }
        if (e.shiftKey && e.key === '3') { e.preventDefault(); useAppStore.getState().setFilterRange(5, 35); return; }
        if (e.shiftKey && e.key === 'R') { e.preventDefault(); useAppStore.getState().setFilterRange(10, 30); return; }
      }

      const keyCombo = (e.ctrlKey ? 'Ctrl+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.code === 'Space' ? 'Space' : e.key);

      if (keyCombo === hotkeyLiveAI) {
        e.preventDefault();
        if (canUseAI) setAIRunning(!isAIRunning);
      } else if (keyCombo === hotkeySnapshot) {
        e.preventDefault();
        if (canUseAI) {
          window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'take_snapshot' } }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeyLiveAI, hotkeySnapshot, canUseAI, isAIRunning, setAIRunning]);

  const handleNewProject = () => {
    setFileMenuOpen(false);
    setModalInput('Untitled Project');
    setModalType('new');
  };

  const confirmNewProject = async () => {
    if (modalInput.trim()) {
      await newProject(modalInput.trim());
      setShowStartScreen(false);
    }
    setModalType(null);
  };

  const handleOpenProject = async () => {
    setFileMenuOpen(false);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'DropDetect Project', extensions: ['drop'] }]
      });

      if (selected && typeof selected === 'string') {
        const response = await fetch(`${API_BASE}/api/load-project?path=${encodeURIComponent(selected)}`);
        if (response.ok) {
          const data = await response.json();
          loadProjectData(data);
          addRecentProject({
            name: data.project_name || 'Unknown',
            path: selected,
            lastOpened: Date.now(),
            slideCount: data.slides?.length,
          });
          setShowStartScreen(false);
        } else {
          console.error('Failed to load project file');
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

  const handleSaveAs = () => {
    setFileMenuOpen(false);
    setModalInput(projectName);
    setModalType('save-as');
  };

  const confirmSaveAs = async () => {
    const newName = modalInput.trim();
    if (newName && newName !== projectName) {
      setProjectName(newName);
    }
    setModalType(null);
    if (newName) {
      await triggerSave();
    }
  };

  const handleExit = () => {
    const { isDirty } = useAppStore.getState();
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      appWindow.close();
    }
  };

  const confirmExit = async (save: boolean) => {
    if (save) {
      await triggerSave();
    }
    setShowExitDialog(false);
    appWindow.close();
  };

  const formatAutoSaveTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (modalType === 'new') confirmNewProject();
      else if (modalType === 'save-as') confirmSaveAs();
    } else if (e.key === 'Escape') {
      setModalType(null);
    }
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
                  useAppStore.getState().confirmAutoSaveRecovery();
                  setShowRecoverDialog(false);
                  setShowStartScreen(false);
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

      {/* ── Exit Confirmation Dialog ─────────────────────────────────────────── */}
      {showExitDialog && (
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
                <AlertCircle size={18} style={{ color: 'var(--mac-orange)' }} />
                <span className="text-[14px] font-semibold">Unsaved Changes</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
                You have unsaved changes in <strong>{projectName}</strong>. Do you want to save before closing?
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ background: 'var(--bg-surface2)' }}>
              <button
                onClick={() => setShowExitDialog(false)}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--bg-surface3)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmExit(false)}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'rgba(255,79,106,0.12)', color: 'var(--mac-red)' }}
              >
                Don't Save
              </button>
              <button
                onClick={() => confirmExit(true)}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Modal (New Project / Save As) ─────────────────────────────── */}
      {modalType && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[400px] rounded-lg border mac-dialog-shadow overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[14px] font-semibold">
                {modalType === 'new' ? 'New Project' : 'Save As'}
              </span>
            </div>
            <div className="px-5 py-4">
              <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--text2)' }}>
                Project Name
              </label>
              <input
                ref={modalInputRef}
                type="text"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyDown={handleModalKeyDown}
                className="w-full rounded-md px-3 py-2 text-[13px] outline-none transition-colors border"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text1)',
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'}
              />
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ background: 'var(--bg-surface2)' }}>
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--bg-surface3)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                onClick={modalType === 'new' ? confirmNewProject : confirmSaveAs}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {modalType === 'new' ? 'Create' : 'Save'}
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
                    <MenuItem icon={<Home size={14}/>} label="Start Screen" onClick={() => { setFileMenuOpen(false); setShowStartScreen(true); }} />
                    <div className="h-px bg-[var(--separator)] my-1.5 mx-2"></div>
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
            <svg width="12" height="12" viewBox="0 0 512 512" fill="none">
              <circle cx="248" cy="252" r="136" stroke="white" strokeWidth="28" opacity="0.9"/>
              <circle cx="280" cy="270" r="32" fill="white" opacity="0.8"/>
              <circle cx="196" cy="210" r="24" fill="white" opacity="0.7"/>
              <circle cx="200" cy="310" r="16" fill="white" opacity="0.6"/>
              <circle cx="310" cy="200" r="14" fill="white" opacity="0.55"/>
              <line x1="348" y1="358" x2="420" y2="430" stroke="white" strokeWidth="28" strokeLinecap="round" opacity="0.7"/>
            </svg>
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

      {showStartScreen ? (
        <div className="flex-1 min-h-0">
          <StartScreen
            onEnterWorkspace={() => setShowStartScreen(false)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
      ) : (
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
      )}
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
