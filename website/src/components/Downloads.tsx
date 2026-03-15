import { Monitor, Terminal, Apple, Download, ExternalLink } from "lucide-react";
import { useFadeIn, formatSize } from "../hooks";
import type { GitHubRelease, OS } from "../types";

interface DownloadsProps {
  os: OS;
  release: GitHubRelease | null;
  loading: boolean;
  error: boolean;
}

function findAsset(release: GitHubRelease | null, pattern: RegExp) {
  if (!release) return null;
  return release.assets.find((a) => pattern.test(a.name)) || null;
}

export function Downloads({ os, release, loading, error }: DownloadsProps) {
  const ref = useFadeIn();

  const exe = findAsset(release, /\.exe$/i);
  const msi = findAsset(release, /\.msi$/i);
  const deb = findAsset(release, /\.deb$/i);
  const appimage = findAsset(release, /\.appimage$/i);

  const fallbackUrl = "https://github.com/Han-tkp/app-ai-12-2-tuari/releases/latest";

  const platforms = [
    {
      id: "windows" as const,
      icon: Monitor,
      name: "Windows",
      supported: true,
      links: [
        { label: "Download .exe", format: "NSIS Installer", asset: exe },
        { label: "Download .msi", format: "MSI Installer", asset: msi },
      ],
    },
    {
      id: "linux" as const,
      icon: Terminal,
      name: "Linux",
      supported: true,
      links: [
        { label: "Download .deb", format: "Debian Package", asset: deb },
        { label: "Download .AppImage", format: "AppImage", asset: appimage },
      ],
    },
    {
      id: "macos" as const,
      icon: Apple,
      name: "macOS",
      supported: false,
      links: [],
    },
  ];

  return (
    <section id="download" className="bg-surface-50 py-24 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-950 sm:text-4xl">Download</h2>
          <p className="mt-4 text-lg text-surface-700">
            {release
              ? `Latest release: ${release.tag_name}`
              : loading
                ? "Fetching latest release..."
                : "Choose your platform"}
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-800">
              Could not fetch release info.{" "}
              <a href={fallbackUrl} className="font-semibold underline" target="_blank" rel="noopener noreferrer">
                View releases on GitHub
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {platforms.map((p) => {
            const isDetected = p.id === os;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  isDetected
                    ? "border-brand-300 bg-white shadow-lg ring-2 ring-brand-500/20"
                    : "border-surface-200 bg-white hover:shadow-md"
                }`}
              >
                {isDetected && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Your OS
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <p.icon className={`h-8 w-8 ${p.supported ? "text-brand-600" : "text-surface-300"}`} />
                  <h3 className="text-xl font-bold text-surface-900">{p.name}</h3>
                </div>

                {p.supported ? (
                  <div className="mt-6 space-y-3">
                    {p.links.map((link) => (
                      <a
                        key={link.format}
                        href={link.asset?.browser_download_url || fallbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-surface-200 px-4 py-3 text-sm transition-all hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-brand-500" />
                          <span>
                            <span className="font-medium text-surface-900">{link.label}</span>
                            <br />
                            <span className="text-xs text-surface-500">
                              {link.format}
                              {link.asset ? ` (${formatSize(link.asset.size)})` : ""}
                            </span>
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-surface-100 p-4 text-center">
                    <p className="text-sm font-medium text-surface-500">Not supported</p>
                    <p className="mt-1 text-xs text-surface-400">
                      macOS is not currently supported
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
