import { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { DownloadCenter } from './components/DownloadCenter';
import { Requirements } from './components/Requirements';
import { Features } from './components/Features';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import { UserManual } from './components/UserManual';
import { useDetectOS, useGitHubRelease } from './hooks';
import { TabType } from './types';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const os = useDetectOS();
  const { release, loading, error } = useGitHubRelease();
  const { t: _ } = useLanguage();

  return (
    <div className="min-h-screen bg-white font-sans text-surface-900 antialiased flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Header with activeTab control & i18n switcher */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        {activeTab === 'home' && (
          <>
            <Hero os={os} release={release} loading={loading} />
            <Features />
            <DownloadCenter os={os} release={release} loading={loading} error={error} />
            <Requirements />
          </>
        )}

        {activeTab === 'downloads' && (
          <div className="py-8">
            <DownloadCenter os={os} release={release} loading={loading} error={error} />
            <Requirements />
          </div>
        )}

        {activeTab === 'gallery' && (
          <ShowcaseGallery />
        )}

        {activeTab === 'manual' && (
          <UserManual />
        )}
      </main>

      {/* Footer */}
      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainLayout />
    </LanguageProvider>
  );
}
