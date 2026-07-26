import React, { useState, useRef, useEffect } from 'react';
import {
  X, Brain, Cpu, Edit3, Palette,
  RotateCcw, Check, FolderOpen, Upload, Trash2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n';

const SettingsWindow: React.FC = () => {
  const {
    isSettingsOpen, setSettingsOpen,
    currentSettingsTab, setSettingsTab,
    lineThickness, fillOpacity, annotationColor,
    updateAnnotationSettings,
    aiConfidence, setAIConfidence,
    theme, setTheme, exportPath, setExportPath,
    settingsPosition, setSettingsPosition,
    hotkeyLiveAI, setHotkeyLiveAI,
    hotkeySnapshot, setHotkeySnapshot,
    hardwareProfile, profileOverride, ramGb, cpuCores, inferenceSkip,
    setProfileOverride, isAIRunning, cameraIndex, setCameraIndex,
    snapshotDisplayDuration, setSnapshotDisplayDuration,
    annotationFadeDelay, setAnnotationFadeDelay,
    appLanguage, setAppLanguage, uiScale, setUiScale,
    setVideoControlsMode, videoControlsMode
  } = useAppStore();

  const { t } = useTranslation();

  const [hasChanges, setHasChanges] = useState(false);
  const [profileApplied, setProfileApplied] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [recordingHotkey, setRecordingHotkey] = useState<'live' | 'snapshot' | null>(null);
  const [onnxFiles, setOnnxFiles] = useState<Array<{name: string, path: string, size: string}>>([
    { name: 'yolov8n_4x.onnx', path: 'fileonnx/yolov8n_4x.onnx', size: '6.2 MB' },
    { name: 'yolov8n_10x.onnx', path: 'fileonnx/yolov8n_10x.onnx', size: '6.2 MB' },
  ]);
  const [isImportingModel, setIsImportingModel] = useState(false);
  
  // Calibration Tool State
  const [calibrationMode, setCalibrationMode] = useState<'4x' | '10x' | null>(null);
  const [calibrationLength, setCalibrationLength] = useState<string>('1000');
  const [calibratedValue, setCalibratedValue] = useState<number | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!recordingHotkey) return;
      
      e.preventDefault();
      e.stopPropagation();

      let keyName = e.code === 'Space' ? 'Space' : e.key;
      if (keyName.length === 1) keyName = keyName.toUpperCase();
      
      // Validation: Check for duplicate hotkeys
      if (recordingHotkey === 'live' && keyName === hotkeySnapshot) {
        console.warn(`Key "${keyName}" already assigned to Snapshot`);
        setRecordingHotkey(null);
        return;
      }
      if (recordingHotkey === 'snapshot' && keyName === hotkeyLiveAI) {
        console.warn(`Key "${keyName}" already assigned to Live AI`);
        setRecordingHotkey(null);
        return;
      }

      if (recordingHotkey === 'live') {
        setHotkeyLiveAI(keyName);
      } else {
        setHotkeySnapshot(keyName);
      }
      
      setRecordingHotkey(null);
      setHasChanges(true);
    };

    if (recordingHotkey) {
      window.addEventListener('keydown', handleGlobalKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [recordingHotkey, setHotkeyLiveAI, setHotkeySnapshot]);

  useEffect(() => {
    // Center window on first open if position is default
    if (isSettingsOpen && settingsPosition.x === window.innerWidth / 2 - 380) {
      setSettingsPosition({
        x: window.innerWidth / 2 - 320,
        y: window.innerHeight / 2 - 230
      });
    }
  }, [isSettingsOpen, settingsPosition.x, setSettingsPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setSettingsPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, setSettingsPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - settingsPosition.x,
      y: e.clientY - settingsPosition.y
    });
  };

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setSettingsOpen(false);
    setHasChanges(false);
    window.dispatchEvent(new CustomEvent('send-backend-command', { 
      detail: { action: 'update_settings', conf: aiConfidence } 
    }));
  };

  const handleBrowse = async () => {
    try {
      const result = await window.electron.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: exportPath,
      });
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setExportPath(result.filePaths[0]);
        setHasChanges(true);
      }
    } catch (err) {
      console.error("Failed to open directory dialog:", err);
    }
  };

  const handleHexChange = (val: string) => {
    let cleaned = val.replace(/[^0-9A-Fa-f]/g, '');
    if (cleaned.length > 6) cleaned = cleaned.slice(0, 6);
    updateAnnotationSettings({ annotationColor: `#${cleaned}` });
    setHasChanges(true);
  };

  return (
    <div className={`fixed inset-0 z-[1000] overflow-hidden ${isSettingsOpen ? '' : 'pointer-events-none'}`}>
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        style={{
          left: `${settingsPosition.x}px`,
          top: `${settingsPosition.y}px`,
          position: 'absolute',
          display: isSettingsOpen ? 'block' : 'none'
        }}
        className="bg-[var(--bg-window)] w-[640px] h-[460px] rounded-[6px] flex flex-col overflow-hidden mac-dialog-shadow border border-[var(--border-strong)] transition-colors select-none"
      >
        
        <div className="flex-1 flex min-h-0">
          {/* macOS Style Sidebar - Narrower */}
          <div className="w-[180px] bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col pt-8 px-2 shrink-0 transition-colors cursor-default">
            <div className="flex items-center gap-2.5 px-3 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                <SettingsIcon />
              </div>
              <span className="text-[12px] font-bold text-[var(--text1)]">Settings</span>
            </div>
            <NavTab active={currentSettingsTab === 'AI & Capture'} onClick={() => setSettingsTab('AI & Capture')} icon={<Brain size={14} />} label="AI & Capture" />
            <NavTab active={currentSettingsTab === 'Hardware & Camera'} onClick={() => setSettingsTab('Hardware & Camera')} icon={<Cpu size={14} />} label="Hardware" />
            <NavTab active={currentSettingsTab === 'AI Models'} onClick={() => setSettingsTab('AI Models')} icon={<Cpu size={14} />} label="AI Models" />
            <NavTab active={currentSettingsTab === 'Manual Edit'} onClick={() => setSettingsTab('Manual Edit')} icon={<Edit3 size={14} />} label="Manual Edit" />
            <NavTab active={currentSettingsTab === 'Appearance & Output'} onClick={() => setSettingsTab('Appearance & Output')} icon={<Palette size={14} />} label="Appearance" />
            
            <div className="mt-auto p-3">
               <div className="bg-[var(--bg-surface2)] rounded-lg p-2.5 border border-[var(--border)]">
                  <p className="text-[9px] text-[var(--text3)] leading-tight font-medium opacity-80">v2.0.4 • {theme.toUpperCase()}</p>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)] transition-colors">
            <div className="h-10 flex items-center justify-between px-5 border-b border-[var(--separator)] shrink-0 cursor-default">
              <span className="text-[13px] font-bold text-[var(--text1)]">{currentSettingsTab}</span>
              <button 
                onClick={() => setSettingsOpen(false)} 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text3)] hover:bg-[var(--mac-red)]/10 hover:text-[var(--mac-red)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: '340px' }}>
              {currentSettingsTab === 'AI & Capture' && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Model Management</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Lens 4x"><select className="mac-select h-8 py-1"><option>yolov8n_4x.onnx</option></select></Field>
                      <Field label="Lens 10x"><select className="mac-select h-8 py-1"><option>yolov8n_10x.onnx</option></select></Field>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Detection Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-wider">AI Confidence Threshold</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min="0.01" max="0.99" step="0.01" value={aiConfidence} onChange={(e) => { setAIConfidence(parseFloat(e.target.value)); setHasChanges(true); }} className="zoom-input flex-1 h-[3px]" />
                          <span className="text-[12px] font-bold text-[var(--text1)] font-mono min-w-[30px] text-right">{(aiConfidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-wider">Snapshot Freeze Duration</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min="0.5" max="5" step="0.5" value={snapshotDisplayDuration} onChange={(e) => setSnapshotDisplayDuration(parseFloat(e.target.value))} className="zoom-input flex-1 h-[3px]" />
                          <span className="text-[12px] font-bold text-[var(--text1)] font-mono min-w-[30px] text-right">{snapshotDisplayDuration}s</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-widest px-1">Snapshot Key</label>
                        <button
                          onClick={() => setRecordingHotkey('snapshot')}
                          className={`w-full h-9 rounded-lg border text-[12px] font-black tracking-widest transition-all ${recordingHotkey === 'snapshot' ? 'bg-[var(--mac-orange)] text-white border-[var(--mac-orange)] animate-pulse' : 'bg-[var(--bg-input)] text-[var(--accent-text)] border-[var(--border-strong)] hover:border-[var(--accent)]'}`}
                        >
                          {recordingHotkey === 'snapshot' ? 'PRESS ANY KEY' : hotkeySnapshot}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-widest px-1">Live AI Key</label>
                        <button
                          onClick={() => setRecordingHotkey('live')}
                          className={`w-full h-9 rounded-lg border text-[12px] font-black tracking-widest transition-all ${recordingHotkey === 'live' ? 'bg-[var(--mac-orange)] text-white border-[var(--mac-orange)] animate-pulse' : 'bg-[var(--bg-input)] text-[var(--accent-text)] border-[var(--border-strong)] hover:border-[var(--accent)]'}`}
                        >
                          {recordingHotkey === 'live' ? 'PRESS ANY KEY' : hotkeyLiveAI}
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {currentSettingsTab === 'AI Models' && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Installed Models</h3>
                    <div className="bg-[var(--bg-surface2)] p-4 rounded-xl border border-[var(--border)] space-y-3">
                      {onnxFiles.map((model, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-active)' }}>
                              <Cpu size={18} style={{ color: 'var(--accent-text)' }} />
                            </div>
                            <div>
                              <div className="text-[12px] font-semibold" style={{ color: 'var(--text1)' }}>{model.name}</div>
                              <div className="text-[9px]" style={{ color: 'var(--text4)' }}>{model.path}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>{model.size}</span>
                            <button
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text4)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--mac-red)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={async () => {
                          setIsImportingModel(true);
                          try {
                            const result = await window.electron.showOpenDialog({
                              properties: ['openFile'],
                              filters: [{ name: 'ONNX Model', extensions: ['onnx'] }]
                            });
                            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                              const selected = result.filePaths[0];
                              const fileName = selected.split(/[\\/]/).pop() || 'unknown.onnx';
                              setOnnxFiles([...onnxFiles, { name: fileName, path: 'fileonnx/' + fileName, size: 'Loading...' }]);
                            }
                          } catch (err) {
                            console.error('Import failed:', err);
                          } finally {
                            setIsImportingModel(false);
                          }
                        }}
                        disabled={isImportingModel}
                        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 font-medium text-[12px] transition-colors border border-dashed"
                        style={{
                          borderColor: 'var(--accent)',
                          background: 'var(--bg-active)',
                          color: 'var(--accent-text)',
                        }}
                      >
                        <Upload size={14} />
                        {isImportingModel ? 'Importing...' : 'Import New Model'}
                      </button>
                      
                      <p className="text-[9px]" style={{ color: 'var(--text4)' }}>
                        Supported: YOLOv8 ONNX models (.onnx). Place calibration file in resources/ folder.
                      </p>
                    </div>
                  </section>
                  
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Lens Calibration</h3>
                    <div className="bg-[var(--bg-surface2)] p-4 rounded-xl border border-[var(--border)]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                          <div>
                            <div className="text-[11px] font-semibold" style={{ color: 'var(--text1)' }}>4x Objective</div>
                            <div className="text-[9px]" style={{ color: 'var(--text4)' }}>resources/4x.json</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setCalibrationMode('4x'); setCalibrationLength('1000'); }}
                              className="px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors"
                              style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                              Calibrate
                            </button>
                            <span className="text-[10px] font-mono" style={{ color: 'var(--mac-green)' }}>✓ Loaded</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                          <div>
                            <div className="text-[11px] font-semibold" style={{ color: 'var(--text1)' }}>10x Objective</div>
                            <div className="text-[9px]" style={{ color: 'var(--text4)' }}>resources/10x.json</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setCalibrationMode('10x'); setCalibrationLength('1000'); }}
                              className="px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors"
                              style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                              Calibrate
                            </button>
                            <span className="text-[10px] font-mono" style={{ color: 'var(--mac-green)' }}>✓ Loaded</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Calibration Modal */}
                      {calibrationMode && (
                        <div className="mt-4 p-4 rounded-lg border-2" style={{ borderColor: 'var(--accent)', background: 'var(--bg-active)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[12px] font-bold" style={{ color: 'var(--accent-text)' }}>
                              🔬 Calibrating {calibrationMode.toUpperCase()} Lens
                            </h4>
                            <button
                              onClick={() => { setCalibrationMode(null); setCalibratedValue(null); }}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text3)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--mac-red)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              <strong>Step 1:</strong> Place stage micrometer slide under microscope
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              <strong>Step 2:</strong> Draw a line across known distance on the micrometer
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              <strong>Step 3:</strong> Enter the actual distance in micrometers (µm)
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <label className="text-[10px] font-semibold" style={{ color: 'var(--text2)' }}>
                                Actual Distance (µm):
                              </label>
                              <input
                                type="number"
                                value={calibrationLength}
                                onChange={(e) => setCalibrationLength(e.target.value)}
                                className="flex-1 rounded-md px-2 py-1 text-[12px] font-mono outline-none border"
                                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-strong)', color: 'var(--text1)' }}
                              />
                            </div>
                            
                            {calibratedValue !== null && (
                              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent)' }}>
                                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Calibration Factor:</div>
                                <div className="text-[18px] font-bold font-mono" style={{ color: 'var(--accent-text)' }}>
                                  {calibratedValue.toFixed(6)} <span className="text-[11px] font-normal" style={{ color: 'var(--text3)' }}>µm/pixel</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Simulate calibration calculation
                                  // In real app: pixelLength from drawn line
                                  const pixelLength = 960; // Simulated
                                  const actualLength = parseFloat(calibrationLength);
                                  if (actualLength > 0) {
                                    const factor = actualLength / pixelLength;
                                    setCalibratedValue(factor);
                                    setIsCalibrating(false);
                                  }
                                }}
                                disabled={isCalibrating}
                                className="flex-1 h-9 rounded-md text-[11px] font-medium transition-colors"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                              >
                                {isCalibrating ? 'Calculating...' : 'Calculate Factor'}
                              </button>
                              <button
                                onClick={() => {
                                  if (calibratedValue !== null) {
                                    // Save calibration to resources/{mode}.json
                                    console.log(`Saving calibration: ${calibrationMode} = ${calibratedValue}`);
                                    console.log(`Calibration saved: ${calibrationMode} = ${calibratedValue.toFixed(6)} µm/pixel`);
                                    setCalibrationMode(null);
                                    setCalibratedValue(null);
                                  }
                                }}
                                disabled={calibratedValue === null}
                                className="flex-1 h-9 rounded-md text-[11px] font-medium transition-colors border"
                                style={{
                                  borderColor: 'var(--border-strong)',
                                  background: calibratedValue !== null ? 'var(--bg-surface)' : 'var(--bg-input)',
                                  color: calibratedValue !== null ? 'var(--text1)' : 'var(--text4)',
                                }}
                              >
                                Save Calibration
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {currentSettingsTab === 'Manual Edit' && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Drawing Styles</h3>
                    <div className="bg-[var(--bg-surface2)] p-4 rounded-xl border border-[var(--border)] space-y-6 transition-colors">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[var(--text3)] uppercase">Thickness</label>
                          <input type="range" min="1" max="10" value={lineThickness} onChange={(e) => { updateAnnotationSettings({ lineThickness: parseInt(e.target.value) }); setHasChanges(true); }} className="zoom-input w-full h-[3px]" />
                          <div className="text-right text-[10px] text-[var(--text4)] font-mono">{lineThickness} px</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[var(--text3)] uppercase">Opacity</label>
                          <input type="range" min="0" max="1" step="0.05" value={fillOpacity} onChange={(e) => { updateAnnotationSettings({ fillOpacity: parseFloat(e.target.value) }); setHasChanges(true); }} className="zoom-input w-full h-[3px]" />
                          <div className="text-right text-[10px] text-[var(--text4)] font-mono">{fillOpacity.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text3)] uppercase">Primary Color</label>
                        <div className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 rounded-lg border border-[var(--border-strong)] transition-colors">
                          <div className="w-6 h-6 rounded border border-black/10 shadow-inner" style={{ backgroundColor: annotationColor }}></div>
                          <input
                            type="text"
                            value={annotationColor.replace('#', '')}
                            onChange={(e) => handleHexChange(e.target.value)}
                            className="bg-transparent text-[12px] text-[var(--text1)] font-mono outline-none flex-1 uppercase"
                            placeholder="FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Annotation Display</h3>
                    <div className="bg-[var(--bg-surface2)] p-4 rounded-xl border border-[var(--border)] space-y-4 transition-colors">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-wider">Annotation Display Duration</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min="500" max="10000" step="500" value={annotationFadeDelay} onChange={(e) => { setAnnotationFadeDelay(parseInt(e.target.value)); setHasChanges(true); }} className="zoom-input flex-1 h-[3px]" />
                          <span className="text-[12px] font-bold text-[var(--text1)] font-mono min-w-[40px] text-right">{(annotationFadeDelay / 1000).toFixed(1)}s</span>
                        </div>
                        <p className="text-[9px] text-[var(--text4)]">
                          How long annotations stay visible on screen. Data is always saved regardless.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {currentSettingsTab === 'Appearance & Output' && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                  
                  {/* Language */}
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">{t('language')}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('language_desc')}</p>
                    <div className="flex gap-1 bg-[var(--bg-surface2)] p-1 rounded-xl border border-[var(--border)]">
                      <SegBtn active={appLanguage === 'en'} onClick={() => setAppLanguage('en')} label="English" />
                      <SegBtn active={appLanguage === 'th'} onClick={() => setAppLanguage('th')} label="ภาษาไทย" />
                    </div>
                  </section>

                  {/* UI Scale */}
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">{t('ui_scale')}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('ui_scale_desc')}</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="0.75" max="1.5" step="0.05" 
                        value={uiScale} 
                        onChange={(e) => setUiScale(parseFloat(e.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <span className="text-[11px] font-mono w-12 text-right">
                        {Math.round(uiScale * 100)}%
                      </span>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">{t('theme')}</h3>
                    <div className="flex gap-1 bg-[var(--bg-surface2)] p-1 rounded-xl border border-[var(--border)]">
                      <SegBtn active={theme === 'dark'} onClick={() => setTheme('dark')} label={t('theme_dark')}
                        preview={<span className="w-3 h-3 rounded-full border border-white/20" style={{ background: '#18181b' }} />} />
                      <SegBtn active={theme === 'light'} onClick={() => setTheme('light')} label={t('theme_light')}
                        preview={<span className="w-3 h-3 rounded-full border border-black/10" style={{ background: '#fafaf9' }} />} />
                      <SegBtn active={theme === 'warm'} onClick={() => setTheme('warm')} label={t('theme_warm')}
                        preview={<span className="w-3 h-3 rounded-full border border-white/20" style={{ background: '#1e293b' }} />} />
                    </div>
                    {/* Theme preview swatches */}
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'dark' as const, bg: '#18181b', colors: ['#18181b','#27272a','#3f3f46','#52525b','#71717a','#2563eb'], fg: 'rgba(255,255,255,0.6)', label: 'Zinc' },
                        { key: 'light' as const, bg: '#fafaf9', colors: ['#fafaf9','#f5f5f4','#e7e5e4','#d6d3d1','#a8a29e','#1e3a5f'], fg: '#78716c', label: 'Stone' },
                        { key: 'warm' as const, bg: '#1e293b', colors: ['#1e293b','#334155','#475569','#64748b','#94a3b8','#3b82f6'], fg: 'rgba(255,255,255,0.6)', label: 'Slate' },
                      ]).map(t => (
                        <button
                          key={t.key}
                          onClick={() => setTheme(t.key)}
                          className={`rounded-lg border-2 transition-all overflow-hidden flex flex-col ${theme === t.key ? 'border-[var(--accent)]' : 'border-[var(--border)] opacity-60 hover:opacity-90'}`}
                          style={{ background: t.bg }}
                        >
                          <div className="flex h-3 w-full">
                            {t.colors.map((c, i) => (
                              <div key={i} className="flex-1" style={{ background: c, flex: i === t.colors.length - 1 ? 0.6 : 1 }} />
                            ))}
                          </div>
                          <span className="text-[8px] font-bold uppercase px-2 py-1" style={{ color: t.fg }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">File Export & Output</h3>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[10.5px] text-[var(--accent-text)] font-mono truncate flex items-center">{exportPath}</div>
                      <button onClick={handleBrowse} className="sf-btn px-3 h-8 bg-[var(--accent)] text-white border-none text-[11px]">
                        <FolderOpen size={13} /> Browse
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {currentSettingsTab === 'Hardware & Camera' && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Detected Hardware</h3>
                    <div className="bg-[var(--bg-surface2)] rounded-lg border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <tbody className="divide-y divide-[var(--separator)]">
                          <tr>
                            <td className="p-3 text-[var(--text3)]">RAM</td>
                            <td className="p-3 text-right font-medium font-mono">{ramGb > 0 ? `${ramGb} GB` : '—'}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-[var(--text3)]">CPU Cores</td>
                            <td className="p-3 text-right font-medium font-mono">{cpuCores > 0 ? cpuCores : '—'}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-[var(--text3)]">Active Profile</td>
                            <td className="p-3 text-right">
                              <span className="font-black uppercase text-[10px]" style={{
                                color: hardwareProfile === 'low' ? 'var(--mac-orange)' :
                                       hardwareProfile === 'mid' ? 'var(--mac-yellow)' :
                                       'var(--mac-green)'
                              }}>{hardwareProfile}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-[var(--text3)]">Inference Interval</td>
                            <td className="p-3 text-right font-medium font-mono">
                              {inferenceSkip === 1 ? 'Every frame' : `Every ${inferenceSkip} frames`}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-[var(--text3)]">Execution Provider</td>
                            <td className="p-3 text-right font-medium">CPU EP</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Camera Input Device Source</h3>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-widest px-1">
                        Active Camera Device
                      </label>
                      <select
                        className="mac-select w-full h-9"
                        value={cameraIndex}
                        onChange={(e) => {
                          const newIndex = parseInt(e.target.value, 10);
                          setCameraIndex(newIndex);
                          setHasChanges(true);
                          window.dispatchEvent(new CustomEvent('send-backend-command', { 
                            detail: { action: 'set_camera', index: newIndex } 
                          }));
                        }}
                      >
                        <option value={0}>Camera 0 (Default / Built-in Webcam)</option>
                        <option value={1}>Camera 1 (USB Microscope / External 1)</option>
                        <option value={2}>Camera 2 (USB Microscope / External 2)</option>
                        <option value={3}>Camera 3 (External Source 3)</option>
                      </select>
                      <p className="text-[9px] text-[var(--text4)] leading-snug px-1">
                        Switch between built-in laptop webcam and external USB microscope camera.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="settings-section-title text-[11px]">Performance Profile Override</h3>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-[var(--text4)] uppercase tracking-widest px-1">
                        Profile
                      </label>
                      <select
                        className="mac-select w-full h-9"
                        value={profileOverride}
                        onChange={(e) => {
                          const newProfile = e.target.value as 'auto' | 'low' | 'mid' | 'high';
                          if (isAIRunning && newProfile !== profileOverride) {
                            const ok = window.confirm(
                              'AI inference กำลังทำงาน การเปลี่ยน profile จะมีผลกับ frame ถัดไปทันที\n' +
                              'ข้อมูลที่นับไปแล้วจะไม่หาย ยืนยันหรือไม่?'
                            );
                            if (!ok) return;
                          }
                          setProfileOverride(newProfile);
                          setProfileApplied(true);
                          setTimeout(() => setProfileApplied(false), 2000);
                        }}
                      >
                        <option value="auto">Auto · detected: {hardwareProfile.toUpperCase()}</option>
                        <option value="low">Low · every 3 frames</option>
                        <option value="mid">Mid · every 2 frames</option>
                        <option value="high">High · every frame</option>
                      </select>
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[9px] text-[var(--text4)] leading-snug">
                          Changes apply immediately. Resolution stays 640×640 on all profiles.
                        </p>
                        {profileApplied && (
                          <span className="text-[9px] text-[var(--mac-green)] font-bold animate-in fade-in">Applied ✓</span>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Content Footer */}
            <div className="h-14 border-t border-[var(--separator)] flex items-center justify-between px-5 shrink-0 bg-[var(--bg-surface)] transition-colors cursor-default">
              <button className="text-[var(--mac-red)] hover:opacity-80 text-[11px] font-bold flex items-center gap-1.5 transition-all">
                <RotateCcw size={12} /> Reset
              </button>
              
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <div className="text-[var(--mac-orange)] text-[10px] font-bold bg-[var(--mac-orange)]/5 px-2 py-0.5 rounded-full border border-[var(--mac-orange)]/20 animate-pulse">
                    Unsaved
                  </div>
                )}
                <button 
                  onClick={handleSave} 
                  className="bg-[var(--accent)] text-white px-6 py-1.5 rounded-[6px] font-bold text-[12px] shadow-lg shadow-[var(--accent)]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] transition-all text-left mb-0.5 mx-1 ${active ? 'bg-[var(--accent)] text-white font-bold shadow-sm' : 'text-[var(--text2)] hover:bg-[var(--bg-hover)]'}`}>
    <span className={active ? 'text-white' : 'text-[var(--accent)]'}>{icon}</span>
    <span className="text-[11.5px] tracking-tight">{label}</span>
  </button>
);

const SegBtn: React.FC<{ active: boolean; onClick: () => void; label: string; preview?: React.ReactNode }> = ({ active, onClick, label, preview }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-bold transition-all ${
      active ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text1)] hover:bg-[var(--bg-hover)]'
    }`}
  >
    {preview}
    {label}
  </button>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] font-black text-[var(--text4)] uppercase tracking-widest px-1">{label}</label>
    {children}
  </div>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default SettingsWindow;
