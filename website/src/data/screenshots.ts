export interface ScreenshotItem {
  id: string;
  filename: string;
  src: string;
  category: 'live' | 'analysis' | 'import' | 'export';
  title: { th: string; en: string };
  description: { th: string; en: string };
}

export const screenshotsData: ScreenshotItem[] = [
  {
    id: "screenshot-1",
    filename: "imageappdrpai (1).png",
    src: "/screenshots/imageappdrpai (1).png",
    category: "live",
    title: {
      th: "ระบบตรวจจับละอองเคมีเรียลไทม์ (YOLOv8 + ByteTrack)",
      en: "Real-Time AI Droplet Detection (YOLOv8 + ByteTrack)",
    },
    description: {
      th: "การตรวจจับหยดละอองผ่านกล้องจุลทรรศน์ USB พร้อมการติดแท็ก ID ติดตามข้ามเฟรม",
      en: "Real-time droplet detection over USB microscope camera feed with multi-object tracking IDs.",
    },
  },
  {
    id: "screenshot-2",
    filename: "imageappdrpai (2).png",
    src: "/screenshots/imageappdrpai (2).png",
    category: "analysis",
    title: {
      th: "รายงานสถิติการกระจายขนาดหยดละออง (WHO Standards)",
      en: "WHO Droplet Size Distribution Analytics",
    },
    description: {
      th: "การคำนวณค่า Dv0.1, Dv0.5 (VMD), Dv0.9 และค่า SPAN แบบเรียลไทม์",
      en: "Real-time calculation of Dv0.1, Dv0.5 (VMD), Dv0.9, and SPAN values per WHO specifications.",
    },
  },
  {
    id: "screenshot-3",
    filename: "imageappdrpai (3).png",
    src: "/screenshots/imageappdrpai (3).png",
    category: "live",
    title: {
      th: "การตั้งค่า ROI และการปรับเทียบเลนส์กล้องจุลทรรศน์",
      en: "ROI Selection & Microscope Calibration Interface",
    },
    description: {
      th: "กำหนดพื้นที่วิเคราะห์ (ROI) และตั้งค่าสเกลเลนส์ 4x / 10x (2.79e-7 m/px)",
      en: "Define region of interest (ROI) and calibrate lens magnification scale (2.79e-7 m/px).",
    },
  },
  {
    id: "screenshot-4",
    filename: "imageappdrpai (4).png",
    src: "/screenshots/imageappdrpai (4).png",
    category: "import",
    title: {
      th: "การนำเข้าไฟล์ภาพและวิดีโอออฟไลน์",
      en: "Offline Image & Video Import Processing",
    },
    description: {
      th: "ลากและวางไฟล์สื่อออฟไลน์เพื่อประมวลผลย้อนหลังด้วยความเร็วสูง",
      en: "Drag-and-drop offline media files for fast batch processing and droplet measurement.",
    },
  },
  {
    id: "screenshot-5",
    filename: "imageappdrpai (5).png",
    src: "/screenshots/imageappdrpai (5).png",
    category: "analysis",
    title: {
      th: "กราฟฮิสโตแกรมการกระจายตัวของขนาดหยดละออง",
      en: "Droplet Size Distribution Histogram & Cumulative Curve",
    },
    description: {
      th: "แสดงฮิสโตแกรมปริมาตรสะสมและการวิเคราะห์คุณภาพสเปรย์",
      en: "Interactive volumetric cumulative distribution curves and spray quality classification.",
    },
  },
  {
    id: "screenshot-6",
    filename: "imageappdrpai (6).png",
    src: "/screenshots/imageappdrpai (6).png",
    category: "export",
    title: {
      th: "การส่งออกรายงาน Excel และบันทึกโครงการ",
      en: "Excel Report Export & Project File Storage",
    },
    description: {
      th: "ส่งออกรายงาน Excel (OpenPyXL) และบันทึกไฟล์โครงการ .drop",
      en: "One-click export to formatted Excel workbooks (OpenPyXL) and .drop project zip archives.",
    },
  },
  {
    id: "screenshot-7",
    filename: "imageappdrpai (7).png",
    src: "/screenshots/imageappdrpai (7).png",
    category: "analysis",
    title: {
      th: "การจัดการบันทึกและระบบบันทึกอัตโนมัติ Workspace",
      en: "Session Logging & Auto-Save Workspace Settings",
    },
    description: {
      th: "บันทึกประวัติการทดลองอัตโนมัติพร้อมพารามิเตอร์การตั้งค่าหัวฉีด",
      en: "Automatic session logging with full audit trail and nozzle setup parameters.",
    },
  },
];
