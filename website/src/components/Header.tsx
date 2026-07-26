import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TabType } from '../types';
import { Globe, Menu, X, BookOpen, Download, Image as ImageIcon, Home, Github } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navItems: { id: TabType; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'home', labelKey: 'nav.home', icon: <Home className="w-4 h-4" /> },
    { id: 'downloads', labelKey: 'nav.downloads', icon: <Download className="w-4 h-4" /> },
    { id: 'gallery', labelKey: 'nav.gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'manual', labelKey: 'nav.manual', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-200/80 bg-white/90 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <button 
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 text-left group transition-transform active:scale-98 cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 shadow-xs group-hover:border-brand-400 transition-colors">
            <img src="/icon.png" alt="DropDetect AI Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-surface-900 tracking-tight group-hover:text-brand-600 transition-colors">
                DropDetect AI
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                v1.2.2
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-surface-500 font-medium tracking-wide">
              {t('header.tagline')}
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-100/80 p-1 rounded-xl border border-surface-200/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-brand-600 shadow-xs font-semibold'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/50'
                }`}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: GitHub & Language Switcher & Mobile Menu Button */}
        <div className="flex items-center gap-2.5">
          {/* GitHub link */}
          <a
            href="https://github.com/Han-tkp/app-ai-12-2-tuari"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-700 hover:text-brand-600 bg-surface-100 hover:bg-surface-200/80 rounded-lg transition-colors border border-surface-200/60"
            title="GitHub Repository"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {/* Language Switch Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-surface-900 uppercase tracking-wider">{language}</span>
            <span className="text-[10px] text-surface-400 font-normal">| {language === 'th' ? 'EN' : 'TH'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden relative z-50 border-t border-surface-200 bg-white px-4 pt-3 pb-5 shadow-lg space-y-2">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 font-semibold'
                        : 'text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    {item.icon}
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-surface-100 flex items-center justify-between">
              <a
                href="https://github.com/Han-tkp/app-ai-12-2-tuari"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium text-surface-600 hover:text-brand-600"
              >
                <Github className="w-4 h-4" />
                <span>{t('nav.github')}</span>
              </a>
              <span className="text-xs text-surface-400">DropDetect AI v1.2.2</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
