import { useAppStore } from './store/useAppStore';

const translations = {
  en: {
    // Settings Window
    settings: "Settings",
    ai_capture: "AI & Capture",
    hardware_camera: "Hardware & Camera",
    ai_models: "AI Models",
    manual_edit: "Manual Edit",
    appearance_output: "Appearance & Output",
    
    language: "Language",
    language_desc: "Select application language",
    
    ui_scale: "Scale & Layout",
    ui_scale_desc: "Adjust the size of the user interface",
    
    theme: "Theme",
    theme_desc: "Choose the application color theme",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_warm: "Warm",
    
    close: "Close",
    
    // Additional placeholders
    auto_save: "Auto-Save",
    auto_save_desc: "Automatically save project every 30 seconds",
    // Sidebar
    mode: "Mode",
    analyze: "Analyze",
    report: "Report",
    camera: "Camera",
    live_ai: "Live AI",
    take_snapshot: "Take Snapshot",
    imported_media: "Imported Media",
    no_media: "No media",
    ai_detection: "AI Detection",
    confidence: "Confidence",
    
    // Dashboard
    status: "Status",
    drops: "Drops",
    target: "Target",
    in_frame: "In-Frame",
    accumulated: "Accumulated",
    span: "Span",
    out_of_bounds: "Out-of-Bounds",
    who_compliance: "WHO Compliance",
    pass: "Pass",
    fail: "Fail",
    not_avail: "N/A",
    
    // Start Screen
    new_live_project: "New Live Camera Project",
    new_live_desc: "Analyze droplets in real-time from microscope",
    new_import_project: "New Import Media Project",
    new_import_desc: "Import images or video for analysis",
    open_project: "Open Project",
    recent_projects: "Recent Projects",
    cancel: "Cancel",
    create_project: "Create Project",
    project_name: "Project Name",
    objective_lens: "Objective Lens",
    
    // Workspace
    no_signal: "No Signal",
    no_signal_desc: "Start camera or drag & drop an image",
    snapshot: "SNAPSHOT",
    detected: "detected",
  },
  th: {
    // Settings Window
    settings: "การตั้งค่า",
    ai_capture: "AI & จับภาพ",
    hardware_camera: "ฮาร์ดแวร์และกล้อง",
    ai_models: "โมเดล AI",
    manual_edit: "แก้ไขด้วยมือ",
    appearance_output: "หน้าตาและการส่งออก",
    
    language: "ภาษา",
    language_desc: "เลือกภาษาของโปรแกรม",
    
    ui_scale: "ขนาดหน้าจอ (Scale)",
    ui_scale_desc: "ปรับขนาดของเมนูและหน้าจอแอปพลิเคชัน",
    
    theme: "ธีมสี",
    theme_desc: "เลือกโทนสีของโปรแกรม",
    theme_light: "สว่าง",
    theme_dark: "มืด",
    theme_warm: "อุ่น",
    
    close: "ปิด",
    
    auto_save: "บันทึกอัตโนมัติ",
    auto_save_desc: "บันทึกโปรเจกต์อัตโนมัติทุก 30 วินาที",
    
    // Sidebar
    mode: "โหมด",
    analyze: "วิเคราะห์",
    report: "รายงาน",
    camera: "กล้อง",
    live_ai: "AI ตรวจจับสด",
    take_snapshot: "ถ่ายภาพ",
    imported_media: "สื่อที่นำเข้า",
    no_media: "ไม่มีสื่อ",
    ai_detection: "การตรวจจับ AI",
    confidence: "ความแม่นยำ",
    
    // Dashboard
    status: "สถานะ",
    drops: "หยดน้ำ",
    target: "เป้าหมาย",
    in_frame: "ในเฟรม",
    accumulated: "สะสม",
    span: "สแปน",
    out_of_bounds: "เกินขอบเขต",
    who_compliance: "มาตรฐาน WHO",
    pass: "ผ่าน",
    fail: "ไม่ผ่าน",
    not_avail: "ไม่มี",
    
    // Start Screen
    new_live_project: "สร้างโปรเจกต์กล้องสด",
    new_live_desc: "วิเคราะห์หยดน้ำแบบเรียลไทม์จากกล้อง",
    new_import_project: "สร้างโปรเจกต์จากสื่อ",
    new_import_desc: "นำเข้าภาพหรือวิดีโอเพื่อวิเคราะห์",
    open_project: "เปิดโปรเจกต์",
    recent_projects: "โปรเจกต์ล่าสุด",
    cancel: "ยกเลิก",
    create_project: "สร้างโปรเจกต์",
    project_name: "ชื่อโปรเจกต์",
    objective_lens: "เลนส์ใกล้วัตถุ",
    
    // Workspace
    no_signal: "ไม่มีสัญญาณ",
    no_signal_desc: "เริ่มกล้องหรือลากไฟล์ภาพ/วิดีโอมาวางที่นี่",
    snapshot: "ถ่ายภาพ",
    detected: "ตรวจพบ",
  }
};

export type TranslationKey = keyof typeof translations.en;

export function useTranslation() {
  const lang = useAppStore(state => state.appLanguage) || 'en';
  
  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };
  
  return { t, lang };
}
