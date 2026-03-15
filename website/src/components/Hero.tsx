import { Download, ChevronDown } from "lucide-react";
import type { OS } from "../types";
import type { GitHubRelease } from "../types";
import { formatSize } from "../hooks";

interface HeroProps {
  os: OS;
  release: GitHubRelease | null;
  loading: boolean;
}

function getHeroCTA(os: OS, release: GitHubRelease | null) {
  if (!release) {
    return { label: "Download", sub: "Loading...", url: "#download" };
  }

  const assets = release.assets;

  if (os === "windows") {
    const exe = assets.find((a) => /\.exe$/i.test(a.name));
    return {
      label: "Download for Windows",
      sub: exe ? `.exe installer (${formatSize(exe.size)})` : ".exe installer",
      url: exe?.browser_download_url || "#download",
    };
  }

  if (os === "linux") {
    const deb = assets.find((a) => /\.deb$/i.test(a.name));
    return {
      label: "Download for Linux",
      sub: deb ? `.deb package (${formatSize(deb.size)})` : ".deb package",
      url: deb?.browser_download_url || "#download",
    };
  }

  if (os === "macos") {
    return {
      label: "Not available for macOS",
      sub: "See supported platforms below",
      url: "#download",
    };
  }

  return { label: "Download", sub: "Choose your platform", url: "#download" };
}

export function Hero({ os, release, loading }: HeroProps) {
  const cta = getHeroCTA(os, release);
  const disabled = os === "macos" || loading;

  return (
    <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {release && (
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            {release.tag_name} Released
          </span>
        )}

        <h1 className="mt-2 text-5xl font-extrabold leading-tight tracking-tight text-surface-950 sm:text-6xl lg:text-7xl">
          DropDetect{" "}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            AI
          </span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-surface-700 sm:text-xl">
          Professional desktop application for{" "}
          <strong className="text-surface-900">real-time chemical spray droplet analysis</strong>{" "}
          per WHO standards. AI-powered detection, tracking, and reporting.
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
              <span>{loading ? "Loading..." : cta.label}</span>
              <span className="text-xs font-normal opacity-80">{cta.sub}</span>
            </span>
          </a>

          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-6 py-4 text-sm font-semibold text-surface-700 shadow-sm transition-all hover:border-surface-300 hover:shadow-md hover:-translate-y-0.5"
          >
            Learn More
            <ChevronDown className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 animate-bounce">
        <ChevronDown className="h-6 w-6 text-surface-300" />
      </div>
    </section>
  );
}
