import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TabType } from '../types';
import { Github, Monitor, Camera, ShieldCheck, FileText } from 'lucide-react';

interface FooterProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();

  const handleTabClick = (tab: TabType) => {
    if (setActiveTab) {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-surface-950 text-surface-300 border-t border-surface-800 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-surface-800/80">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-900 border border-surface-700">
                <img src="/icon.png" alt="DropDetect AI" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">DropDetect AI</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-brand-900/60 text-brand-400 border border-brand-700/50">
                v1.2.2
              </span>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>WHO Chemical Spray Audit Compliant (VMD Dv0.5 & SPAN)</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-200">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleTabClick('home')}
                  className="hover:text-white transition-colors cursor-pointer text-surface-400 hover:text-surface-200"
                >
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('downloads')}
                  className="hover:text-white transition-colors cursor-pointer text-surface-400 hover:text-surface-200"
                >
                  {t('nav.downloads')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('gallery')}
                  className="hover:text-white transition-colors cursor-pointer text-surface-400 hover:text-surface-200"
                >
                  {t('nav.gallery')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('manual')}
                  className="hover:text-white transition-colors cursor-pointer text-surface-400 hover:text-surface-200"
                >
                  {t('nav.manual')}
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Platforms & Optics */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-200">
              {t('footer.platforms')}
            </h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Windows 10 / 11 (64-bit NSIS Setup)</span>
              </li>
              <li className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Linux (.deb / AppImage / .rpm)</span>
              </li>
              <li className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{t('footer.microscope')}</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                <span>OpenPyXL Excel & .drop Project File Export</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-400">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-6">
            <span>{t('footer.developedFor')}</span>
            <a
              href="https://github.com/Han-tkp/app-ai-12-2-tuari"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-surface-300 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
