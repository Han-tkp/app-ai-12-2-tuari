import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE } from '../config';
import { getSafeWorkspaceDir } from '../utils/fsUtils';

// Restore persisted preferences and apply classes before first render
const _storedTheme = (localStorage.getItem('dd-theme') as 'dark' | 'light' | 'warm') || 'dark';
const _storedShell = (localStorage.getItem('dd-shell') as 'macos' | 'windows') || 'macos';
document.documentElement.classList.add(_storedTheme, `shell-${_storedShell}`);

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

  hotkeyLiveAI: 'F5',
  hotkeySnapshot: 'Space',

  aiConfidence: 0.25,
  lineThickness: 2,
  fillOpacity: 0.2,
  annotationColor: '#00FF00',

  setProjectName: (projectName) => set({ projectName }),
  setMode: (mode) => set({ mode }),
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.remove('dark', 'light', 'warm');
    document.documentElement.classList.add(theme);
    localStorage.setItem('dd-theme', theme);
  },
  setShell: (shell) => {
    set({ shell });
    document.documentElement.classList.remove('shell-macos', 'shell-windows');
    document.documentElement.classList.add(`shell-${shell}`);
    localStorage.setItem('dd-shell', shell);
  },
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setSettingsPosition: (settingsPosition) => set({ settingsPosition }),
  setSettingsTab: (currentSettingsTab) => set({ currentSettingsTab }),

  toggleCamera: () => set((state) => ({ isCameraRunning: !state.isCameraRunning, isAIRunning: false })),
  switchCamera: () => set((state) => ({ cameraIndex: (state.cameraIndex + 1) % 6 })),
  setAIRunning: (isAIRunning) => set({ isAIRunning }),
  setObjectiveLens: (lens) => set({ objectiveLens: lens }),
  setAIConfidence: (aiConfidence) => set({ aiConfidence }),
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
    set((state) => ({ annotations: [...state.annotations, ann] }));
    get().syncManualAnnotations();
  },
  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
    get().syncManualAnnotations();
  },
  deleteAnnotation: (id) => {
    set((state) => ({ annotations: state.annotations.filter(a => a.id !== id) }));
    get().syncManualAnnotations();
  },
  clearAnnotations: () => {
    set({ annotations: [] });
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
    return { slides: [...state.slides, newSlide], activeSlideId: newSlide.id };
  }),
  removeSlide: (id) => set((state) => ({ 
    slides: state.slides.filter(s => s.id !== id),
    activeSlideId: state.activeSlideId === id ? null : state.activeSlideId
  })),
  setActiveSlideId: (activeSlideId) => set({ activeSlideId }),
  updateSlideData: (id, droplets) => set((state) => ({
    slides: state.slides.map(s => s.id === id ? { ...s, droplets: [...s.droplets, ...droplets], status: 'Completed', timestamp: new Date().toLocaleString() } : s)
  })),
  retakeSlide: (id) => set((state) => ({
    slides: state.slides.map(s => s.id === id ? { ...s, droplets: [], status: 'Pending' } : s),
    activeSlideId: id,
    mode: 'Analyze'
  })),
  setTargetSize: (targetSize) => set({ targetSize }),
  setFilterRange: (filterMin, filterMax) => set({ filterMin, filterMax }),
  setExportPath: (exportPath) => set({ exportPath }),
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
    const { projectName, targetSize, slides, exportPath } = get();
    try {
      // Fall back to safe Documents/DropDetect_Projects folder if no path set
      const savePath = exportPath || await getSafeWorkspaceDir();

      const payload = {
        project_name: projectName,
        target_size: targetSize,
        save_directory: savePath,
        slides: slides.map((s: Slide) => ({ id: s.id, name: s.name, droplets: s.droplets }))
      };

      const response = await fetch(`${API_BASE}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
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
