import { Cpu, HardDrive, MonitorCheck, Usb } from "lucide-react";
import { useFadeIn } from "../hooks";

const reqs = [
  { icon: Cpu, label: "Processor", value: "Intel i5 / AMD Ryzen 5 or better" },
  { icon: HardDrive, label: "RAM", value: "8 GB minimum" },
  { icon: MonitorCheck, label: "OS", value: "Windows 10+ / Ubuntu 20.04+" },
  { icon: Usb, label: "Camera", value: "USB microscope camera (optional)" },
];

export function Requirements() {
  const ref = useFadeIn();

  return (
    <section id="requirements" className="bg-white py-24 px-6">
      <div ref={ref} className="fade-up mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-950 sm:text-4xl">
            System Requirements
          </h2>
          <p className="mt-4 text-lg text-surface-700">
            Minimum specifications for running DropDetect AI
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reqs.map((r) => (
            <div
              key={r.label}
              className="flex items-start gap-4 rounded-xl border border-surface-200 bg-surface-50 p-5"
            >
              <r.icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-500" />
              <div>
                <p className="font-semibold text-surface-900">{r.label}</p>
                <p className="text-sm text-surface-600">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
