import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE } from '../config';
import { getSafeWorkspaceDir, getAutoSaveDir } from '../utils/fsUtils';

// ── Persistence Keys ─────────────────────────────────────────────────────────
const LS_KEYS = {
  THEME: 'dd-theme',
  SHELL: 'dd-shell',
  PROJECT: 'dd-current-project',
  AUTO_SAVE: 'dd-autosave-data',
  AI_CONFIDENCE: 'dd-ai-confidence',
  OBJECTIVE_LENS: 'dd-objective-lens',
  TARGET_SIZE: 'dd-target-size',
  FILTER_MIN: 'dd-filter-min',
  FILTER_MAX: 'dd-filter-max',
  ZOOM_WITH_CTRL: 'dd-zoom-with-ctrl',
  EXCEL_LANGUAGE: 'dd-excel-language',
  EXPORT_PATH: 'dd-export-path',
  ANNOTATION_FADE_DELAY: 'dd-annotation-fade-delay',
};

// ── Restore persisted preferences ────────────────────────────────────────────
const _storedTheme = (localStorage.getItem(LS_KEYS.THEME) as 'dark' | 'light' | 'warm') || 'light';
const _storedShell = (localStorage.getItem(LS_KEYS.SHELL) as 'macos' | 'windows') || 'windows';
const _storedAnnotationFadeDelay = parseInt(localStorage.getItem(LS_KEYS.ANNOTATION_FADE_DELAY) || '1500', 10);
const _storedExportPath = localStorage.getItem(LS_KEYS.EXPORT_PATH) || '';
const _storedAIConfidence = parseFloat(localStorage.getItem(LS_KEYS.AI_CONFIDENCE) || '0.25');
const _storedObjectiveLens = (localStorage.getItem(LS_KEYS.OBJECTIVE_LENS) as '4x' | '10x') || '10x';
const _storedTargetSize = parseInt(localStorage.getItem(LS_KEYS.TARGET_SIZE) || '224', 10);
const _storedFilterMin = parseFloat(localStorage.getItem(LS_KEYS.FILTER_MIN) || '10');
const _storedFilterMax = parseFloat(localStorage.getItem(LS_KEYS.FILTER_MAX) || '30');
const _storedZoomWithCtrl = localStorage.getItem(LS_KEYS.ZOOM_WITH_CTRL) !== 'false';
const _storedExcelLanguage = (localStorage.getItem(LS_KEYS.EXCEL_LANGUAGE) as 'th' | 'en') || 'th';
const _storedVideoControlsMode = (localStorage.getItem('dd-video-controls-mode') as 'full' | 'mini') || 'full';
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
  detectionId?: number; // AI detection tracker ID (e.g., #3)
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
  currentSettingsTab: 'AI & Capture' | 'Hardware & Camera' | 'AI Models' | 'Manual Edit' | 'Appearance & Output';

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
  importedMediaPath: string | null; // Path to imported media (image/video)
  
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

  // Video Playback
  isVideoLoaded: boolean;
  isVideoPlaying: boolean;
  videoSpeed: number;
  videoCurrentFrame: number;
  videoTotalFrames: number;
  videoFps: number;
  videoControlsMode: 'full' | 'mini';
  videoControlsPosition: { x: number; y: number };

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
  snapshotDisplayDuration: number; // seconds to freeze snapshot frame
  snapshotSourceFilter: 'all' | 'ai' | 'manual'; // SessionDropletTable filter
  annotationFadeDelay: number; // milliseconds before annotation fades (default: 1000)
  zoomWithCtrl: boolean; // Require Ctrl key for zoom (default: true)

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
  setImportedMediaPath: (path: string | null) => void;

  // Manual Edit Actions
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  syncManualAnnotations: () => Promise<void>;
  setManualEditActive: (active: boolean) => void;
  setManualEditPoppedOut: (popped: boolean) => void;
  setManualEditPosition: (pos: { x: number; y: number }) => void;
  removeAnnotationVisual: (id: string) => void;
  setActiveTool: (tool: AppState['activeTool']) => void;
  setSessionTablePoppedOut: (popped: boolean) => void;
  setSessionTablePosition: (pos: { x: number; y: number }) => void;

  // Video Actions
  setVideoState: (state: Partial<Pick<AppState, 'isVideoLoaded' | 'isVideoPlaying' | 'videoSpeed' | 'videoCurrentFrame' | 'videoTotalFrames' | 'videoFps'>>) => void;
  setVideoControlsMode: (mode: 'full' | 'mini') => void;
  setVideoControlsPosition: (pos: { x: number; y: number }) => void;

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
  newProject: (name: string) => Promise<void>;
  triggerSave: () => Promise<void>;
  loadProjectData: (data: ProjectData) => void;

  removeSessionDroplet: (id: number) => void;
  removeSessionDroplets: (ids: number[]) => void;

  // UI Actions
  updateAnnotationSettings: (updates: Partial<Pick<AppState, 'lineThickness' | 'fillOpacity' | 'annotationColor'>>) => void;
  setSnapshotDisplayDuration: (duration: number) => void;
  setSnapshotSourceFilter: (filter: 'all' | 'ai' | 'manual') => void;
  setAnnotationFadeDelay: (delay: number) => void;
  setZoomWithCtrl: (enabled: boolean) => void;
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

