import { Microscope, Zap, BarChart3, FileSpreadsheet } from "lucide-react";
import { useFadeIn } from "../hooks";

const features = [
  {
    icon: Microscope,
    title: "AI Droplet Detection",
    desc: "YOLOv8 neural network detects and measures spray droplets in real-time from microscope camera feeds at up to 30 FPS.",
  },
  {
    icon: Zap,
    title: "Real-Time Tracking",
    desc: "ByteTrack multi-object tracking assigns persistent IDs across frames, preventing duplicate counting for accurate statistics.",
  },
  {
    icon: BarChart3,
    title: "WHO Statistics",
    desc: "Volume-weighted analysis: Dv0.1, Dv0.5 (VMD), Dv0.9, SPAN, and spray quality classification per WHO guidelines.",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Reports",
    desc: "One-click export to Excel with full session data, statistics, calibration info, and annotated slide snapshots.",
  },
];

export function Features() {
  const ref = useFadeIn();

  return (
    <section id="features" className="bg-white py-24 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-950 sm:text-4xl">
            Powerful Analysis Tools
          </h2>
          <p className="mt-4 text-lg text-surface-700">
            Everything you need for professional spray droplet analysis
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-surface-200 bg-surface-50 p-6 transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
