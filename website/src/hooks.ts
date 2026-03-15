import { useState, useEffect, useRef, type RefObject } from "react";
import type { GitHubRelease, OS } from "./types";

const GITHUB_REPO = "Han-tkp/app-ai-12-2-tuari";
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export function useDetectOS(): OS {
  const [os, setOs] = useState<OS>("unknown");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator.platform || "").toLowerCase();

    if (ua.includes("win") || platform.includes("win")) {
      setOs("windows");
    } else if (ua.includes("linux") || platform.includes("linux")) {
      setOs("linux");
    } else if (
      ua.includes("mac") ||
      platform.includes("mac") ||
      ua.includes("iphone") ||
      ua.includes("ipad")
    ) {
      setOs("macos");
    }
  }, []);

  return os;
}

export function useGitHubRelease() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: GitHubRelease) => {
        setRelease(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return { release, loading, error };
}

export function useFadeIn(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
