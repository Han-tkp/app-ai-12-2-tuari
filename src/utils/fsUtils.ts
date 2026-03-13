import { documentDir, join } from '@tauri-apps/api/path';
import { exists, mkdir } from '@tauri-apps/plugin-fs';

export async function getSafeWorkspaceDir(): Promise<string> {
  // 1. หา Path โฟลเดอร์ Documents ของ OS นั้นๆ
  const docsPath = await documentDir(); 
  
  // 2. ต่อ Path เป็น .../Documents/DropDetect_Projects
  const workspacePath = await join(docsPath, 'DropDetect_Projects'); 
  
  // 3. ถ้าโฟลเดอร์ยังไม่มี ให้สร้างใหม่แบบ Recursive
  const dirExists = await exists(workspacePath);
  if (!dirExists) {
    await mkdir(workspacePath, { recursive: true });
  }
  
  return workspacePath;
}
