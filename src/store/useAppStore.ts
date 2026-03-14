import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE } from '../config';
import { getSafeWorkspaceDir } from '../utils/fsUtils';

// ── Persistence Keys ─────────────────────────────────────────────────────────
const LS_KEYS = {
  THEME: 'dd-theme',
  SHELL: 'dd-shell',
  PROJECT: 'dd-current-project',
  AUTO_SAVE: 'dd-autosave-data',
};

// ── Restore persisted preferences ────────────────────────────────────────────
const _storedTheme = (localStorage.getItem(LS_KEYS.THEME) as 'dark' | 'light' | 'warm') || 'dark';
const _storedShell = (localStorage.getItem(LS_KEYS.SHELL) as 'macos' | 'windows') || 'macos';
document.documentElement.classList.add(_storedTheme, `shell-${_storedShell}`);

// ── Auto-Save Constants ──────────────────────────────────────────────────────
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const MAX_AUTOSAVE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface Annotation {
  id: string;
  type: 'circle' | 'rect' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  diameter_um: number;
}

export interface Slide {
  id: string;
  name: string;
  droplets: number[]; // true diameters in µm
  status: 'Pending' | 'Completed';
  timestamp: string;
}

interface ProjectData {
  project_name?: string;
  target_size?: number;
  slides?: Slide[];
}

interface AppState {
  // Project Info
  projectName: string;
  mode: 'Analyze' | 'Report';
  theme: 'light' | 'dark' | 'warm';
  shell: 'macos' | 'windows';
  isSettingsOpen: boolean;
  settingsPosition: { x: number; y: number };
  currentSettingsTab: 'AI & Capture' | 'Hardware & Camera' | 'Manual Edit' | 'Appearance & Output';

  // Auto-Save & Persistence
  isDirty: boolean;           // Flag: has unsaved changes
  lastAutoSave: number;       // Timestamp of last auto-save
  autoSaveEnabled: boolean;   // Toggle auto-save feature
  autoSaveError: string | null; // Last auto-save error message

  // Device State
  isCameraRunning: boolean;
  cameraIndex: number;
  isAIRunning: boolean;
  objectiveLens: '4x' | '10x';
  hardwareProfile: 'low' | 'mid' | 'high';
  profileOverride: 'auto' | 'low' | 'mid' | 'high';
  ramGb: number;
  cpuCores: number;
  inferenceSkip: number;
  
  // Real-time Stats
  vmd: number;
  accumulated: number;
  span: number;
  outOfBounds: number;
  ramUsage: string;
  currentSessionDroplets: { id: number; diameter: number; source: string }[];

  // Manual Edit
  annotations: Annotation[];
  activeTool: 'select' | 'circle' | 'rect' | 'line';
  isManualEditActive: boolean;
  isManualEditPoppedOut: boolean;
  manualEditPosition: { x: number; y: number };

  // Session Table (Unified AI + Manual)
  isSessionTablePoppedOut: boolean;
  sessionTablePosition: { x: number; y: number };
  
  // Report & Slides
  slides: Slide[];
  activeSlideId: string | null;
  targetSize: number;
  filterMin: number;
  filterMax: number;
  exportPath: string;
  excelLanguage: 'th' | 'en';  // Excel export language

  // Hotkeys
  hotkeyLiveAI: string;
  hotkeySnapshot: string;

  // Settings
  aiConfidence: number;
  lineThickness: number;
  fillOpacity: number;
  annotationColor: string;

  // Actions
  setProjectName: (name: string) => void;
  setMode: (mode: 'Analyze' | 'Report') => void;
  setTheme: (theme: 'light' | 'dark' | 'warm') => void;
  setShell: (shell: 'macos' | 'windows') => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsPosition: (pos: { x: number; y: number }) => void;
  setSettingsTab: (tab: AppState['currentSettingsTab']) => void;

  // Auto-Save Actions
  setIsDirty: (dirty: boolean) => void;
  triggerAutoSave: () => Promise<void>;
  setAutoSaveEnabled: (enabled: boolean) => void;
  clearAutoSaveError: () => void;
  loadFromAutoSave: () => Promise<boolean>;
  confirmAutoSaveRecovery: () => void;
  clearAutoSave: () => void;
  
