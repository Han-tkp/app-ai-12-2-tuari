import { contextBridge, ipcRenderer, webUtils, webFrame } from 'electron'

const electronAPI = {
  // Safe Workspace & Project Storage
  initializeSafeWorkspace: () => ipcRenderer.invoke('initialize-safe-workspace'),
  saveProject: (payload: any) => ipcRenderer.invoke('save-project', payload),
  loadProject: (filePath: string) => ipcRenderer.invoke('load-project', filePath),
  exportExcel: (payload: any) => ipcRenderer.invoke('export-excel', payload),
  autoSaveProject: (data: any) => ipcRenderer.invoke('auto-save-project', data),
  logMessage: (payload: { level: string; message: string }) => ipcRenderer.invoke('log-message', payload),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),

  // Native Dialogs
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke('read-file-as-base64', filePath),

  // Window Controls
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),

  // OS File Drop Listener
  onFileDrop: (callback: (paths: string[]) => void) => {
    const listener = (_event: any, paths: string[]) => callback(paths)
    ipcRenderer.on('file-drop', listener)
    return () => ipcRenderer.removeListener('file-drop', listener)
  },
  
  // Workspace project scanner
  scanWorkspaceProjects: () => ipcRenderer.invoke('scan-workspace-projects'),

  // File Path utility
  getFilePath: (file: File) => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return (file as any).path || file.name
    }
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)