let _syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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
  objectiveLens: _storedObjectiveLens,
  hardwareProfile: 'high',
  profileOverride: 'auto',
  ramGb: 0,
  cpuCores: 0,
  inferenceSkip: 1,
  importedMediaPath: null,

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

  isVideoLoaded: false,
  isVideoPlaying: false,
  videoSpeed: 1.0,
  videoCurrentFrame: 0,
  videoTotalFrames: 0,
  videoFps: 30,
  videoControlsMode: _storedVideoControlsMode,
  videoControlsPosition: { x: 500, y: 600 },

  slides: initialSlides,
  activeSlideId: initialSlides[0].id,
  targetSize: _storedTargetSize,
  filterMin: _storedFilterMin,
  filterMax: _storedFilterMax,
  exportPath: _storedExportPath,
  excelLanguage: _storedExcelLanguage,

  hotkeyLiveAI: 'F5',
  hotkeySnapshot: 'Space',

  aiConfidence: _storedAIConfidence,
  lineThickness: 2,
  fillOpacity: 0.2,
  annotationColor: '#00FF00',
  snapshotDisplayDuration: 1.5,
  snapshotSourceFilter: 'all',
  annotationFadeDelay: _storedAnnotationFadeDelay,
  zoomWithCtrl: _storedZoomWithCtrl,

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
    const { projectName, targetSize, slides } = get();

    // Skip if no changes
    if (!get().isDirty && get().lastAutoSave > 0) {
      return;
    }

    // Only auto-save if there's meaningful data (slides with droplets)
    const hasData = slides.some((s: Slide) => s.droplets.length > 0);

    try {
      const autosaveData = {
        project_name: projectName,
        target_size: targetSize,
        slides: slides.map((s: Slide) => ({ id: s.id, name: s.name, droplets: s.droplets })),
        timestamp: Date.now(),
      };

      // Always save to localStorage (fast, local)
      try {
        localStorage.setItem(LS_KEYS.AUTO_SAVE, JSON.stringify(autosaveData));
      } catch (lsError) {
        console.warn('[Auto-Save] localStorage full:', lsError);
      }

      // Only call backend if there's actual slide data to persist
      if (hasData) {
        const autosaveDir = await getAutoSaveDir();
        const projectAutoSaveDir = `${autosaveDir}/${projectName}`;

        const payload = {
          project_name: `${projectName}_autosave_${Date.now()}`,
          target_size: targetSize,
          save_directory: projectAutoSaveDir,
          slides: autosaveData.slides,
          isAutoSave: true,
        };

        const response = await fetch(`${API_BASE}/api/save-project`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || 'Unknown error';
          if (errorMsg.includes('disk') || errorMsg.includes('space')) {
            set({ autoSaveError: 'Auto-save failed: Disk is full' });
          }
          throw new Error(errorMsg);
        }
      }

      set({ lastAutoSave: Date.now(), isDirty: false, autoSaveError: null });
    } catch (error) {
      console.error('[Auto-Save] Error:', error);
      if ((error as Error).message !== 'Failed to fetch') {
        set({ autoSaveError: 'Auto-save failed: ' + (error as Error).message });
      }
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

      // Set timestamp so recovery dialog can show when it was saved
      set({ lastAutoSave: data.timestamp || 0 });

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

  toggleCamera: () => set((state) => ({
    isCameraRunning: !state.isCameraRunning,
    isAIRunning: false,
    isDirty: true,
    // Clear imported media & video when starting camera
    importedMediaPath: !state.isCameraRunning ? null : state.importedMediaPath,
    isVideoLoaded: !state.isCameraRunning ? false : state.isVideoLoaded,
    isVideoPlaying: !state.isCameraRunning ? false : state.isVideoPlaying,
  })),
  switchCamera: () => set((state) => ({ cameraIndex: (state.cameraIndex + 1) % 6 })),
  setAIRunning: (isAIRunning) => set({ isAIRunning, isDirty: true }),
  setObjectiveLens: (lens) => {
    set({ objectiveLens: lens, isDirty: true });
    localStorage.setItem(LS_KEYS.OBJECTIVE_LENS, lens);
  },
  setAIConfidence: (aiConfidence) => {
    set({ aiConfidence, isDirty: true });
    localStorage.setItem(LS_KEYS.AI_CONFIDENCE, String(aiConfidence));
  },
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
  setImportedMediaPath: (importedMediaPath) => set({ importedMediaPath }),
  updateInferenceStats: (vmd, span, count, outOfBounds) => set({
    vmd, span, accumulated: count, outOfBounds: outOfBounds ?? 0
  }),
  updateStats: (vmd, span, count, outOfBounds, ramUsage, droplets) => set({
    vmd, span, accumulated: count, outOfBounds, ramUsage, currentSessionDroplets: droplets
  }),

  addAnnotation: (ann) => {
    set((state) => ({ annotations: [...state.annotations, ann], isDirty: true }));
    get().syncManualAnnotations();
    // Auto-fade visual overlay after delay (session data persists)
    const delay = get().annotationFadeDelay;
    if (delay > 0) {
      setTimeout(() => {
        get().removeAnnotationVisual(ann.id);
      }, delay);
    }
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
    const { annotations, currentSessionDroplets } = get();
    const manualAnns = annotations.filter(a => !a.detectionId);

    // Update local session droplets immediately
    const nonManualDroplets = currentSessionDroplets.filter(d => d.source !== 'Manual');
    const manualDroplets = manualAnns.map((a, i) => ({
      id: -(i + 1000),
      diameter: a.diameter_um,
      source: 'Manual' as string,
    }));
    set({ currentSessionDroplets: [...nonManualDroplets, ...manualDroplets] });

    // Debounce the backend sync (150ms)
    if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(async () => {
      try {
        const latestManualAnns = get().annotations.filter(a => !a.detectionId);
        const latestData = latestManualAnns.map(a => a.diameter_um);
        await fetch(`${API_BASE}/api/update-manual-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: latestData })
        });
      } catch (err) {
        console.error('Manual annotation sync failed:', err);
      }
    }, 150);
  },
  removeAnnotationVisual: (id) => {
    set((state) => ({
      annotations: state.annotations.filter(a => a.id !== id),
    }));
    // Does NOT call syncManualAnnotations — session data persists
  },
  setManualEditActive: (isManualEditActive) => set({ isManualEditActive }),
  setManualEditPoppedOut: (isManualEditPoppedOut) => set({ isManualEditPoppedOut }),
  setManualEditPosition: (manualEditPosition) => set({ manualEditPosition }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSessionTablePoppedOut: (isSessionTablePoppedOut) => set({ isSessionTablePoppedOut }),
  setSessionTablePosition: (sessionTablePosition) => set({ sessionTablePosition }),

  setVideoState: (updates) => set(updates),
  setVideoControlsMode: (videoControlsMode) => {
    set({ videoControlsMode });
    localStorage.setItem('dd-video-controls-mode', videoControlsMode);
  },
  setVideoControlsPosition: (videoControlsPosition) => set({ videoControlsPosition }),

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
  setTargetSize: (targetSize) => {
    set({ targetSize, isDirty: true });
    localStorage.setItem(LS_KEYS.TARGET_SIZE, String(targetSize));
  },
  setFilterRange: (filterMin, filterMax) => {
    set({ filterMin, filterMax, isDirty: true });
    localStorage.setItem(LS_KEYS.FILTER_MIN, String(filterMin));
    localStorage.setItem(LS_KEYS.FILTER_MAX, String(filterMax));
  },
  setExportPath: (exportPath) => {
    set({ exportPath });
    localStorage.setItem(LS_KEYS.EXPORT_PATH, exportPath);
  },
  setExcelLanguage: (excelLanguage) => {
    set({ excelLanguage });
    localStorage.setItem(LS_KEYS.EXCEL_LANGUAGE, excelLanguage);
  },
  fetchSessionAndAddToSlide: async () => {
    const { activeSlideId, filterMin, filterMax, targetSize } = get();
    if (!activeSlideId) {
      console.warn('[AddToSlide] No slide selected');
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
        console.warn(`[AddToSlide] All ${rawData.length} droplets outside filter range (${filterMin}–${filterMax} µm)`);
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
      console.log(`[AddToSlide] Added ${sampled.length} droplets to slide`);
    } catch (err) {
      console.error('Fetch session error:', err);
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

  newProject: async (name: string) => {
    const freshSlides: Slide[] = [
      { id: uuidv4(), name: 'Slide 1', droplets: [], status: 'Pending', timestamp: '' },
      { id: uuidv4(), name: 'Slide 2', droplets: [], status: 'Pending', timestamp: '' },
      { id: uuidv4(), name: 'Slide 3', droplets: [], status: 'Pending', timestamp: '' },
    ];
    // Reset ALL state to fresh
    set({
      projectName: name,
      mode: 'Analyze',
      // Detection data
      vmd: 0, span: 0, accumulated: 0, outOfBounds: 0,
      currentSessionDroplets: [],
      annotations: [],
      // Slides
      slides: freshSlides,
      activeSlideId: freshSlides[0].id,
      // Media & Camera & Video
      importedMediaPath: null,
      isAIRunning: false,
      isCameraRunning: false,
      isVideoLoaded: false,
      isVideoPlaying: false,
      videoCurrentFrame: 0,
      videoTotalFrames: 0,
      // Persistence
      isDirty: false,
    });
    // Reset backend: tracker, counted_ids, droplet_data
    try {
      await fetch(`${API_BASE}/api/reset-stats`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to reset backend stats:', err);
    }
    // Close any open video on backend
    window.dispatchEvent(new CustomEvent('send-backend-command', {
      detail: { action: 'close_video' }
    }));
    // Clear auto-save
    get().clearAutoSave();
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
        }).catch(() => {});

        console.log(`[Save] Project saved: ${result.drop_file}`);
      } else {
        console.error('[Save] Failed to save project');
      }
    } catch (error) {
      console.error('[Save] Error:', error);
    }
  },

  removeSessionDroplet: (id) => {
    if (id < 0) {
      // Manual: map backend ID -(1000+i) → annotation index i
      const annIdx = Math.abs(id) - 1000;
      const manualAnns = get().annotations.filter(a => !a.detectionId);
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

  removeSessionDroplets: (ids) => {
    const manualIds = ids.filter(id => id < 0);
    const aiIds = ids.filter(id => id >= 0);

    // Collect manual annotation UUIDs FIRST (before any state mutation shifts indices)
    const manualAnns = get().annotations.filter(a => !a.detectionId);
    const annUUIDsToDelete = manualIds
      .map(id => {
        const annIdx = Math.abs(id) - 1000;
        return manualAnns[annIdx]?.id;
      })
      .filter(Boolean) as string[];

    // Remove manual annotations in a single state update (no N×syncManualAnnotations)
    if (annUUIDsToDelete.length > 0) {
      const uuidSet = new Set(annUUIDsToDelete);
      set(state => ({
        annotations: state.annotations.filter(a => !uuidSet.has(a.id)),
        isDirty: true,
      }));
    }

    // Remove AI droplets — send each to backend
    aiIds.forEach(id => {
      window.dispatchEvent(new CustomEvent('send-backend-command', {
        detail: { action: 'remove_droplet', id }
      }));
    });

    // Remove all from local session droplets
    const idSet = new Set(ids);
    set(state => ({
      currentSessionDroplets: state.currentSessionDroplets.filter(d => !idSet.has(d.id))
    }));

    // Sync manual data to backend once (not per-annotation)
    get().syncManualAnnotations();
  },

  updateAnnotationSettings: (updates) => set((state) => ({ ...state, ...updates })),
  setSnapshotDisplayDuration: (snapshotDisplayDuration) => set({ snapshotDisplayDuration }),
  setSnapshotSourceFilter: (snapshotSourceFilter) => set({ snapshotSourceFilter }),
  setAnnotationFadeDelay: (annotationFadeDelay) => {
    set({ annotationFadeDelay });
    localStorage.setItem(LS_KEYS.ANNOTATION_FADE_DELAY, String(annotationFadeDelay));
  },
  setZoomWithCtrl: (zoomWithCtrl) => {
    set({ zoomWithCtrl });
    localStorage.setItem(LS_KEYS.ZOOM_WITH_CTRL, String(zoomWithCtrl));
  },
}));
