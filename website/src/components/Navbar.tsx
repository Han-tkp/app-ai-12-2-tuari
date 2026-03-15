import { Droplet, Github } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 font-bold text-lg text-surface-900">
          <Droplet className="h-6 w-6 text-brand-500" />
          DropDetect AI
        </a>

        <div className="hidden items-center gap-8 sm:flex">
          <a href="#features" className="text-sm font-medium text-surface-700 hover:text-brand-600 transition-colors">
            Features
          </a>
          <a href="#download" className="text-sm font-medium text-surface-700 hover:text-brand-600 transition-colors">
            Download
          </a>
          <a href="#requirements" className="text-sm font-medium text-surface-700 hover:text-brand-600 transition-colors">
            Requirements
          </a>
          <a
            href="https://github.com/Han-tkp/app-ai-12-2-tuari"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-surface-700 hover:text-brand-600 transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
