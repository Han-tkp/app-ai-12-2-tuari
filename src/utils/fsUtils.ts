/**
 * Initialize Safe Workspace Architecture
 * Creates the following folder structure in Documents:
 * 
 * Documents/
 * └── DropDetect_Workspace/
 *     ├── Projects/            <-- Manual .drop saves only
 *     ├── AutoSave/            <-- Auto-save files ONLY
 *     │   └── {project_name}/
 *     │       └── autosave_{timestamp}.drop
 *     ├── Exports/
 *     │   ├── Excel/           <-- Full project exports
 *     │   │   └── {project}_Report.xlsx
 *     │   └── QuickExports/    <-- Quick session exports
 *     │       └── Quick_{timestamp}.xlsx
 *     ├── Media/
 *     │   ├── Imported/        <-- Imported images/videos
 *     │   └── Processed/       <-- Processed frames
 *     └── Logs/                <-- error.log
 */
export async function initializeSafeWorkspace(): Promise<string> {
  try {
    const result = await window.electron.initializeSafeWorkspace();
    return result.workspacePath;
  } catch (error) {
    console.error("Failed to initialize safe workspace:", error);
    throw error;
  }
}

export async function getSafeWorkspaceDir(): Promise<string> {
  const result = await window.electron.initializeSafeWorkspace();
  return result.workspacePath;
}

export async function getProjectsDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Projects`;
}

export async function getAutoSaveDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/AutoSave`;
}

export async function getExportsDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Exports`;
}

export async function getExcelExportsDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Exports/Excel`;
}

export async function getQuickExportsDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Exports/QuickExports`;
}

export async function getMediaDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Media`;
}

export async function getMediaImportedDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Media/Imported`;
}

export async function getMediaProcessedDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Media/Processed`;
}

export async function getLogsDir(): Promise<string> {
  const base = await getSafeWorkspaceDir();
  return `${base}/Logs`;
}

