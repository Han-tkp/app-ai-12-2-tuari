import { useEffect } from "react";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import type { ScreenshotItem } from "../data/screenshots";
import { useLanguage } from "../context/LanguageContext";

interface LightboxModalProps {
  item: ScreenshotItem | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function LightboxModal({ item, onClose, onPrev, onNext }: LightboxModalProps) {
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  const title = item.title[language] || item.title.en;
  const description = item.description[language] || item.description.en;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-5xl w-full bg-surface-900 rounded-2xl overflow-hidden shadow-2xl border border-surface-700 flex flex-col max-h-[90vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800 bg-surface-950/80">
          <div className="flex items-center gap-2 text-brand-400">
            <ZoomIn className="h-5 w-5" />
            <h3 className="text-base font-semibold text-white truncate max-w-md">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
            title={t('gallery.closeModal')}
            aria-label={t('gallery.closeModal')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Image Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[350px]">
          <img
            src={item.src}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain p-2"
          />

          {/* Navigation Controls */}
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-surface-900/80 p-3 text-white hover:bg-brand-600 transition-colors shadow-lg"
            title={t('gallery.prevImage')}
            aria-label={t('gallery.prevImage')}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-surface-900/80 p-3 text-white hover:bg-brand-600 transition-colors shadow-lg"
            title={t('gallery.nextImage')}
            aria-label={t('gallery.nextImage')}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Bottom Details */}
        <div className="px-6 py-4 bg-surface-950 border-t border-surface-800 text-surface-300 text-sm">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}
