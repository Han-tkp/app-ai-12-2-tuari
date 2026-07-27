import React, { useState, useEffect, useRef } from 'react';
import { Camera, ImagePlus, FolderOpen, Clock, Droplet, Settings, ChevronRight, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { API_BASE } from '../config';
import { useTranslation } from '../i18n';

// ── Recent Projects stored in localStorage ──────────────────────────────────
const LS_RECENT = 'dd-recent-projects';

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: number; // timestamp
  vmd?: number;
  slideCount?: number;
}

export function getRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(LS_RECENT);
    if (!raw) return [];
    return JSON.parse(raw) as RecentProject[];
  } catch { return []; }
}

export function addRecentProject(project: RecentProject) {
  const list = getRecentProjects().filter(p => p.path !== project.path);
  list.unshift({ ...project, lastOpened: Date.now() });
  // Keep max 10
  localStorage.setItem(LS_RECENT, JSON.stringify(list.slice(0, 10)));
}

export function removeRecentProject(path: string) {
  const list = getRecentProjects().filter(p => p.path !== path);
  localStorage.setItem(LS_RECENT, JSON.stringify(list));
}

// ── New Project Dialog ──────────────────────────────────────────────────────
interface NewProjectDialogProps {
  type: 'camera' | 'media';
  onConfirm: (name: string, lens: '4x' | '10x') => void;
  onCancel: () => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ type, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(t('project_name'));
  const [lens, setLens] = useState<'4x' | '10x'>('10x');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) onConfirm(name.trim(), lens);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[440px] rounded-xl border overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {type === 'camera' ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Camera size={20} className="text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500">
                <ImagePlus size={20} className="text-white" />
              </div>
            )}
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text1)' }}>
                {type === 'camera' ? t('new_live_project') : t('new_import_project')}
              </h3>
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                {type === 'camera' ? t('new_live_desc') : t('new_import_desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: 'var(--text2)' }}>{t('project_name')}</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none border transition-colors"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-strong)', color: 'var(--text1)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: 'var(--text2)' }}>{t('objective_lens')}</label>
            <div className="flex gap-2">
              {(['4x', '10x'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLens(l)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all"
                  style={{
                    background: lens === l ? 'var(--accent)' : 'var(--bg-surface2)',
                    color: lens === l ? '#fff' : 'var(--text2)',
                    borderColor: lens === l ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-window)' }}>
          <button onClick={onCancel} className="px-5 py-2 rounded-lg text-[12px] font-medium transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text2)' }}>
            {t('cancel')}
          </button>
          <button onClick={() => name.trim() && onConfirm(name.trim(), lens)} className="px-5 py-2 rounded-lg text-[12px] font-medium transition-colors" style={{ background: 'var(--accent)', color: '#fff' }}>
            {t('create_project')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Start Screen Component ──────────────────────────────────────────────────
interface StartScreenProps {
  onEnterWorkspace: () => void;
  onOpenSettings: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onEnterWorkspace, onOpenSettings }) => {
  const { newProject, loadProjectData, setObjectiveLens, setImportedMediaPath } = useAppStore();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [dialogType, setDialogType] = useState<'camera' | 'media' | null>(null);
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, []);

  const handleCreateProject = async (name: string, lens: '4x' | '10x', type: 'camera' | 'media') => {
    setDialogType(null);
    await newProject(name);
    setObjectiveLens(lens);

    if (type === 'media') {
      try {
        const result = await window.electron.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'Images & Videos', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'mp4', 'avi', 'mov'] }
          ]
        });
        if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
          setImportedMediaPath(result.filePaths[0]);
        }
      } catch (err) {
        console.error('Media import error:', err);
      }
    }

    onEnterWorkspace();
  };

  const handleOpenProject = async () => {
    try {
      const result = await window.electron.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'DropDetect Project', extensions: ['drop'] }]
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const selected = result.filePaths[0];
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
          setRecentProjects(getRecentProjects());
          onEnterWorkspace();
        } else {
          setErrorMsg('Failed to load project file. Check that the backend is running.');
        }
      }
    } catch (err) {
      console.error('Open project error:', err);
      setErrorMsg('Cannot connect to backend. Please make sure the AI backend is running.');
    }
  };

  const handleOpenRecent = async (project: RecentProject) => {
    try {
      const response = await fetch(`${API_BASE}/api/load-project?path=${encodeURIComponent(project.path)}`);
      if (response.ok) {
        const data = await response.json();
        loadProjectData(data);
        addRecentProject({ ...project, lastOpened: Date.now() });
        onEnterWorkspace();
      } else {
        // File might be deleted — remove from recent
        removeRecentProject(project.path);
        setRecentProjects(getRecentProjects());
      }
    } catch (err) {
      console.error('Open recent error:', err);
      setErrorMsg('Cannot connect to backend. Please start the Python backend first.');
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecentProject(path);
    setRecentProjects(getRecentProjects());
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex h-full w-full" style={{ background: 'var(--bg-window)' }}>
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <div
        className="w-[220px] flex flex-col shrink-0 border-r"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            <Droplet size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{ color: 'var(--text1)' }}>DropDetect</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>AI Analysis Suite</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: 'var(--text4)' }}>
            Navigation
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-1"
            style={{ background: 'var(--bg-active)', color: 'var(--accent-text)' }}
          >
            <FileText size={16} />
            Home
          </button>
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text2)' }}
          >
            <Settings size={16} />
            {t('settings')}
          </button>
        </nav>

        {/* Version */}
        <div className="px-5 py-4 text-[10px]" style={{ color: 'var(--text4)' }}>
          v2.0.6
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold" style={{ color: 'var(--text1)' }}>
            Welcome to DropDetect AI
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text3)' }}>
            Professional spray droplet analysis per WHO standards
          </p>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {errorMsg && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--mac-red)' }} />
            <div className="flex-1">
              <p className="text-[13px] font-medium" style={{ color: 'var(--mac-red)' }}>{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-[11px] px-2 py-1 rounded-md shrink-0"
              style={{ background: 'var(--bg-surface2)', color: 'var(--text3)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text4)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {/* New Camera Project */}
            <button
              onClick={() => setDialogType('camera')}
              className="group flex flex-col items-start p-5 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors group-hover:scale-105"
                style={{ background: 'var(--accent)' }}
              >
                <Camera size={22} className="text-white" />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text1)' }}>
                Live Camera Project
              </span>
              <span className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                Real-time microscope analysis
              </span>
            </button>

            {/* Import Media */}
            <button
              onClick={() => setDialogType('media')}
              className="group flex flex-col items-start p-5 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-emerald-500 transition-colors group-hover:scale-105">
                <ImagePlus size={22} className="text-white" />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text1)' }}>
                Import Media
              </span>
              <span className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                Analyze images or video files
              </span>
            </button>

            {/* Open Existing */}
            <button
              onClick={handleOpenProject}
              className="group flex flex-col items-start p-5 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-amber-500 transition-colors group-hover:scale-105">
                <FolderOpen size={22} className="text-white" />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text1)' }}>
                Open Project
              </span>
              <span className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                Resume a saved .drop file
              </span>
            </button>
          </div>
        </div>

        {/* ── Recent Projects ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text4)' }}>
            Recent Projects
          </h2>

          {recentProjects.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--text4)' }}
            >
              <Clock size={32} className="mb-3 opacity-50" />
              <p className="text-[13px] font-medium">No recent projects</p>
              <p className="text-[11px] mt-1">Create a new project to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentProjects.map((project) => (
                <div
                  key={project.path}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenRecent(project)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOpenRecent(project); }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:shadow-md group cursor-pointer"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--bg-surface2)' }}
                  >
                    <FileText size={18} style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text1)' }}>
                      {project.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text4)' }}>
                      {project.path}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {project.slideCount != null && project.slideCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface2)', color: 'var(--text3)' }}>
                        {project.slideCount} slides
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--text4)' }}>
                      {formatDate(project.lastOpened)}
                    </span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, project.path)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-all"
                      title="Remove from recent"
                    >
                      <Trash2 size={14} style={{ color: 'var(--text4)' }} />
                    </button>
                    <ChevronRight size={14} style={{ color: 'var(--text4)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── New Project Dialog ────────────────────────────────────────────── */}
      {dialogType && (
        <NewProjectDialog
          type={dialogType}
          onConfirm={(name, lens) => handleCreateProject(name, lens, dialogType)}
          onCancel={() => setDialogType(null)}
        />
      )}
    </div>
  );
};

export default StartScreen;
