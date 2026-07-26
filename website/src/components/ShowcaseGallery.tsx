import { useState } from "react";
import { screenshotsData } from "../data/screenshots";
import { LightboxModal } from "./LightboxModal";
import { useLanguage } from "../context/LanguageContext";
import { ZoomIn, Filter } from "lucide-react";

export function ShowcaseGallery() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const categories = [
    { id: "all", label: t('gallery.all') },
    { id: "live", label: t('gallery.live') },
    { id: "analysis", label: t('gallery.analysis') },
    { id: "import", label: t('gallery.import') },
    { id: "export", label: t('gallery.export') },
  ];

  const filteredScreenshots = screenshotsData.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : filteredScreenshots.length - 1));
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! < filteredScreenshots.length - 1 ? prev! + 1 : 0));
  };

  return (
    <section id="gallery" className="py-16 max-w-7xl mx-auto px-4">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-surface-950 sm:text-4xl">
          {t('gallery.title')}
        </h1>
        <p className="mt-4 text-lg text-surface-700 max-w-2xl mx-auto">
          {t('gallery.subtitle')}
        </p>

        {/* Category Filters */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Filter className="h-4 w-4 text-surface-400 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "bg-surface-100 text-surface-700 hover:bg-surface-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot Cards Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredScreenshots.map((item, idx) => {
          const title = item.title[language] || item.title.en;
          const desc = item.description[language] || item.description.en;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(idx)}
              className="group cursor-pointer rounded-2xl border border-surface-200 bg-white overflow-hidden shadow-sm transition-all hover:border-brand-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] bg-surface-900 overflow-hidden">
                <img
                  src={item.src}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-950/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                  <span className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-bold text-brand-900 shadow-lg">
                    <ZoomIn className="h-4 w-4" />
                    {t('gallery.preview')}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-surface-600 line-clamp-2">
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <LightboxModal
          item={filteredScreenshots[selectedIndex] || null}
          onClose={() => setSelectedIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </section>
  );
}
