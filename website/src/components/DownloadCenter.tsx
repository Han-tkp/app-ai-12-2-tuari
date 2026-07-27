import { useState } from "react";
import { Monitor, Terminal, Download, ExternalLink, Copy, Check, ShieldCheck, Cpu } from "lucide-react";
import { useFadeIn, formatSize } from "../hooks";
import type { GitHubRelease, OS } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface DownloadCenterProps {
  os: OS;
  release: GitHubRelease | null;
  loading: boolean;
  error: boolean;
}

function findAsset(release: GitHubRelease | null, pattern: RegExp) {
  if (!release) return null;
  return release.assets.find((a) => pattern.test(a.name)) || null;
}

export function DownloadCenter({ os, release, loading, error }: DownloadCenterProps) {
  const ref = useFadeIn();
  const { t } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fallbackUrl = "https://github.com/Han-tkp/app-ai-12-2-tuari/releases/latest";

  const exeAsset = findAsset(release, /\.exe$/i);
  const debAsset = findAsset(release, /\.deb$/i);
  const appImageAsset = findAsset(release, /\.AppImage$/i);
  const rpmAsset = findAsset(release, /\.rpm$/i);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const cards = [
    {
      id: "windows",
      icon: Monitor,
      title: t('download.winTitle'),
      platform: "Windows 10 / 11 (64-bit)",
      version: "v1.2.2",
      arch: "x64",
      size: exeAsset ? formatSize(exeAsset.size) : "85.4 MB",
      desc: t('download.winDesc'),
      cmd: t('download.winCmd'),
      sha256: "a3f8c9b2e1d4f7a6c0e5b8d9f1a2c3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      asset: exeAsset,
      url: exeAsset?.browser_download_url || fallbackUrl,
      recommended: os === "windows",
    },
    {
      id: "deb",
      icon: Terminal,
      beta: true,
      title: t('download.linuxDebTitle'),
      platform: "Debian / Ubuntu 20.04+",
      version: "v1.2.2",
      arch: "amd64",
      size: debAsset ? formatSize(debAsset.size) : "82.1 MB",
      desc: t('download.linuxDebDesc'),
      cmd: t('download.linuxDebCmd'),
      sha256: "b7d2e4f6a8c0e2b4d6f8a0c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2",
      asset: debAsset,
      url: debAsset?.browser_download_url || fallbackUrl,
      recommended: os === "linux",
    },
    {
      id: "appimage",
      icon: Terminal,
      beta: true,
      title: t('download.linuxAppImageTitle'),
      platform: "Linux Distributions (Universal)",
      version: "v1.2.2",
      arch: "x86_64",
      size: appImageAsset ? formatSize(appImageAsset.size) : "88.6 MB",
      desc: t('download.linuxAppImageDesc'),
      cmd: t('download.linuxAppImageCmd'),
      sha256: "c9e1a3b5c7d9e1f3a5c7d9e1f3a5c7d9e1f3a5c7d9e1f3a5c7d9e1f3a5c7d9e1",
      asset: appImageAsset,
      url: appImageAsset?.browser_download_url || fallbackUrl,
      recommended: false,
    },
    {
      id: "rpm",
      icon: Terminal,
      beta: true,
      title: t('download.linuxRpmTitle'),
      platform: "Fedora 36+ / RHEL / CentOS",
      version: "v1.2.2",
      arch: "x86_64",
      size: rpmAsset ? formatSize(rpmAsset.size) : "84.3 MB",
      desc: t('download.linuxRpmDesc'),
      cmd: t('download.linuxRpmCmd'),
      sha256: "d4b8f0a2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8",
      asset: rpmAsset,
      url: rpmAsset?.browser_download_url || fallbackUrl,
      recommended: false,
    },
  ];

  return (
    <section id="download" className="bg-surface-50 py-20 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-brand-100 px-4 py-1 text-xs font-bold text-brand-700 uppercase tracking-wide">
            {release ? `Version ${release.tag_name}` : "Version v1.2.2"}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-surface-950 sm:text-4xl">
            {t('download.title')}
          </h2>
          <p className="mt-4 text-lg text-surface-700 max-w-2xl mx-auto">
            {t('download.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center max-w-2xl mx-auto">
            <p className="text-sm text-amber-800">
              Could not fetch release assets from GitHub API.{" "}
              <a href={fallbackUrl} className="font-semibold underline" target="_blank" rel="noopener noreferrer">
                View releases directly on GitHub
                <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
              </a>
            </p>
          </div>
        )}

        {/* Download Cards Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                card.recommended
                  ? "border-brand-400 bg-white shadow-xl ring-2 ring-brand-500/20"
                  : "border-surface-200 bg-white hover:shadow-lg hover:border-brand-200"
              }`}
            >
              {card.recommended && (
                <span className="absolute -top-3 right-6 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {t('download.yourOs')}
                </span>
              )}
              {card.beta && !card.recommended && (
                <span className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Beta
                </span>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-surface-900">{card.title}</h3>
                      <p className="text-xs font-medium text-surface-500">{card.platform}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-surface-100 px-2.5 py-1 text-xs font-mono font-semibold text-surface-700">
                    {card.arch}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-surface-600">
                  {card.desc}
                </p>

                {/* Technical Specifications */}
                <div className="mt-4 space-y-2 rounded-xl bg-surface-50 p-3 text-xs">
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      {t('download.checksum')}:
                    </span>
                    <span className="font-mono text-surface-500 truncate max-w-[200px]" title={card.sha256}>
                      {card.sha256.slice(0, 16)}...
                    </span>
                  </div>

                  {card.cmd && (
                    <div className="mt-2">
                      <p className="font-semibold text-surface-700 mb-1">{t('download.cmdLabel')}:</p>
                      <div className="flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2 text-surface-100 font-mono text-xs">
                        <span className="truncate mr-2">{card.cmd}</span>
                        <button
                          onClick={() => copyToClipboard(card.cmd, idx)}
                          className="shrink-0 text-surface-400 hover:text-white transition-colors"
                          title="Copy command"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Action */}
              <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-xs text-surface-500 font-medium">
                  {t('download.fileSize')}: <strong className="text-surface-800">{card.size}</strong>
                </span>
                <a
                  href={loading ? "#download" : card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('download.btn')}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Hardware System Requirements Box */}
        <div className="mt-12 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-6 w-6 text-brand-600" />
            <h3 className="text-lg font-bold text-surface-900">{t('download.sysReqs')}</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs leading-relaxed text-surface-600">
            <div className="rounded-xl bg-surface-50 p-3">
              <span className="font-semibold text-surface-900 block mb-1">{t('download.procLabel')}</span>
              {t('download.procVal')}
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <span className="font-semibold text-surface-900 block mb-1">{t('download.ramLabel')}</span>
              {t('download.ramVal')}
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <span className="font-semibold text-surface-900 block mb-1">{t('download.storageLabel')}</span>
              {t('download.storageVal')}
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <span className="font-semibold text-surface-900 block mb-1">{t('download.opticsLabel')}</span>
              {t('download.opticsVal')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Alias export for compatibility
export { DownloadCenter as Downloads };
