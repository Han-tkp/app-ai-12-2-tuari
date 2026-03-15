import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Downloads } from "./components/Downloads";
import { Requirements } from "./components/Requirements";
import { Footer } from "./components/Footer";
import { useDetectOS, useGitHubRelease } from "./hooks";

export default function App() {
  const os = useDetectOS();
  const { release, loading, error } = useGitHubRelease();

  return (
    <div className="min-h-screen bg-white font-sans text-surface-900 antialiased">
      <Navbar />
      <Hero os={os} release={release} loading={loading} />
      <Features />
      <Downloads os={os} release={release} loading={loading} error={error} />
      <Requirements />
      <Footer />
    </div>
  );
}
