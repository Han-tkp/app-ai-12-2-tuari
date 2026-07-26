export type Language = 'th' | 'en';

export type TabType = 'home' | 'downloads' | 'gallery' | 'manual';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

export type OS = "windows" | "linux" | "macos" | "unknown";

export interface DownloadLink {
  label: string;
  url: string;
  size: number;
  format: string;
}
