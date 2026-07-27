import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname, resolve } from 'path'
import * as fs from 'fs'
import { spawn, spawnSync, ChildProcess } from 'child_process'
import * as zlib from 'zlib'
import { is } from '@electron-toolkit/utils'

// Fix invisible window on some Windows GPU drivers
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let pythonProcess: ChildProcess | null = null
let isShuttingDown = false

// Enforce single instance — prevents port 8000 conflicts
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ── Python AI Backend Manager ─────────────────────────────────────────────

let restartAttempts = 0
const MAX_RESTART_ATTEMPTS = 3

function startPythonBackend(): void {
  restartAttempts = 0
  _doStartPythonBackend()
}

function _doStartPythonBackend(): void {
  // Pre-flight: kill only known dropdetect-backend processes (no PID-based blind kill)
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/F', '/IM', 'dropdetect-backend.exe'], { stdio: 'ignore' })
    }
  } catch { /* OK */ }

  const isDev = !app.isPackaged
  let command = ''
  let args: string[] = []

  const appPath = app.getAppPath()

  if (isDev) {
    const venvPython = join(appPath, 'backend', 'venv', 'Scripts', 'python.exe')
    const mainScript = join(appPath, 'backend', 'main.py')

    if (fs.existsSync(venvPython)) {
      command = venvPython
    } else {
      command = 'python'
    }
    args = [mainScript]
  } else {
    const prodExe = join(process.resourcesPath, 'backend', 'dist', 'dropdetect-backend.exe')

    if (fs.existsSync(prodExe)) {
      command = prodExe
    } else {
      console.error(`[python-backend] Backend executable not found at: ${prodExe}`)
      mainWindow?.webContents.send('backend-error',
        'AI backend executable not found. Please reinstall the app.')
      return
    }
    args = []
  }

  console.log(`[python-backend] Spawning AI Backend: ${command} ${args.join(' ')}`)

  try {
    const backendCwd = process.resourcesPath

    pythonProcess = spawn(command, args, {
      cwd: backendCwd,
      env: { ...process.env },
      windowsHide: true
    })

    let stdoutBuffer = ''
    pythonProcess.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString()
      const lines = stdoutBuffer.split('\n')
      stdoutBuffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          console.log(`[python-backend] ${line.trim()}`)
        }
      }
    })

    let stderrBuffer = ''
    pythonProcess.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString()
      const lines = stderrBuffer.split('\n')
      stderrBuffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          console.warn(`[python-backend:stderr] ${line.trim()}`)
        }
      }
    })

    pythonProcess.on('error', (err: Error) => {
      console.error(`[python-backend] Error launching process:`, err)
      pythonProcess = null
    })

    pythonProcess.on('close', (code: number | null, signal: string | null) => {
      console.log(`[python-backend] Process exited with code ${code}, signal ${signal}`)
      pythonProcess = null
      if (code !== 0 && !isShuttingDown && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++
        const delay = Math.min(1000 * Math.pow(2, restartAttempts), 8000)
        console.log(`[python-backend] Will restart in ${delay}ms (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`)
        setTimeout(_doStartPythonBackend, delay)
        mainWindow?.webContents.send('backend-status', { running: false, restarting: true, attempt: restartAttempts })
      } else if (code !== 0 && !isShuttingDown) {
        console.error('[python-backend] Max restart attempts reached. Giving up.')
        mainWindow?.webContents.send('backend-error',
          'AI backend crashed and could not be restarted. Please restart the app.')
        mainWindow?.webContents.send('backend-status', { running: false, restarting: false })
      }
    })

    // Health check: wait up to 10s for backend to respond to ping
    _waitForBackend(10, 1000, () => {})
  } catch (err) {
    console.error(`[python-backend] Exception while starting backend:`, err)
  }
}

async function _waitForBackend(retries: number, delayMs: number, onReady: () => void): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ping', {
        signal: AbortSignal.timeout(1500)
      })
      if (response.ok) {
        console.log('[python-backend] Health check passed')
        onReady()
        return
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, delayMs))
  }
  console.warn('[python-backend] Health check did not pass within timeout — app will retry in renderer')
}