  // Camera/AI Actions
  toggleCamera: () => void;
  switchCamera: () => void;
  setAIRunning: (running: boolean) => void;
  setObjectiveLens: (lens: '4x' | '10x') => void;
  setAIConfidence: (conf: number) => void;
  setHardwareInfo: (info: { profile: 'low' | 'mid' | 'high'; ram_gb: number; cpu_cores: number; inference_skip: number }) => void;
  setProfileOverride: (profile: 'auto' | 'low' | 'mid' | 'high') => void;
  setHotkeyLiveAI: (key: string) => void;
  setHotkeySnapshot: (key: string) => void;
  updateInferenceStats: (vmd: number, span: number, count: number, outOfBounds?: number) => void;
  updateStats: (vmd: number, span: number, count: number, outOfBounds: number, ram: string, droplets: { id: number; diameter: number; source: string }[]) => void;

  // Manual Edit Actions
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  syncManualAnnotations: () => Promise<void>;
  setManualEditActive: (active: boolean) => void;
  setManualEditPoppedOut: (popped: boolean) => void;
  setManualEditPosition: (pos: { x: number; y: number }) => void;
  setActiveTool: (tool: AppState['activeTool']) => void;
  setSessionTablePoppedOut: (popped: boolean) => void;
  setSessionTablePosition: (pos: { x: number; y: number }) => void;

  // Slide Management
  addSlide: () => void;
  removeSlide: (id: string) => void;
  setActiveSlideId: (id: string | null) => void;
  updateSlideData: (slideId: string, diameters: number[]) => void;
  retakeSlide: (id: string) => void;
  setTargetSize: (size: number) => void;
  setFilterRange: (min: number, max: number) => void;
  setExportPath: (path: string) => void;
  setExcelLanguage: (lang: 'th' | 'en') => void;
  fetchSessionAndAddToSlide: () => Promise<void>;
  resetSession: () => Promise<void>;
  triggerSave: () => Promise<void>;
  loadProjectData: (data: ProjectData) => void;

  removeSessionDroplet: (id: number) => void;

  // UI Actions
  updateAnnotationSettings: (updates: Partial<Pick<AppState, 'lineThickness' | 'fillOpacity' | 'annotationColor'>>) => void;
}

const initialSlides: Slide[] = [
  { id: uuidv4(), name: 'Slide 1', droplets: [], status: 'Pending', timestamp: '' },
  { id: uuidv4(), name: 'Slide 2', droplets: [], status: 'Pending', timestamp: '' },
  { id: uuidv4(), name: 'Slide 3', droplets: [], status: 'Pending', timestamp: '' },
];

// Safe initial positions — work for any window size ≥ 1000px wide
const INITIAL_SETTINGS_POS = { x: 260, y: 80 };
const INITIAL_MANUAL_EDIT_POS = { x: 900, y: 400 };
const INITIAL_SESSION_TABLE_POS = { x: 700, y: 300 };

