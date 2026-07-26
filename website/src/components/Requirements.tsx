import { Cpu, HardDrive, MonitorCheck, Usb } from "lucide-react";
import { useFadeIn } from "../hooks";
import { useLanguage } from "../context/LanguageContext";

export function Requirements() {
  const ref = useFadeIn();
  const { t } = useLanguage();

  const reqs = [
    { icon: Cpu, label: t('requirements.cpuLabel'), value: t('requirements.cpuVal') },
    { icon: HardDrive, label: t('requirements.ramLabel'), value: t('requirements.ramVal') },
    { icon: MonitorCheck, label: t('requirements.osLabel'), value: t('requirements.osVal') },
    { icon: Usb, label: t('requirements.cameraLabel'), value: t('requirements.cameraVal') },
  ];

  return (
    <section id="requirements" className="bg-white py-20 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-950 sm:text-4xl">
            {t('requirements.title')}
          </h2>
          <p className="mt-4 text-lg text-surface-700">
            {t('requirements.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reqs.map((r, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-xl border border-surface-200 bg-surface-50 p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <r.icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-surface-900">{r.label}</p>
                <p className="text-sm text-surface-600 mt-1">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