function stopPythonBackend(): void {
  if (isShuttingDown) return
  isShuttingDown = true
  if (pythonProcess) {
    console.log('[python-backend] Terminating AI Backend process...')
    try {
      if (process.platform === 'win32' && pythonProcess.pid) {
        spawnSync('taskkill', ['/pid', pythonProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore' })
      } else if (pythonProcess.pid) {
        pythonProcess.kill('SIGTERM')
      }
    } catch (err) {
      console.error('[python-backend] Error while stopping process:', err)
    }
    pythonProcess = null
  }
}

// ── Workspace & Path Helpers ──────────────────────────────────────────────

function getWorkspacePath(): string {
  const docs = app.getPath('documents')
  return join(docs, 'DropDetect_Workspace')
}

async function ensureSafeWorkspace(): Promise<string> {
  const root = getWorkspacePath()
  const subfolders = [
    'Projects',
    'AutoSave',
    'Exports/Excel',
    'Exports/QuickExports',
    'Exports/Snapshots',
    'Media/Imported',
    'Media/Processed',
    'Logs'
  ]
  await fs.promises.mkdir(root, { recursive: true })
  for (const sub of subfolders) {
    await fs.promises.mkdir(join(root, sub), { recursive: true })
  }
  return root
}

function createZipBuffer(filename: string, contentBuffer: Buffer): Buffer {
  const nameBuf = Buffer.from(filename, 'utf-8')
  const compressed = zlib.deflateRawSync(contentBuffer)
  const crc = zlib.crc32(contentBuffer)
  const modTime = 0x4821
  const modDate = 0x5899

  const localHeader = Buffer.alloc(30 + nameBuf.length)
  localHeader.writeUInt32LE(0x04034b50, 0)
  localHeader.writeUInt16LE(20, 4)
  localHeader.writeUInt16LE(0, 6)
  localHeader.writeUInt16LE(8, 8)
  localHeader.writeUInt16LE(modTime, 10)
  localHeader.writeUInt16LE(modDate, 12)
  localHeader.writeUInt32LE(crc, 14)
  localHeader.writeUInt32LE(compressed.length, 18)
  localHeader.writeUInt32LE(contentBuffer.length, 22)
  localHeader.writeUInt16LE(nameBuf.length, 26)
  localHeader.writeUInt16LE(0, 28)
  nameBuf.copy(localHeader, 30)

  const cdHeader = Buffer.alloc(46 + nameBuf.length)
  cdHeader.writeUInt32LE(0x02014b50, 0)
  cdHeader.writeUInt16LE(20, 4)
  cdHeader.writeUInt16LE(20, 6)
  cdHeader.writeUInt16LE(0, 8)
  cdHeader.writeUInt16LE(8, 10)
  cdHeader.writeUInt16LE(modTime, 12)
  cdHeader.writeUInt16LE(modDate, 14)
  cdHeader.writeUInt32LE(crc, 16)
  cdHeader.writeUInt32LE(compressed.length, 20)
  cdHeader.writeUInt32LE(contentBuffer.length, 24)
  cdHeader.writeUInt16LE(nameBuf.length, 28)
  cdHeader.writeUInt16LE(0, 30)
  cdHeader.writeUInt16LE(0, 32)
  cdHeader.writeUInt16LE(0, 34)
  cdHeader.writeUInt16LE(0, 36)
  cdHeader.writeUInt32LE(0, 38)
  cdHeader.writeUInt32LE(0, 42)
  nameBuf.copy(cdHeader, 46)

  const cdOffset = localHeader.length + compressed.length
  const cdSize = cdHeader.length

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(cdSize, 12)
  eocd.writeUInt32LE(cdOffset, 16)
  eocd.writeUInt16LE(0, 20)

  return Buffer.concat([localHeader, compressed, cdHeader, eocd])
}

function extractJsonFromZip(zipBuf: Buffer): any {
  try {
    const str = zipBuf.toString('utf-8')
    if (str.trim().startsWith('{')) {
      return JSON.parse(str)
    }
  } catch {
    // Continue to ZIP extraction
  }

  let offset = 0
  while (offset < zipBuf.length - 30) {
    if (zipBuf.readUInt32LE(offset) === 0x04034b50) {
      const compression = zipBuf.readUInt16LE(offset + 8)
      const compressedSize = zipBuf.readUInt32LE(offset + 18)
      const filenameLen = zipBuf.readUInt16LE(offset + 26)
      const extraLen = zipBuf.readUInt16LE(offset + 28)

      const filename = zipBuf.toString('utf-8', offset + 30, offset + 30 + filenameLen)
      const dataOffset = offset + 30 + filenameLen + extraLen
      const compressedData = zipBuf.subarray(dataOffset, dataOffset + compressedSize)

      if (filename === 'project.json' || filename.endsWith('.json')) {
        let jsonBuf: Buffer
        if (compression === 8) {
          jsonBuf = zlib.inflateRawSync(compressedData)
        } else {
          jsonBuf = compressedData
        }
        return JSON.parse(jsonBuf.toString('utf-8'))
      }

      offset = dataOffset + compressedSize
    } else {
      offset++
    }
  }
  throw new Error('project.json not found in .drop ZIP archive')
}

// ── IPC Handlers ──────────────────────────────────────────────────────────

function setupIpcHandlers(): void {
  // 1. Safe Workspace
  ipcMain.handle('initialize-safe-workspace', async () => {
    try {
      const workspacePath = await ensureSafeWorkspace()
      return { success: true, workspacePath }
    } catch (error: any) {
      console.error('initialize-safe-workspace error:', error)
      return { success: false, error: error.message, workspacePath: '' }
    }
  })

  // 2. Save Project (.drop ZIP archive / JSON payload)
  ipcMain.handle('save-project', async (_event, payload: any) => {
    try {
      await ensureSafeWorkspace()

      // Try Python backend first
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const response = await fetch('http://127.0.0.1:8000/api/save-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        clearTimeout(timeout)

        if (response.ok) {
          const resData = await response.json()
          let finalPath = resData.drop_file

          if (payload.filePath && finalPath && fs.existsSync(finalPath) && finalPath !== payload.filePath) {
            await fs.promises.mkdir(dirname(payload.filePath), { recursive: true })
            await fs.promises.copyFile(finalPath, payload.filePath)
            finalPath = payload.filePath
          }

          return { success: true, filePath: finalPath || payload.filePath || '' }
        }
      } catch (httpErr) {
        console.warn('Backend save-project endpoint un-reachable, using native fallback:', httpErr)
      }

      // Native fallback
      const rawName = payload.project_name || payload.name || payload.data?.project_name || 'Untitled'
      const safeName = rawName.replace(/[/\\:*?"<>|]+/g, '_').replace(/^\.+/, '').trim() || 'Untitled'
      const targetPath = payload.filePath || join(getWorkspacePath(), 'Projects', `${safeName}.drop`)

      await fs.promises.mkdir(dirname(targetPath), { recursive: true })
      const jsonData = Buffer.from(JSON.stringify(payload.data || payload, null, 2))
      const zipBuf = createZipBuffer('project.json', jsonData)

      await fs.promises.writeFile(targetPath, zipBuf)
      return { success: true, filePath: targetPath }
    } catch (error: any) {
      console.error('save-project error:', error)
      return { success: false, error: error.message, filePath: '' }
    }
  })

  // 3. Load Project
  ipcMain.handle('load-project', async (_event, filePath: string) => {
    try {
      const resolved = resolve(filePath)
      const workspace = getWorkspacePath()
      if (!resolved.startsWith(workspace)) {
        return { success: false, error: 'Access denied: file is outside workspace', data: null }
      }

      if (!fs.existsSync(resolved)) {
        return { success: false, error: `File not found: ${resolved}`, data: null }
      }

      // Try Python backend first
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(`http://127.0.0.1:8000/api/load-project?path=${encodeURIComponent(resolved)}`, {
          signal: controller.signal
        })
        clearTimeout(timeout)
        if (response.ok) {
          const data = await response.json()
          return { success: true, data }
        }
      } catch (httpErr) {
        console.warn('Backend load-project endpoint un-reachable, using native fallback:', httpErr)
      }

      // Native fallback
      const fileBuf = await fs.promises.readFile(resolved)
      const data = extractJsonFromZip(fileBuf)
      return { success: true, data }
    } catch (error: any) {
      console.error('load-project error:', error)
      return { success: false, error: error.message, data: null }
    }
  })

  // 4. Export Excel
  ipcMain.handle('export-excel', async (_event, payload: any) => {
    try {
      await ensureSafeWorkspace()
      const rawName = payload.project_name || payload.exportData?.project_name || 'Report'
      const safeName = rawName.replace(/[/\\:*?"<>|\.]{2,}/g, '_').trim() || 'Report'
      const targetPath = payload.filePath || payload.defaultPath || join(getWorkspacePath(), 'Exports', 'Excel', `${safeName}_Report.xlsx`)

      await fs.promises.mkdir(dirname(targetPath), { recursive: true })

      if (payload.buffer) {
        const buf = Buffer.isBuffer(payload.buffer) ? payload.buffer : Buffer.from(payload.buffer, 'base64')
        await fs.promises.writeFile(targetPath, buf)
      } else if (payload.base64) {
        const buf = Buffer.from(payload.base64, 'base64')
        await fs.promises.writeFile(targetPath, buf)
      }

      return { success: true, filePath: targetPath }
    } catch (error: any) {
      console.error('export-excel error:', error)
      return { success: false, error: error.message, filePath: '' }
    }
  })

  // 5. Auto Save Project
  ipcMain.handle('auto-save-project', async (_event, data: any) => {
    try {
      await ensureSafeWorkspace()
      const rawName = data?.project_name || data?.name || 'Untitled'
      const safeName = rawName.replace(/[/\\:*?"<>|\.]{2,}/g, '_').trim() || 'Untitled'
      const autoSaveDir = join(getWorkspacePath(), 'AutoSave', safeName)
      await fs.promises.mkdir(autoSaveDir, { recursive: true })
      const autoSavePath = join(autoSaveDir, `autosave_${Date.now()}.drop`)

      // Try Python backend with isAutoSave: true
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const response = await fetch('http://127.0.0.1:8000/api/save-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, project_name: safeName, isAutoSave: true }),
          signal: controller.signal
        })
        clearTimeout(timeout)
        if (response.ok) {
          const resData = await response.json()
          return { success: true, filePath: resData.drop_file || autoSavePath }
        }
      } catch (httpErr) {
        console.warn('Backend auto-save un-reachable, using native fallback:', httpErr)
      }

      // Native fallback
      const jsonData = Buffer.from(JSON.stringify(data, null, 2))
      const zipBuf = createZipBuffer('project.json', jsonData)
      await fs.promises.writeFile(autoSavePath, zipBuf)
      return { success: true, filePath: autoSavePath }
    } catch (error: any) {
      console.error('auto-save-project error:', error)
      return { success: false, error: error.message, filePath: '' }
    }
  })

  // 6. Log Message
  ipcMain.handle('log-message', async (_event, payload: { level?: string; message?: string }) => {
    try {
      await ensureSafeWorkspace()
      const logDir = join(getWorkspacePath(), 'Logs')
      await fs.promises.mkdir(logDir, { recursive: true })
      const logFile = join(logDir, 'dropdetect.log')
      const level = (payload?.level || 'INFO').toUpperCase()
      const line = `[${new Date().toISOString()}] [${level}] ${payload?.message || ''}\n`
      await fs.promises.appendFile(logFile, line, 'utf-8')
    } catch (error) {
      console.error('log-message error:', error)
    }
  })

  // 7. Show Dialogs
  ipcMain.handle('show-open-dialog', async (_event, options: any) => {
    if (!mainWindow) {
      return dialog.showOpenDialog(options)
    }
    return dialog.showOpenDialog(mainWindow, options)
  })

  ipcMain.handle('show-save-dialog', async (_event, options: any) => {
    if (!mainWindow) {
      return dialog.showSaveDialog(options)
    }
    return dialog.showSaveDialog(mainWindow, options)
  })

  // 8. Read File As Base64 (workspace-restricted)
  ipcMain.handle('read-file-as-base64', async (_event, filePath: string) => {
    const resolved = resolve(filePath)
    const workspace = getWorkspacePath()
    if (!resolved.startsWith(workspace)) {
      throw new Error('Access denied: file is outside workspace')
    }
    const stat = await fs.promises.stat(resolved)
    if (stat.size > 500 * 1024 * 1024) {
      throw new Error('File too large (max 500MB)')
    }
    const fileBuf = await fs.promises.readFile(resolved)
    return fileBuf.toString('base64')
  })

  // 9. Scan Workspace for saved projects & autosaves
  ipcMain.handle('scan-workspace-projects', async () => {
    try {
      const workspace = getWorkspacePath()
      const projectsDir = join(workspace, 'Projects')
      const autoSaveDir = join(workspace, 'AutoSave')
      const results: Array<{ name: string; path: string; lastModified: number; slideCount?: number; type: 'project' | 'autosave' }> = []

      // Scan Projects/
      if (fs.existsSync(projectsDir)) {
        const entries = fs.readdirSync(projectsDir)
        for (const entry of entries) {
          if (entry.endsWith('.drop')) {
            const fullPath = join(projectsDir, entry)
            const stat = fs.statSync(fullPath)
            const name = entry.replace(/\.drop$/, '')
            // Try to peek inside for slide count
            let slideCount: number | undefined
            try {
              const buf = fs.readFileSync(fullPath)
              const data = extractJsonFromZip(buf)
              if (data && data.slides) slideCount = data.slides.length
            } catch { /* skip slide count */ }
            results.push({ name, path: fullPath, lastModified: stat.mtimeMs, slideCount, type: 'project' })
          }
        }
      }

      // Scan AutoSave/ — show only the latest autosave per project
      if (fs.existsSync(autoSaveDir)) {
        const projectDirs = fs.readdirSync(autoSaveDir, { withFileTypes: true })
        for (const dir of projectDirs) {
          if (!dir.isDirectory()) continue
          const dirPath = join(autoSaveDir, dir.name)
          const dropFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.drop'))
          if (dropFiles.length === 0) continue
          // Pick the most recent autosave
          const latest = dropFiles
            .map(f => ({ name: f, path: join(dirPath, f), mtime: fs.statSync(join(dirPath, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime)[0]
          results.push({ name: `${dir.name} (autosave)`, path: latest.path, lastModified: latest.mtime, type: 'autosave' })
        }
      }

      // Sort by last modified descending
      results.sort((a, b) => b.lastModified - a.lastModified)
      return results
    } catch (error: any) {
      return []
    }
  })

  // 10. Backend Health Check
  ipcMain.handle('get-backend-status', async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ping', {
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        return { running: true, url: 'http://127.0.0.1:8000' }
      }
    } catch {
      // Backend ping failed
    }
    return { running: false, url: 'http://127.0.0.1:8000' }
  })

  // 11. Window Controls (Support both send/on and invoke/handle)
  const closeWin = () => mainWindow?.close()
  const minWin = () => mainWindow?.minimize()
  const toggleMaxWin = () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }

  ipcMain.on('window-close', closeWin)
  ipcMain.on('closeWindow', closeWin)
  ipcMain.on('window-minimize', minWin)
  ipcMain.on('minimizeWindow', minWin)
  ipcMain.on('window-toggle-maximize', toggleMaxWin)
  ipcMain.on('toggleMaximizeWindow', toggleMaxWin)
}

// ── Window Creation ───────────────────────────────────────────────────────

function createWindow(): void {
  const appPath = app.getAppPath()
  const iconPath = join(appPath, 'iconapp', 'DropDetect.ico')

  // Flexible preload resolution
  let preloadPath = join(__dirname, '../preload/preload.mjs')
  if (!fs.existsSync(preloadPath)) {
    const candidates = [
      join(__dirname, '../preload/preload.js'),
      join(__dirname, '../preload/index.mjs'),
      join(__dirname, '../preload/index.js')
    ]
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        preloadPath = cand
        break
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    x: 100,
    y: 100,
    minWidth: 900,
    minHeight: 600,
    show: false,
    alwaysOnTop: false,
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: 'DropDetect AI',
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // Guarantee window visibility and foreground focus on ready-to-show
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Timeout fallback if ready-to-show does not fire within 1500ms
  const forceShowTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.warn('[electron] ready-to-show event timed out; forcing mainWindow.show()')
      mainWindow.show()
      mainWindow.focus()
    }
  }, 1500)

  mainWindow.on('closed', () => {
    clearTimeout(forceShowTimer)
    mainWindow = null
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[electron] Page failed to load (${errorCode}): ${errorDescription} at ${validatedURL}`)
    // Retrying dev server load URL if dev server had slow cold-start
    if (is.dev && validatedURL && validatedURL.startsWith('http')) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('[electron] Retrying loadURL for dev server...')
          mainWindow.loadURL(validatedURL)
        }
      }, 1000)
    }
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']

  if (is.dev && rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath)
    } else {
      console.error(`[electron] Renderer index.html not found at: ${indexPath}`)
    }
  }
}

// ── Lifecycle Events ──────────────────────────────────────────────────────

app.whenReady().then(() => {
  setupIpcHandlers()
  startPythonBackend()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  stopPythonBackend()
})

app.on('window-all-closed', () => {
  stopPythonBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('SIGTERM', () => {
  if (isShuttingDown) return
  stopPythonBackend()
  process.exit(0)
})

process.on('SIGINT', () => {
  if (isShuttingDown) return
  stopPythonBackend()
  process.exit(0)
})

process.on('exit', () => {
  if (isShuttingDown) return
  stopPythonBackend()
})
