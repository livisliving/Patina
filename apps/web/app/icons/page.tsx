import { FolderIcon, HeartIcon, DiskIcon } from "@/components/aqua-icons";

const TONES = ["pink", "aqua", "lime", "tangerine", "grape"] as const;
const ICONS = [
  { name: "Folder", Comp: FolderIcon, kind: "tone" },
  { name: "Heart", Comp: HeartIcon, kind: "tone" },
  { name: "Disk", Comp: DiskIcon, kind: "neutral" },
];

// Sample page for reviewing icon fidelity + tone adaptation. Not part of the OS.
export default function IconSample() {
  return (
    <main style={{ minHeight: "100vh", background: "#d8d8d8", padding: 40, fontFamily: "var(--y2k-font-ui)" }}>
      <h1 style={{ fontSize: 18, marginBottom: 24 }}>Aqua icon samples — style + tone adaptation</h1>
      {TONES.map((tone) => (
        <div key={tone} data-tone={tone} style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 20, padding: 16, background: "rgba(255,255,255,0.5)", borderRadius: 8 }}>
          <div style={{ width: 90, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{tone}</div>
          {ICONS.map(({ name, Comp, kind }) => (
            <div key={name} style={{ textAlign: "center" }}>
              <Comp width={72} height={72} />
              <div style={{ fontSize: 11, color: "#555" }}>{name}{kind === "neutral" ? " (neutral)" : ""}</div>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
