export interface ElectronAPI {
  // Safe Workspace & Project Storage
  initializeSafeWorkspace: () => Promise<{ success: boolean; workspacePath: string }>;
  saveProject: (payload: any) => Promise<{ success: boolean; filePath: string }>;
  loadProject: (filePath: string) => Promise<{ success: boolean; data: any }>;
  exportExcel: (payload: any) => Promise<{ success: boolean; filePath: string }>;
  autoSaveProject: (data: any) => Promise<{ success: boolean; filePath: string }>;
  logMessage: (payload: { level: string; message: string }) => Promise<void>;
  getBackendStatus: () => Promise<{ running: boolean; url: string }>;

  // Native Dialogs
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
  showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;

  // File Operations
  readFileAsBase64: (filePath: string) => Promise<string>;

  // Window Controls
  closeWindow: () => void;
  minimizeWindow: () => void;
  toggleMaximizeWindow: () => void;
  setZoomFactor: (factor: number) => void;

  // OS File Drop Listener
  onFileDrop: (callback: (paths: string[]) => void) => () => void;
  getFilePath?: (file: File) => string;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
