import { Download, ChevronDown, BookOpen } from "lucide-react";
import type { OS } from "../types";
import type { GitHubRelease } from "../types";
import { formatSize } from "../hooks";
import { useLanguage } from "../context/LanguageContext";

interface HeroProps {
  os: OS;
  release: GitHubRelease | null;
  loading: boolean;
}

function getHeroCTA(release: GitHubRelease | null, defaultLabel: string) {
  if (!release) {
    return { label: defaultLabel, sub: "Windows / Linux v1.2.2", url: "#download" };
  }

  const assets = release.assets;
  const exe = assets.find((a) => /\.exe$/i.test(a.name));

  return {
    label: defaultLabel,
    sub: exe ? `Windows x64 .exe (${formatSize(exe.size)})` : "Windows / Linux x64 Installer",
    url: exe?.browser_download_url || "#download",
  };
}

export function Hero({ os: _os, release, loading }: HeroProps) {
  const { t } = useLanguage();
  const cta = getHeroCTA(release, t('hero.btnDownload'));
  const disabled = loading;

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-16 pb-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
          {t('hero.badge')}
        </span>

        <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-surface-950 sm:text-6xl lg:text-7xl">
          DropDetect{" "}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="mt-3 text-xl font-bold text-brand-700 sm:text-2xl">
          {t('hero.title')}
        </p>

        <p className="mt-6 text-base leading-relaxed text-surface-700 sm:text-lg max-w-3xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={disabled ? "#download" : cta.url}
            className={`group inline-flex items-center gap-3 rounded-xl px-8 py-4 text-base font-semibold shadow-lg shadow-brand-500/25 transition-all ${
              disabled
                ? "cursor-default bg-surface-300 text-surface-500"
                : "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
            }`}
          >
            <Download className="h-5 w-5" />
            <span className="flex flex-col items-start leading-tight">
              <span>{loading ? "Loading..." : t('hero.btnDownload')}</span>
              <span className="text-xs font-normal opacity-80">{cta.sub}</span>
            </span>
          </a>

          <a
            href="#manual"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-6 py-4 text-sm font-semibold text-surface-700 shadow-sm transition-all hover:border-surface-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <BookOpen className="h-4 w-4 text-brand-600" />
            {t('hero.btnManual')}
          </a>
        </div>

        <p className="mt-6 text-xs text-surface-500">
          {t('hero.supportedPlatforms')}
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="mt-12 animate-bounce">
        <ChevronDown className="h-6 w-6 text-surface-300" />
      </div>
    </section>
  );
}
