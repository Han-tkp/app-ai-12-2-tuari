# การวิเคราะห์ไฟล์รายไฟล์ของโปรเจกต์ DropDetect (Detailed File Analysis)

เอกสารนี้แสดงรายละเอียดโครงสร้างไฟล์ทั้งหมดในโปรเจกต์ โดยอธิบายหน้าที่และตรรกะ (Logic) ของแต่ละไฟล์เพื่อความแม่นยำในการ Migrate โค้ด

---

## 1. ส่วนควบคุมแอปพลิเคชัน (Startup & Configuration)

*   **[DropDetect.csproj](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/DropDetect.csproj)**: ไฟล์กำหนดค่าโปรเจกต์ .NET 8, รายการ NuGet Packages (Avalonia, OpenCV, ONNX Runtime) และการตั้งค่า Assembly
*   **[Program.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Program.cs)**: จุดเริ่มต้นของโปรแกรม (Entry Point) ทำหน้าที่ตั้งค่า AppBuilder ของ Avalonia และเริ่มรัน Application Lifetime
*   **[App.axaml](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/App.axaml)**: ไฟล์ XAML ระดับ Global สำหรับประกาศ Styles, Themes (Dark/Light) และ Resources (Fonts/Colors)
*   **[App.axaml.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/App.axaml.cs)**: โค้ดเบื้องหลังของ Application ทำหน้าที่ทำ **Dependency Injection (DI)** ลงทะเบียน Service ทั้งหมด และกำหนดหน้าต่างหลัก ([MainWindow](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/MainWindow.axaml.cs#9-446))
*   **[app.manifest](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/app.manifest)**: กำหนดสิทธิ์การทำงานบน Windows (เช่น DPI Awareness, Compatibility)

---

## 2. ชั้นบริหารจัดการข้อมูล (Service Layer)

*   **[AnalysisService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/AnalysisService.cs)**: คำนวณสถิติละอองตามมาตรฐาน WHO (VMD, Span) และการจัดการ Interpolation ของค่าเปอร์เซ็นต์ไทล์
*   **[VisionService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/VisionService.cs)**: จัดการ Pipeline ของภาพจากกล้อง, ระบบ Dual-Loop (UI และ AI), Centroid Tracking และการวาดภาพทับ (Image Overlay)
*   **[InferenceService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/InferenceService.cs)**: จัดการโมเดล AI (ONNX) ทั้งการรัน Inference, NMS และการทำ Pre-processing ภาพให้อยู่ในรูปแบบ Tensor
*   **[AppStateManager.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/AppStateManager.cs)**: จัดการการบันทึกและโหลดค่า Settings ของแอปพลิเคชันลงในไฟล์ JSON
*   **[AutoSaveService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/AutoSaveService.cs)**: ระบบสำรองข้อมูลอัตโนมัติ เพื่อกู้คืนสถานะโครงการหากโปรแกรมปิดตัวลงกะทันหัน
*   **[CalibrationService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/CalibrationService.cs)**: เก็บค่าอัตราส่วนการแปลง Pixel เป็น µm ตามกำลังขยายของเลนส์
*   **[ProjectManagerService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/ProjectManagerService.cs)**: ควบคุมการสร้าง/โหลด/เซฟ ไฟล์โปรเจกต์รวมของโครงการ
*   **[HardwareDetector.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/HardwareDetector.cs)**: ตรวจสอบสเปคเครื่อง (RAM/GPU) เพื่อเลือก Profile ความลื่นไหลที่เหมาะสม
*   **[ExcelExportService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/ExcelExportService.cs)**: สร้างรายงานในรูปแบบไฟล์ Excel โดยใช้ไลบรารี ClosedXML
*   **[GCConfigurator.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/GCConfigurator.cs)**: ควบคุมการทำงานของ Garbage Collector เพื่อลดการกระตุก (Pause) ขณะรัน AI
*   **[LocalizationService.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/LocalizationService.cs)**: (ถ้ามี) สำหรับจัดการการสลับภาษา และข้อความในหน้า UI
*   **[PerformanceMonitor.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Services/PerformanceMonitor.cs)**: วัดความเร็วในการทำงาน (FPS/Inference Time) เพื่อใช้ในการปรับลด Profile อัตโนมัติ

---

## 3. ส่วนควบคุมมุมมอง (ViewModels - UI Logic)

*   **[MainWindowViewModel.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/ViewModels/MainWindowViewModel.cs)**: ไฟล์หลักที่คุม Logic ของหน้าจอทั้งหมด เชื่อมโยงระว่าง View และ Services ผ่านคำสั่ง (Commands) และสถานะ (Properties)
*   **[ManualAnnotationItem.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/ViewModels/ManualAnnotationItem.cs)**: Model-like ViewModel สำหรับการวาดรูปทรงด้วยมือ (Line, Circle, Rect) เก็บพิกัดและข้อมูลขนาดของแต่ละรูปทรงที่วาด
*   **[SlideItemViewModel.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/ViewModels/SlideItemViewModel.cs)**: เก็บสถานะของแต่ละ "Batch" หรือ "Snapshot" ของการวิเคราะห์ (ชื่อสไลด์, จำนวนละอองที่นับได้, สถานะความสำเร็จ)

---

## 4. โครงสร้างข้อมูล (Models)

*   **[DropDetectConfig.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Models/DropDetectConfig.cs)**: โครงสร้างการตั้งค่าโปรไฟล์ฮาร์ดแวร์ (Resolution, FPS, Interval)
*   **[HardwareProfile.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Models/HardwareProfile.cs)**: Enum ระบุระดับเครื่อง (Low, Mid, High)
*   **[CameraDevice.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Models/CameraDevice.cs)**: ข้อมูลพื้นฐานของกล้องที่ตรวจจับเจอในระบบ
*   **[InteractionState.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Models/InteractionState.cs)**: Enum สถานะการโต้ตอบของผู้ใช้ (Idle, Panning, Drawing)
*   **[DrawingToolType.cs](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/Models/DrawingToolType.cs)**: Enum ชนิดของเครื่องมือวาด (Line, Ellipse, Rectangle)

---

## 5. ส่วนแสดงผล (Views - XAML)

*   **[MainWindow.axaml](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/MainWindow.axaml)**: ออกแบบหน้าจอหลัก ทั้งแถบเครื่องมือด้านข้าง, หน้าจอแสดงผลกล้องขนาดใหญ่ และแผงสถิติด้านล่าง
*   **[SettingsWindow.axaml](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/SettingsWindow.axaml)**: หน้าจอตั้งค่าการทำงาน ระบบ AI, การแสดงผล, และการเลือกระดับฮาร์ดแวร์

---

## 6. ไฟล์สนับสนุนอื่นๆ (System & Assets)

*   **[clean_build.bat](file:///c:/Users/h4n/Desktop/app-new12-2/DropDetect/clean_build.bat)**: สคริปต์สำหรับล้าง Cache และสร้างโปรเจกต์ใหม่แบบสะอาด (Force Rebuild)
*   **`Assets/`**: โฟลเดอร์เก็บ Icon แพลตฟอร์ม และ Fonts (Google Sans, TH Sarabun New)
*   **`fileonnx/`**: โฟลเดอร์เก็บไฟล์น้ำหนัก AI (.onnx) ทั้งความละเอียด 4x และ 10x 
