import { useState, useEffect } from "react";

const SHELLS = [
  {
    id: "classic",
    name: "Windows Classic",
    tag: "แนะนำ",
    desc: "Titlebar บาง, ปุ่มขวา, title กึ่งกลาง — รู้สึกเหมือน tool จริง",
    detail: "ผู้ใช้ lab ส่วนใหญ่คุ้น Windows — ไม่ต้องเรียนรู้ใหม่",
    best: ["ผู้ใช้ทั่วไป", "Lab ที่มี monitor หลายขนาด"],
  },
  {
    id: "frameless",
    name: "Minimal Frameless",
    tag: null,
    desc: "ไม่มี titlebar แยก, ปุ่ม overlay เบาๆ — viewport ใหญ่ขึ้น",
    detail: "Viewport กล้องได้พื้นที่มากขึ้น เหมาะถ้าจอ 24\" ขึ้นไป",
    best: ["จอ 24\"+ เฉพาะทาง", "ต้องการ viewport สูงสุด"],
  },
];

const THEMES = [
  {
    id: "zinc-dark",
    name: "Zinc Dark",
    tag: "แนะนำ",
    colors: ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a", "#2563eb"],
    desc: "เย็น neutral ไม่มีน้ำตาล ตัดสีน้ำเงิน accent ชัด",
    traits: ["จอสว่างน้อย", "ใช้งานยาว", "ดูเป็น tool จริงๆ"],
    bg: "#18181b",
    fg: "#fafafa",
    accent: "#2563eb",
    surface: "#27272a",
    border: "#3f3f46",
    muted: "#71717a",
  },
  {
    id: "slate-mid",
    name: "Slate Mid",
    tag: "ใหม่",
    colors: ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#3b82f6"],
    desc: "โทนน้ำเงิน-เทา ดูนุ่มกว่า Zinc เหมาะห้องแสงสลัวปานกลาง",
    traits: ["แล็บกลางวัน", "friendly", "น้ำเงินอุ่น"],
    bg: "#1e293b",
    fg: "#f1f5f9",
    accent: "#3b82f6",
    surface: "#334155",
    border: "#475569",
    muted: "#94a3b8",
  },
  {
    id: "stone-light",
    name: "Stone Light",
    tag: null,
    colors: ["#fafaf9", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#1e3a5f"],
    desc: "ขาวอมเทา ไม่ขาวจ้าเกินไป เหมาะพิมพ์รายงานหรือห้องสว่างมาก",
    traits: ["ห้องสว่าง", "export/print", "อ่านตัวเลขชัด"],
    bg: "#fafaf9",
    fg: "#1c1917",
    accent: "#1e3a5f",
    surface: "#f5f5f4",
    border: "#d6d3d1",
    muted: "#78716c",
  },
];

const PRESETS = [
  {
    id: "lab",
    name: "Lab Workstation",
    subtitle: "จอ 24\"+ เฉพาะทาง",
    shell: "frameless",
    theme: "zinc-dark",
    icon: "🔬",
    reason: "Viewport กล้องใหญ่สุด ไม่มีสิ่งรบกวน",
  },
  {
    id: "field",
    name: "Laptop ภาคสนาม",
    subtitle: "พกไปใช้หน้างาน",
    shell: "classic",
    theme: "slate-mid",
    icon: "💻",
    reason: "Familiar ใช้งานกลางแจ้งได้ ไม่มืดเกินไป",
  },
  {
    id: "report",
    name: "รายงาน / ส่งออก",
    subtitle: "อ่านตัวเลข พิมพ์ง่าย",
    shell: "classic",
    theme: "stone-light",
    icon: "📊",
    reason: "อ่านตัวเลขชัด พิมพ์ได้ง่าย ไม่เสียสี",
  },
  {
    id: "daily",
    name: "ใช้มานทั้งวัน",
    subtitle: "ลดอาการเมื่อยตา",
    shell: "classic",
    theme: "zinc-dark",
    icon: "🌙",
    reason: "ธีมใดก็ได้ แต่หลีกเลี่ยง pure black — Zinc Dark ดีกว่า",
  },
];

// Tiny window chrome preview
function WindowPreview({ shell, theme, small }) {
  const t = THEMES.find((x) => x.id === theme) || THEMES[0];
  const h = small ? 120 : 180;
  const barH = shell === "classic" ? 28 : 0;

  return (
    <div
      style={{
        width: "100%",
        height: h,
        background: t.bg,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${t.border}`,
        position: "relative",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Title bar */}
      {shell === "classic" ? (
        <div
          style={{
            height: barH,
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
          }}
        >
          <span style={{ color: t.muted, fontSize: 10, letterSpacing: 0.5 }}>
            DropDetect AI — Untitled Project
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {["─", "□", "✕"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background:
                    i === 2 ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: i === 2 ? "#fff" : t.muted,
                  lineHeight: 1,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 6, right: 8, display: "flex", gap: 4, zIndex: 2 }}>
          {["─", "□", "✕"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background:
                  i === 2
                    ? "rgba(239,68,68,0.7)"
                    : "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 7,
                color: i === 2 ? "#fff" : t.muted,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      )}

      {/* Content area */}
      <div
        style={{
          padding: small ? 8 : 12,
          display: "flex",
          gap: small ? 6 : 10,
          height: `calc(100% - ${barH}px)`,
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: small ? 50 : 64,
            flexShrink: 0,
            background: t.surface,
            borderRadius: 6,
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "center",
          }}
        >
          {[t.accent, t.border, t.border, t.border].map((c, i) => (
            <div
              key={i}
              style={{
                width: small ? 24 : 32,
                height: small ? 24 : 32,
                borderRadius: 6,
                background: i === 0 ? t.accent + "22" : c + "44",
                border: i === 0 ? `1.5px solid ${t.accent}` : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: small ? 8 : 10,
                  height: small ? 8 : 10,
                  borderRadius: 3,
                  background: i === 0 ? t.accent : t.muted + "66",
                }}
              />
            </div>
          ))}
        </div>

        {/* Viewport */}
        <div
          style={{
            flex: 1,
            background:
              t.id === "stone-light"
                ? "linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)"
                : `linear-gradient(135deg, ${t.surface} 0%, ${t.bg} 100%)`,
            borderRadius: 6,
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Fake microscope viewport */}
          <div
            style={{
              width: small ? 40 : 60,
              height: small ? 40 : 60,
              borderRadius: "50%",
              border: `2px solid ${t.accent}44`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 1,
                background: t.accent + "44",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 1,
                background: t.accent + "44",
              }}
            />
            {/* Droplets */}
            {[
              { x: "25%", y: "30%", s: small ? 4 : 6 },
              { x: "60%", y: "55%", s: small ? 5 : 8 },
              { x: "40%", y: "70%", s: small ? 3 : 5 },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: d.x,
                  top: d.y,
                  width: d.s,
                  height: d.s,
                  borderRadius: "50%",
                  border: `1.5px solid ${t.accent}`,
                  background: t.accent + "18",
                }}
              />
            ))}
          </div>

          {/* Overlay stats */}
          <div
            style={{
              position: "absolute",
              bottom: small ? 4 : 6,
              right: small ? 4 : 6,
              background: t.bg + "cc",
              borderRadius: 4,
              padding: small ? "2px 4px" : "3px 8px",
              fontSize: small ? 7 : 9,
              color: t.accent,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 0.5,
            }}
          >
            3 detected
          </div>
        </div>

        {/* Right panel */}
        {!small && (
          <div
            style={{
              width: 72,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                background: t.surface,
                borderRadius: 6,
                padding: 8,
                flex: 1,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: t.border,
                    marginBottom: 6,
                    width: i === 2 ? "60%" : "80%",
                  }}
                />
              ))}
              <div
                style={{
                  marginTop: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  color: t.fg,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                3
              </div>
              <div style={{ fontSize: 7, color: t.muted, letterSpacing: 0.3 }}>
                droplets
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children, color = "#2563eb" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: color,
        background: color + "14",
        border: `1px solid ${color}28`,
      }}
    >
      {children}
    </span>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 100,
        fontSize: 10,
        color: "#71717a",
        background: "#f4f4f5",
        border: "1px solid #e4e4e7",
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}

export default function App() {
  const [selectedShell, setSelectedShell] = useState("classic");
  const [selectedTheme, setSelectedTheme] = useState("zinc-dark");
  const [hoveredPreset, setHoveredPreset] = useState(null);

  const activeTheme = THEMES.find((t) => t.id === selectedTheme);

  // When preset hovered, show its combo
  const displayShell = hoveredPreset
    ? PRESETS.find((p) => p.id === hoveredPreset)?.shell || selectedShell
    : selectedShell;
  const displayTheme = hoveredPreset
    ? PRESETS.find((p) => p.id === hoveredPreset)?.theme || selectedTheme
    : selectedTheme;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        fontFamily: "'DM Sans', sans-serif",
        color: "#18181b",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          padding: "32px 32px 0",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            D
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              DropDetect
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#71717a",
                  marginLeft: 8,
                }}
              >
                Workstation Configurator
              </span>
            </h1>
          </div>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#71717a",
            margin: "8px 0 0",
            lineHeight: 1.6,
          }}
        >
          เลือก Shell + Theme ที่เหมาะกับสภาพแวดล้อมการทำงาน
          หรือใช้ Preset ที่แนะนำด้านล่าง
        </p>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
        {/* Live Preview */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e88",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: "#71717a",
              }}
            >
              Live Preview
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#a1a1aa",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {SHELLS.find((s) => s.id === displayShell)?.name} +{" "}
              {THEMES.find((t) => t.id === displayTheme)?.name}
            </span>
          </div>
          <WindowPreview shell={displayShell} theme={displayTheme} />
        </div>

        {/* Two-column: Shell + Theme */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Shell section */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "#a1a1aa",
                marginBottom: 12,
              }}
            >
              Shell — Window Style
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SHELLS.map((s) => {
                const active = selectedShell === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedShell(s.id)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: active
                        ? "2px solid #2563eb"
                        : "1px solid #e4e4e7",
                      background: active ? "#eff6ff" : "#fff",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {s.name}
                      </span>
                      {s.tag && <Tag>{s.tag}</Tag>}
                      {active && (
                        <div
                          style={{
                            marginLeft: "auto",
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5L4.2 7.5L8 2.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#52525b",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {s.desc}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {s.best.map((b, i) => (
                        <Badge key={i}>{b}</Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme section */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "#a1a1aa",
                marginBottom: 12,
              }}
            >
              Theme — Color Palette
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {THEMES.map((t) => {
                const active = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: active
                        ? "2px solid #2563eb"
                        : "1px solid #e4e4e7",
                      background: active ? "#eff6ff" : "#fff",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {t.name}
                      </span>
                      {t.tag && (
                        <Tag
                          color={
                            t.tag === "ใหม่" ? "#16a34a" : "#2563eb"
                          }
                        >
                          {t.tag}
                        </Tag>
                      )}
                      {active && (
                        <div
                          style={{
                            marginLeft: "auto",
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5L4.2 7.5L8 2.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Color strip */}
                    <div
                      style={{
                        display: "flex",
                        height: 20,
                        borderRadius: 6,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      {t.colors.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            flex: i === t.colors.length - 1 ? 0.6 : 1,
                            background: c,
                          }}
                        />
                      ))}
                    </div>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#52525b",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {t.desc}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {t.traits.map((tr, i) => (
                        <Badge key={i}>{tr}</Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "#a1a1aa",
              marginBottom: 12,
            }}
          >
            Presets — Quick Setup
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {PRESETS.map((p) => {
              const isActive =
                selectedShell === p.shell && selectedTheme === p.theme;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedShell(p.shell);
                    setSelectedTheme(p.theme);
                  }}
                  onMouseEnter={() => setHoveredPreset(p.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    padding: 16,
                    borderRadius: 10,
                    border: isActive
                      ? "2px solid #2563eb"
                      : "1px solid #e4e4e7",
                    background: isActive ? "#eff6ff" : "#fff",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 2 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>
                    {p.subtitle}
                  </div>

                  {/* Mini preview */}
                  <div style={{ margin: "6px 0" }}>
                    <WindowPreview
                      shell={p.shell}
                      theme={p.theme}
                      small={true}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#a1a1aa",
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.5,
                    }}
                  >
                    {SHELLS.find((s) => s.id === p.shell)?.name} +{" "}
                    {THEMES.find((t) => t.id === p.theme)?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#52525b",
                      lineHeight: 1.5,
                      marginTop: 2,
                    }}
                  >
                    {p.reason}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary bar */}
        <div
          style={{
            marginTop: 28,
            padding: "16px 20px",
            background: "#18181b",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 2,
                }}
              >
                Shell
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#fafafa",
                  fontWeight: 600,
                }}
              >
                {SHELLS.find((s) => s.id === selectedShell)?.name}
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 28,
                background: "#3f3f46",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 2,
                }}
              >
                Theme
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#fafafa",
                  fontWeight: 600,
                }}
              >
                {THEMES.find((t) => t.id === selectedTheme)?.name}
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 28,
                background: "#3f3f46",
              }}
            />
            <div style={{ display: "flex", gap: 3 }}>
              {activeTheme?.colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: c,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "8px 20px",
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: -0.2,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#1d4ed8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#2563eb")
            }
          >
            Apply Configuration →
          </button>
        </div>

        {/* Tip */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#fffbeb",
            borderRadius: 8,
            border: "1px solid #fef3c7",
            fontSize: 12,
            color: "#92400e",
            lineHeight: 1.6,
          }}
        >
          <strong>Tip:</strong> หลีกเลี่ยง pure black (#000) เป็น background
          — Zinc Dark (#18181b) ลดอาการเมื่อยตาจากคอนทราสต์ที่สูงเกินไป
          เหมาะกับการใช้งานยาวนาน
        </div>
      </div>
    </div>
  );
}
