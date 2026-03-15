import { documentDir, join } from '@tauri-apps/api/path';
import { exists, mkdir } from '@tauri-apps/plugin-fs';

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
    // 1. Get Documents directory
    const baseDocs = await documentDir();
    
    // 2. Define sub-folders to create
    const foldersToCreate = [
      'DropDetect_Workspace',
      'DropDetect_Workspace/Projects',
      'DropDetect_Workspace/AutoSave',
      'DropDetect_Workspace/Exports',
      'DropDetect_Workspace/Exports/Excel',
      'DropDetect_Workspace/Exports/QuickExports',
      'DropDetect_Workspace/Media',
      'DropDetect_Workspace/Media/Imported',
      'DropDetect_Workspace/Media/Processed',
      'DropDetect_Workspace/Logs'
    ];

    // 3. Create folders if they don't exist
    for (const folder of foldersToCreate) {
      const fullPath = await join(baseDocs, folder);
      const dirExists = await exists(fullPath);
      
      if (!dirExists) {
        await mkdir(fullPath, { recursive: true });
        console.log(`Created safe directory: ${fullPath}`);
      }
    }
    
    // Return the main workspace path
    return await join(baseDocs, 'DropDetect_Workspace');
    
  } catch (error) {
    console.error("Failed to initialize safe workspace:", error);
    throw error;
  }
}

export async function getSafeWorkspaceDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace');
}

export async function getProjectsDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Projects');
}

export async function getAutoSaveDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'AutoSave');
}

export async function getExportsDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Exports');
}

export async function getExcelExportsDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Exports', 'Excel');
}

export async function getQuickExportsDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Exports', 'QuickExports');
}

export async function getMediaDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Media');
}

export async function getMediaImportedDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Media', 'Imported');
}

export async function getMediaProcessedDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Media', 'Processed');
}

export async function getLogsDir(): Promise<string> {
  const docsPath = await documentDir();
  return await join(docsPath, 'DropDetect_Workspace', 'Logs');
}
