import { Droplet, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-950 py-12 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          <Droplet className="h-5 w-5 text-brand-400" />
          <span className="font-semibold">DropDetect AI</span>
        </div>

        <p className="text-sm text-surface-300">
          &copy; {new Date().getFullYear()} DropDetect AI. All rights reserved.
        </p>

        <a
          href="https://github.com/Han-tkp/app-ai-12-2-tuari"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-surface-300 transition-colors hover:text-white"
        >
          <Github className="h-4 w-4" />
          Source Code
        </a>
      </div>
    </footer>
  );
}
