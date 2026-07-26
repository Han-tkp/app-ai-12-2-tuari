import { Microscope, Zap, BarChart3, FileSpreadsheet } from "lucide-react";
import { useFadeIn } from "../hooks";
import { useLanguage } from "../context/LanguageContext";

export function Features() {
  const ref = useFadeIn();
  const { t } = useLanguage();

  const features = [
    {
      icon: Microscope,
      title: t('features.aiTitle'),
      desc: t('features.aiDesc'),
    },
    {
      icon: Zap,
      title: t('features.trackingTitle'),
      desc: t('features.trackingDesc'),
    },
    {
      icon: BarChart3,
      title: t('features.whoTitle'),
      desc: t('features.whoDesc'),
    },
    {
      icon: FileSpreadsheet,
      title: t('features.excelTitle'),
      desc: t('features.excelDesc'),
    },
  ];

  return (
    <section id="features" className="bg-white py-20 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-950 sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mt-4 text-lg text-surface-700">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-surface-200 bg-surface-50 p-6 transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
