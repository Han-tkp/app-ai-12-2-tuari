import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  Download,
  Microscope,
  Cpu,
  FolderOpen,
  FileSpreadsheet,
  BookOpen,
  CheckCircle2,
  Terminal,
  Layers,
  Settings
} from "lucide-react";

export function UserManual() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("installation");

  const sections = [
    {
      id: "installation",
      navLabel: t('manual.installGuide'),
      icon: Download,
      title: t('manual.sec1.title'),
      subtitle: t('manual.sec1.subtitle'),
      content: (
        <div className="space-y-6 text-surface-700 leading-relaxed">
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-5">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-brand-600" />
              {t('manual.sec1.winTitle')}
            </h3>
            <p className="mt-2 text-sm space-y-1">
              <span>{t('manual.sec1.winStep1')}</span><br />
              <span>{t('manual.sec1.winStep2')}</span><br />
              <span>{t('manual.sec1.winStep3')}</span><br />
              <span>{t('manual.sec1.winStep4')}</span>
            </p>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-5">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5 text-brand-600" />
              {t('manual.sec1.debTitle')}
            </h3>
            <p className="mt-2 text-sm mb-2">
              {t('manual.sec1.debDesc')}
            </p>
            <div className="rounded-lg bg-surface-900 px-4 py-3 font-mono text-xs text-brand-300">
              sudo dpkg -i dropdetect-ai_1.2.2_amd64.deb
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-5">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5 text-brand-600" />
              {t('manual.sec1.appImageTitle')}
            </h3>
            <p className="mt-2 text-sm mb-2">
              {t('manual.sec1.appImageDesc')}
            </p>
            <div className="rounded-lg bg-surface-900 px-4 py-3 font-mono text-xs text-brand-300">
              chmod +x DropDetect_AI-1.2.2-x86_64.AppImage && ./DropDetect_AI-1.2.2-x86_64.AppImage
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-5">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5 text-brand-600" />
              {t('manual.sec1.rpmTitle')}
            </h3>
            <p className="mt-2 text-sm mb-2">
              {t('manual.sec1.rpmDesc')}
            </p>
            <div className="rounded-lg bg-surface-900 px-4 py-3 font-mono text-xs text-brand-300">
              sudo dnf install dropdetect-ai-1.2.2-1.x86_64.rpm
            </div>
          </div>
        </div>
      )
    },
    {
      id: "microscope",
      navLabel: t('manual.microscopeGuide'),
      icon: Microscope,
      title: t('manual.sec2.title'),
      subtitle: t('manual.sec2.subtitle'),
      content: (
        <div className="space-y-6 text-surface-700 leading-relaxed">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Microscope className="h-5 w-5 text-brand-600" />
              {t('manual.sec2.lensTitle')}
            </h3>
            <ul className="mt-3 space-y-2 text-sm list-disc pl-5">
              <li>{t('manual.sec2.lensItem1')}</li>
              <li>{t('manual.sec2.lensItem2')}</li>
              <li>{t('manual.sec2.lensItem3')}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-600" />
              {t('manual.sec2.scaleTitle')}
            </h3>
            <p className="mt-2 text-sm">
              - {t('manual.sec2.scaleDesc1')}<br />
              - {t('manual.sec2.scaleDesc2')}
            </p>
          </div>
        </div>
      )
    },
    {
      id: "live_ai",
      navLabel: t('manual.liveAIGuide'),
      icon: Cpu,
      title: t('manual.sec3.title'),
      subtitle: t('manual.sec3.subtitle'),
      content: (
        <div className="space-y-6 text-surface-700 leading-relaxed">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-600" />
              {t('manual.sec3.yoloTitle')}
            </h3>
            <p className="mt-2 text-sm">
              {t('manual.sec3.yoloDesc')}
            </p>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600" />
              {t('manual.sec3.whoTitle')}
            </h3>
            <p className="mt-2 text-sm space-y-1">
              - {t('manual.sec3.whoDv05')}<br />
              - {t('manual.sec3.whoDv0109')}<br />
              - {t('manual.sec3.whoSpan')}
            </p>
          </div>
        </div>
      )
    },
    {
      id: "import",
      navLabel: t('manual.importGuide'),
      icon: FolderOpen,
      title: t('manual.sec4.title'),
      subtitle: t('manual.sec4.subtitle'),
      content: (
        <div className="space-y-6 text-surface-700 leading-relaxed">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-brand-600" />
              {t('manual.sec4.importTitle')}
            </h3>
            <p className="mt-2 text-sm">
              {t('manual.sec4.importDesc')}
            </p>
          </div>
        </div>
      )
    },
    {
      id: "excel",
      navLabel: t('manual.excelGuide'),
      icon: FileSpreadsheet,
      title: t('manual.sec5.title'),
      subtitle: t('manual.sec5.subtitle'),
      content: (
        <div className="space-y-6 text-surface-700 leading-relaxed">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-600" />
              {t('manual.sec5.excelTitle')}
            </h3>
            <p className="mt-2 text-sm">
              {t('manual.sec5.excelDesc')}
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find((s) => s.id === activeTab) || sections[0];

  return (
    <section id="manual" className="py-16 max-w-7xl mx-auto px-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1 text-xs font-bold text-brand-700">
          <BookOpen className="h-3.5 w-3.5" />
          {t('manual.badge')}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-surface-950 sm:text-4xl">
          {t('manual.title')}
        </h1>
        <p className="mt-4 text-lg text-surface-700 max-w-2xl mx-auto">
          {t('manual.subtitle')}
        </p>
      </div>

      {/* Manual Layout: Sidebar Sub-navigation + Content */}
      <div className="mt-12 grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-surface-400 px-3 mb-2">
            {t('manual.menuTitle')}
          </p>
          {sections.map((sec) => {
            const isActive = sec.id === activeTab;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "bg-surface-50 text-surface-700 hover:bg-surface-100 hover:text-surface-900"
                }`}
              >
                <sec.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-brand-600"}`} />
                <span className="truncate">{sec.navLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Active Section Content */}
        <div className="lg:col-span-3 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm">
          <div className="border-b border-surface-100 pb-6 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wide">
              <CheckCircle2 className="h-4 w-4" /> {t('manual.activeSection')}
            </span>
            <h2 className="text-2xl font-bold text-surface-900 mt-2">{currentSection.title}</h2>
            <p className="text-sm text-surface-600 mt-1">{currentSection.subtitle}</p>
          </div>

          {currentSection.content}
        </div>
      </div>
    </section>
  );
}