export const useAppStore = create<AppState>((set, get) => ({
  projectName: 'Untitled Project',
  mode: 'Analyze',
  theme: _storedTheme,
  shell: _storedShell,
  isSettingsOpen: false,
  settingsPosition: INITIAL_SETTINGS_POS,
  currentSettingsTab: 'AI & Capture',

  // Auto-Save state
  isDirty: false,
  lastAutoSave: 0,
  autoSaveEnabled: true,
  autoSaveError: null,

  isCameraRunning: false,
  cameraIndex: 0,
  isAIRunning: false,
  objectiveLens: '10x',
  hardwareProfile: 'high',
  profileOverride: 'auto',
  ramGb: 0,
  cpuCores: 0,
  inferenceSkip: 1,

  vmd: 0.00,
  accumulated: 0,
  span: 0.00,
  outOfBounds: 0,
  ramUsage: '0%',
  currentSessionDroplets: [],

  annotations: [],
  activeTool: 'select',
  isManualEditActive: false,
  isManualEditPoppedOut: false,
  manualEditPosition: INITIAL_MANUAL_EDIT_POS,

  isSessionTablePoppedOut: false,
  sessionTablePosition: INITIAL_SESSION_TABLE_POS,

  slides: initialSlides,
  activeSlideId: initialSlides[0].id,
  targetSize: 224,
  filterMin: 10.0,
  filterMax: 30.0,
  exportPath: '',
  excelLanguage: 'th',  // Default to Thai

  hotkeyLiveAI: 'F5',
  hotkeySnapshot: 'Space',

  aiConfidence: 0.25,
  lineThickness: 2,
  fillOpacity: 0.2,
  annotationColor: '#00FF00',

  setProjectName: (projectName) => { set({ projectName, isDirty: true }); },
  setMode: (mode) => set({ mode }),
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.remove('dark', 'light', 'warm');
    document.documentElement.classList.add(theme);
    localStorage.setItem(LS_KEYS.THEME, theme);
  },
  setShell: (shell) => {
    set({ shell });
    document.documentElement.classList.remove('shell-macos', 'shell-windows');
    document.documentElement.classList.add(`shell-${shell}`);
    localStorage.setItem(LS_KEYS.SHELL, shell);
  },
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setSettingsPosition: (settingsPosition) => set({ settingsPosition }),
  setSettingsTab: (currentSettingsTab) => set({ currentSettingsTab }),

  // Auto-Save actions
  setIsDirty: (isDirty) => set({ isDirty }),
  setAutoSaveEnabled: (autoSaveEnabled) => set({ autoSaveEnabled }),
  clearAutoSaveError: () => set({ autoSaveError: null }),
  
  triggerAutoSave: async () => {
    const { projectName, targetSize, slides, exportPath } = get();
    
    // Skip if no changes
    if (!get().isDirty && get().lastAutoSave > 0) {
      return;
    }

    try {
      const savePath = exportPath || await getSafeWorkspaceDir();
      const autosaveDir = `${savePath}/.autosave`;
      
      // Create autosave directory payload
      const autosaveData = {
        project_name: projectName,
        target_size: targetSize,
        slides: slides.map((s: Slide) => ({ id: s.id, name: s.name, droplets: s.droplets })),
        timestamp: Date.now(),
      };

      // Save to localStorage as backup (for crash recovery)
      try {
        localStorage.setItem(LS_KEYS.AUTO_SAVE, JSON.stringify(autosaveData));
      } catch (lsError) {
        // localStorage full (quota exceeded)
        console.warn('[Auto-Save] localStorage full, using disk only:', lsError);
        // Continue with disk save anyway
      }

      // Also save to disk via backend (silent, no alert)
      const payload = {
        project_name: `${projectName}_autosave_${Date.now()}`,
        target_size: targetSize,
        save_directory: autosaveDir,
        slides: autosaveData.slides,
      };

      const response = await fetch(`${API_BASE}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        set({ lastAutoSave: Date.now(), autoSaveError: null });
        console.log('[Auto-Save] Success:', new Date().toISOString());
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || 'Unknown error';
        
        // Check for disk full error
        if (errorMsg.includes('disk') || errorMsg.includes('space') || errorMsg.includes('No space left')) {
          set({ autoSaveError: 'Auto-save failed: Disk is full' });
        } else {
          set({ autoSaveError: 'Auto-save failed: ' + errorMsg });
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[Auto-Save] Error:', error);
      // Don't set error state if it's a network error (backend might be offline)
      if ((error as Error).message !== 'Failed to fetch') {
        set({ autoSaveError: 'Auto-save failed: ' + (error as Error).message });
      }
      // Don't alert user during auto-save, just log
    }
  },

  loadFromAutoSave: async () => {
    try {
      const saved = localStorage.getItem(LS_KEYS.AUTO_SAVE);
      if (!saved) return false;

      const data = JSON.parse(saved);

      // Check if autosave is too old (7 days)
      const age = Date.now() - (data.timestamp || 0);
      if (age > MAX_AUTOSAVE_AGE) {
        localStorage.removeItem(LS_KEYS.AUTO_SAVE);
        return false;
      }

      // Only return true to indicate recoverable data exists
      // Don't load into state yet — wait for user confirmation
      return true;
    } catch (error) {
      console.error('[Auto-Save Load] Error:', error);
      return false;
    }
  },

  confirmAutoSaveRecovery: () => {
    try {
      const saved = localStorage.getItem(LS_KEYS.AUTO_SAVE);
      if (!saved) return;
      const data = JSON.parse(saved);
      set({
        projectName: data.project_name?.replace(/_autosave_\d+/, '') || 'Recovered Project',
        targetSize: data.target_size || 224,
        slides: data.slides || initialSlides,
        activeSlideId: data.slides?.[0]?.id || null,
        mode: 'Report',
        lastAutoSave: Date.now(),
      });
    } catch (error) {
      console.error('[Auto-Save Recovery] Error:', error);
    }
  },

  clearAutoSave: () => {
    localStorage.removeItem(LS_KEYS.AUTO_SAVE);
    set({ lastAutoSave: 0, autoSaveError: null });
  },

  toggleCamera: () => set((state) => ({ isCameraRunning: !state.isCameraRunning, isAIRunning: false, isDirty: true })),
  switchCamera: () => set((state) => ({ cameraIndex: (state.cameraIndex + 1) % 6 })),
  setAIRunning: (isAIRunning) => set({ isAIRunning, isDirty: true }),
  setObjectiveLens: (lens) => set({ objectiveLens: lens, isDirty: true }),
  setAIConfidence: (aiConfidence) => set({ aiConfidence, isDirty: true }),
  setHardwareInfo: (info) => set({
    hardwareProfile: info.profile,
    ramGb: info.ram_gb,
    cpuCores: info.cpu_cores,
    inferenceSkip: info.inference_skip,
  }),
  setProfileOverride: (profile) => {
    set({ profileOverride: profile });
    window.dispatchEvent(new CustomEvent('send-backend-command', {
      detail: { action: 'set_profile', profile }
    }));
  },
  setHotkeyLiveAI: (hotkeyLiveAI) => set({ hotkeyLiveAI }),
  setHotkeySnapshot: (hotkeySnapshot) => set({ hotkeySnapshot }),
  updateInferenceStats: (vmd, span, count, outOfBounds) => set({
    vmd, span, accumulated: count, outOfBounds: outOfBounds ?? 0
  }),
  updateStats: (vmd, span, count, outOfBounds, ramUsage, droplets) => set({
    vmd, span, accumulated: count, outOfBounds, ramUsage, currentSessionDroplets: droplets
  }),

  addAnnotation: (ann) => {
    set((state) => ({ annotations: [...state.annotations, ann], isDirty: true }));
    get().syncManualAnnotations();
  },
  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map(a => a.id === id ? { ...a, ...updates } : a),
      isDirty: true
    }));
    get().syncManualAnnotations();
  },
  deleteAnnotation: (id) => {
    set((state) => ({ annotations: state.annotations.filter(a => a.id !== id), isDirty: true }));
    get().syncManualAnnotations();
  },
  clearAnnotations: () => {
    set({ annotations: [], isDirty: true });
    get().syncManualAnnotations();
  },
  syncManualAnnotations: async () => {
    const { annotations } = get();
    const manualData = annotations.filter(a => a.type !== 'line').map(a => a.diameter_um);
    try {
      await fetch(`${API_BASE}/api/update-manual-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: manualData })
      });
    } catch (err) {
      console.error('Manual annotation sync failed:', err);
    }
  },
  setManualEditActive: (isManualEditActive) => set({ isManualEditActive }),
  setManualEditPoppedOut: (isManualEditPoppedOut) => set({ isManualEditPoppedOut }),
  setManualEditPosition: (manualEditPosition) => set({ manualEditPosition }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSessionTablePoppedOut: (isSessionTablePoppedOut) => set({ isSessionTablePoppedOut }),
  setSessionTablePosition: (sessionTablePosition) => set({ sessionTablePosition }),

  addSlide: () => set((state) => {
    const newSlide: Slide = { id: uuidv4(), name: `Slide ${state.slides.length + 1}`, droplets: [], status: 'Pending', timestamp: '' };
    return { slides: [...state.slides, newSlide], activeSlideId: newSlide.id, isDirty: true };
  }),
  removeSlide: (id) => set((state) => ({
    slides: state.slides.filter(s => s.id !== id),
    activeSlideId: state.activeSlideId === id ? null : state.activeSlideId,
    isDirty: true
  })),
  setActiveSlideId: (activeSlideId) => set({ activeSlideId }),
  updateSlideData: (id, droplets) => set((state) => ({
    slides: state.slides.map(s => s.id === id ? { ...s, droplets: [...s.droplets, ...droplets], status: 'Completed', timestamp: new Date().toLocaleString() } : s),
    isDirty: true
  })),
  retakeSlide: (id) => set((state) => ({
    slides: state.slides.map(s => s.id === id ? { ...s, droplets: [], status: 'Pending' } : s),
    activeSlideId: id,
    mode: 'Analyze',
    isDirty: true
  })),
  setTargetSize: (targetSize) => set({ targetSize, isDirty: true }),
  setFilterRange: (filterMin, filterMax) => set({ filterMin, filterMax, isDirty: true }),
  setExportPath: (exportPath) => set({ exportPath }),
  setExcelLanguage: (excelLanguage) => set({ excelLanguage }),
  fetchSessionAndAddToSlide: async () => {
    const { activeSlideId, filterMin, filterMax, targetSize } = get();
    if (!activeSlideId) {
      alert("Please select a slide first.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/session-data`);
      const { data } = await response.json();
      const rawData: number[] = data ?? [];

      const filtered = rawData.filter(d => d >= filterMin && d <= filterMax);
      filtered.sort((a, b) => a - b);

      let sampled = filtered;
      if (filtered.length > targetSize) {
        const step = filtered.length / targetSize;
        sampled = Array.from({ length: targetSize }, (_, i) => filtered[Math.floor(i * step)]);
      }

      if (sampled.length === 0 && rawData.length > 0) {
        alert(`No droplets were added. All ${rawData.length} droplets were outside the filter range (${filterMin}–${filterMax} µm).`);
        return;
      }

      set((state) => ({
        slides: state.slides.map(s => s.id === activeSlideId
          ? { ...s, droplets: [...s.droplets, ...sampled], status: 'Completed', timestamp: new Date().toLocaleString() }
          : s),
        annotations: [],
        vmd: 0,
        span: 0,
        accumulated: 0,
        outOfBounds: 0
      }));

      await fetch(`${API_BASE}/api/reset-stats`, { method: 'POST' });
      alert(`Successfully added ${sampled.length} droplets to slide.`);
    } catch (err) {
      console.error('Fetch session error:', err);
      alert('Error connecting to backend.');
    }
  },
  loadProjectData: (data: ProjectData) => set({
    projectName: data.project_name ?? 'Untitled',
    targetSize: data.target_size ?? 224,
    slides: data.slides ?? initialSlides,
    activeSlideId: data.slides?.[0]?.id ?? null,
    mode: 'Report'
  }),

  resetSession: async () => {
    set({ vmd: 0, span: 0, accumulated: 0, outOfBounds: 0, currentSessionDroplets: [], annotations: [] });
    try {
      await fetch(`${API_BASE}/api/reset-stats`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to reset backend stats:', err);
    }
  },

  triggerSave: async () => {
    const { projectName, targetSize, slides, exportPath, excelLanguage } = get();
    try {
      // Fall back to safe Documents/DropDetect_Projects folder if no path set
      const savePath = exportPath || await getSafeWorkspaceDir();

      const payload = {
        project_name: projectName,
        target_size: targetSize,
        save_directory: savePath,
        slides: slides.map((s: Slide) => ({ id: s.id, name: s.name, droplets: s.droplets })),
        language: excelLanguage,  // Add language setting
      };

      const response = await fetch(`${API_BASE}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        // Clear dirty flag and auto-save on successful manual save
        get().clearAutoSave();
        set({ isDirty: false });
        
        // Cleanup old autosave files (silent, non-blocking)
        fetch(`${API_BASE}/api/cleanup-autosave?project_name=${encodeURIComponent(projectName)}`, {
          method: 'POST'
        }).catch(() => {}); // Ignore cleanup errors
        
        alert(`Project saved to: ${result.drop_file}\nExcel Report: ${result.excel_file}`);
      } else {
        alert('Failed to save project.');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Error connecting to backend for save.');
    }
  },

  removeSessionDroplet: (id) => {
    if (id < 0) {
      // Manual: map backend ID -(1000+i) → annotation index i
      const annIdx = Math.abs(id) - 1000;
      const manualAnns = get().annotations.filter(a => a.type !== 'line');
      const ann = manualAnns[annIdx];
      if (ann) get().deleteAnnotation(ann.id);
    } else {
      // AI: remove locally and tell backend
      window.dispatchEvent(new CustomEvent('send-backend-command', {
        detail: { action: 'remove_droplet', id }
      }));
      set(state => ({
        currentSessionDroplets: state.currentSessionDroplets.filter(d => d.id !== id)
      }));
    }
  },

  updateAnnotationSettings: (updates) => set((state) => ({ ...state, ...updates })),
}));
