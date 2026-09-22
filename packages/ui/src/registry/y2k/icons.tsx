"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina icons — DESIGN.md › Shapes, Components › Icons.
 *
 * The pack's own icon set, so a restyled page never needs a thin-line icon
 * (Lucide, Heroicons, Feather are forbidden). Every icon is a glossy Aqua
 * object drawn for Patina: light from the top left, a crisp white gloss cap on
 * gel and glass, vertical gradients, a dark hairline so it reads on the
 * pinstripes, and a soft contact shadow under anything that stands on a
 * surface.
 *
 * Colour: an icon looks the same in every tone. Its gel parts are one fixed
 * hue (`hue` on Svg), mixed toward white or black for the shading: OS blue
 * for most, red for Mail's seal, brass for the lock, yellow for the bolt.
 * Only Folder, Heart and Star take the tone, as the demo's own Folder, Heart
 * and Star do. White plastic, paper, glass and metal are neutral, and the
 * status icons keep their own colours: Info's OS blue, Warning's yellow,
 * Check's green.
 *
 * Each renders a 128-unit SVG sized by the caller (`className="size-8"`); it
 * is decorative (aria-hidden) — label the control that holds it.
 *
 * `ICONS` names them; `lucideToPack` maps common lucide-react names onto
 * those names, for swapping a default page's icons out:
 *   <Settings />  →  <IconPreferences />   (ICONS[lucideToPack.Settings])
 */

export type IconProps = React.ComponentProps<"svg">

/* ── Materials ─────────────────────────────────────────────────────── */

/** The icon's own hue: fixed for most icons, the tone for the few that
    follow it. Set on the Svg, so an icon's gradients all read the same one. */
const TONE = "var(--icon-hue)"
/** The hue mixed toward white or black (pct = how much hue remains). */
const tone = (pct: number, mix: "white" | "black") =>
  `color-mix(in srgb, var(--icon-hue) ${pct}%, ${mix})`
/** Fixed hues. OS_BLUE is the aqua tone's base, the gel the icons were drawn in. */
const OS_BLUE = "#4d83d2"
/** Folder, Heart and Star follow the tone, as the demo's own art does. */
const TONE_HUE = "var(--y2k-tone)"
const SEAL_RED = "#d23a3a"
const BRASS = "#d4a020"
const BOLT_YELLOW = "#f2c21b"
/** The hairline round anything in the hue… */
const RIM = tone(45, "black")
/** …and round anything neutral. */
const INK = "#3d434b"

type Stop = readonly [offset: number, color: string, opacity?: number]

/** Gel: a deep top under the gloss, the tone, a bright refraction at the foot. */
const GEL: readonly Stop[] = [
  [0, tone(70, "black")],
  [0.42, TONE],
  [0.8, tone(76, "white")],
  [1, tone(56, "white")],
]
const GLOSS: readonly Stop[] = [
  [0, "#fff", 0.95],
  [1, "#fff", 0.18],
]
const PLASTIC: readonly Stop[] = [
  [0, "#ffffff"],
  [0.55, "#e8ecf1"],
  [1, "#b8c2ce"],
]
const CHROME: readonly Stop[] = [
  [0, "#fdfdfd"],
  [0.3, "#c2c7ce"],
  [0.55, "#f6f7f8"],
  [0.8, "#8c939c"],
  [1, "#d3d7dc"],
]

/* ── Drawing helpers ───────────────────────────────────────────────── */

/** Rounded-rectangle and ellipse path data. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`

/** SSR-safe gradient ids: `id("x")` names one, `url("x")` paints with it. */
function useIds() {
  const u = "y2k" + React.useId().replace(/[^\w-]/g, "")
  return [(k: string) => `${u}-${k}`, (k: string) => `url(#${u}-${k})`] as const
}

type GradProps = {
  id: string
  s: readonly Stop[]
  /** Coordinates in the icon's own units instead of the shape's box. */
  user?: boolean
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

/** A linear gradient; vertical by default. Stops go through `style` so they
    can hold var() and color-mix(). */
function Lin({ id, s, user, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: GradProps) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits={user ? "userSpaceOnUse" : undefined}>
      {s.map(([o, c, a], i) => (
        <stop key={i} offset={o} style={{ stopColor: c, stopOpacity: a }} />
      ))}
    </linearGradient>
  )
}

function Rad({ id, s, cx = 0.5, cy = 0.5, r = 0.5 }: Omit<GradProps, "user"> & { cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {s.map(([o, c, a], i) => (
        <stop key={i} offset={o} style={{ stopColor: c, stopOpacity: a }} />
      ))}
    </radialGradient>
  )
}

/** `hue` is the icon's own colour: OS blue unless it says otherwise, or
 *  TONE_HUE for the few that follow the tone. */
function Svg({ className, style, hue = OS_BLUE, children, ...props }: IconProps & { hue?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={128}
      height={128}
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={{ "--icon-hue": hue, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </svg>
  )
}

/** The soft contact shadow under an object that stands on a surface. */
function Shadow({ cx = 64, cy = 118, rx = 44, ry = 5 }: { cx?: number; cy?: number; rx?: number; ry?: number }) {
  const [id, url] = useIds()
  return (
    <>
      <defs>
        <Rad id={id("s")} s={[[0, "#000", 0.42], [0.55, "#000", 0.18], [1, "#000", 0]]} />
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={url("s")} />
    </>
  )
}

/** The white gloss cap, opaque at its top and nearly clear at its foot. */
function Gloss({ s = GLOSS, ...props }: React.SVGProps<SVGPathElement> & { s?: readonly Stop[] }) {
  const [id, url] = useIds()
  return (
    <>
      <defs>
        <Lin id={id("g")} s={s} />
      </defs>
      <path fill={url("g")} {...props} />
    </>
  )
}

/** The heart, shared by IconHeart and the seal on IconMail. */
const HEART =
  "M64 110C40 94 10 74 10 46C10 28 23 16 39 16C50 16 58 22 64 32C70 22 78 16 89 16C105 16 118 28 118 46C118 74 88 94 64 110Z"
const HEART_GLOSS_L = "M21 46C18 33 28 23 40 23C50 23 57 30 59 38C50 46 32 49 21 46Z"
const HEART_GLOSS_R = "M69 38C73 29 81 23 91 23C103 23 110 32 108 43C96 47 80 45 69 38Z"

/* ── Places and things ─────────────────────────────────────────────── */

/** Computer — a white iMac with a black edge and a dark glass screen. */
export function IconComputer(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("shell")} s={[[0, "#ffffff"], [0.6, "#e3e9f1"], [1, "#b8c4d3"]]} />
        <Lin id={id("trim")} s={[[0, "#4a4a4a"], [1, "#0a0a0a"]]} />
        <Lin id={id("screen")} s={[[0, "#4a4a4a"], [0.55, "#1c1c1c"], [1, "#050505"]]} x2={1} y2={1} />
      </defs>
      <ellipse cx={64} cy={117} rx={40} ry={5} fill="rgba(0,0,0,0.22)" />
      {/* The foot, then the rounded shell with its black edge */}
      <path d="M44 102h40l8 12H36z" fill={url("shell")} stroke="#333" strokeWidth={1.5} />
      <path d="M18 28c0-12 8-17 20-17h52c12 0 20 5 20 17l2 58c0 14-8 20-22 20H38c-14 0-22-6-22-20z" fill={url("trim")} />
      <path d="M22 29c0-9 6-13 16-13h52c10 0 16 4 16 13l2 57c0 11-6 16-18 16H40c-12 0-18-5-18-16z" fill={url("shell")} />
      {/* The dark glass, with a diagonal catch of light */}
      <rect x={32} y={22} width={64} height={52} rx={4} fill={url("screen")} stroke="rgba(0,0,0,0.6)" />
      <path d="M33 23h40L33 63z" fill="rgba(255,255,255,0.14)" />
      {/* Speakers and the disc slot */}
      <circle cx={36} cy={90} r={4} fill={url("trim")} />
      <circle cx={92} cy={90} r={4} fill={url("trim")} />
      <rect x={46} y={88} width={36} height={4} rx={2} fill="#8795a8" />
    </Svg>
  )
}

/** Home — a cream house with a dark roof edge, a wooden door and a
    shuttered window, as the 10.1 toolbar draws it. */
export function IconHome(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("wall")} s={[[0, "#fbf7ee"], [1, "#d8ccb2"]]} />
        <Lin id={id("wood")} s={[[0, "#8a4618"], [0.5, "#c87a36"], [1, "#8a4618"]]} x2={1} y2={0} />
      </defs>
      <ellipse cx={64} cy={114} rx={42} ry={5} fill="rgba(0,0,0,0.22)" />
      <rect x={84} y={24} width={11} height={28} fill="#d8ccb2" stroke="#6b5a3e" strokeWidth={1.5} />
      {/* The wall and gable, under a dark roof edge */}
      <path d="M26 58L64 24l38 34v52H26z" fill={url("wall")} stroke="#6b5a3e" strokeWidth={1.5} />
      <path d="M14 64L64 19l50 45" fill="none" stroke="#2b2724" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* A shuttered window and the door */}
      <rect x={55} y={44} width={18} height={16} fill="#f7f4ec" stroke="#6b5a3e" />
      <rect x={49} y={44} width={6} height={16} fill={url("wood")} />
      <rect x={73} y={44} width={6} height={16} fill={url("wood")} />
      <rect x={54} y={74} width={20} height={36} fill={url("wood")} stroke="#5a2e0e" strokeWidth={1.5} />
      <path d="M60 78v28M68 78v28" stroke="rgba(0,0,0,0.25)" />
      <circle cx={70} cy={93} r={1.6} fill="#f3d27a" />
    </Svg>
  )
}

/** Folder — the Aqua folder in the tone: a pale back with its tab, a sheet
    of paper, and a gel front leaning out. */
export function IconFolder(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={TONE_HUE}>
      <defs>
        <Lin id={id("back")} s={[[0, tone(38, "white")], [1, tone(62, "white")]]} />
        <Lin
          id={id("front")}
          s={[[0, tone(55, "white")], [0.3, tone(85, "white")], [0.72, TONE], [0.93, tone(82, "black")], [1, tone(70, "white")]]}
        />
        <pattern id={id("rows")} width={4} height={4} patternUnits="userSpaceOnUse">
          <rect width={4} height={2} fill="#fff" fillOpacity={0.14} />
        </pattern>
      </defs>
      <Shadow cy={116} rx={54} ry={5} />
      <path
        d="M8 30Q8 22 16 22H42Q46 22 49 25.5L53 30H106Q114 30 114 38V100Q114 108 106 108H16Q8 108 8 100Z"
        fill={url("back")}
        stroke={RIM}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <rect x={17} y={36} width={90} height={40} rx={1.5} fill="#fbfbfb" stroke="rgba(0,0,0,0.3)" />
      <path
        d="M20 46H117Q122 46 121.5 51L115.5 103Q115 108 110 108H15Q10 108 10.5 103L14.5 51Q15 46 20 46Z"
        fill={url("front")}
        stroke={RIM}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M20 46H117Q122 46 121.5 51L115.5 103Q115 108 110 108H15Q10 108 10.5 103L14.5 51Q15 46 20 46Z" fill={url("rows")} />
      <Gloss d="M21 49.5H116Q118.5 49.5 118.2 52L117.4 61H16.7L17.4 52Q17.7 49.5 21 49.5Z" />
    </Svg>
  )
}

/** Document — a white sheet with a folded corner. */
export function IconDocument(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("paper")} s={[[0, "#ffffff"], [0.6, "#eef1f5"], [1, "#d5dbe3"]]} />
        <Lin id={id("fold")} s={[[0, "#c3cbd5"], [0.5, "#f1f4f7"], [1, "#ffffff"]]} x1={0} y1={1} x2={1} y2={0} />
      </defs>
      <Shadow cy={119} rx={40} ry={4} />
      <path
        d="M30 8H82L106 32V112Q106 116 102 116H30Q26 116 26 112V12Q26 8 30 8Z"
        fill={url("paper")}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M85 32H106V38Z" fill="#000" fillOpacity={0.1} />
      <path d="M82 8V28Q82 32 86 32H106Z" fill={url("fold")} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={36} y={42} width={38} height={5} rx={1.5} fill="#5b636d" />
      {[
        [54, 60],
        [62, 56],
        [70, 60],
        [78, 50],
        [86, 58],
        [94, 60],
        [102, 36],
      ].map(([y, w]) => (
        <rect key={y} x={36} y={y} width={w} height={3.5} rx={1.5} fill="#959ea9" />
      ))}
    </Svg>
  )
}

/** Trash — a wire-mesh bin in bright metal. */
export function IconTrash(props: IconProps) {
  const [id, url] = useIds()
  const body = "M22 24A42 10 0 0 0 106 24L95 108A31 7 0 0 1 33 108Z"
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("dark")} s={[[0, "#20242a"], [1, "#5b626b"]]} />
        <Lin
          id={id("round")}
          s={[[0, "#000", 0.5], [0.18, "#000", 0.08], [0.34, "#fff", 0.3], [0.5, "#fff", 0], [0.8, "#000", 0.18], [1, "#000", 0.55]]}
          x2={1}
          y2={0}
        />
        <Lin id={id("chrome")} s={CHROME} x2={1} y2={0} />
        <pattern id={id("mesh")} width={8} height={8} patternUnits="userSpaceOnUse">
          <path d="M-1 1L1 -1M0 8L8 0M7 9L9 7M-1 7L1 9M0 0L8 8M7 -1L9 1" stroke="#eef1f4" strokeWidth={1.4} />
        </pattern>
      </defs>
      <Shadow cy={118} rx={40} />
      {/* Inside, seen over the rim */}
      <ellipse cx={64} cy={24} rx={42} ry={10} fill={url("dark")} />
      <ellipse cx={64} cy={24} rx={42} ry={10} fill={url("mesh")} opacity={0.35} />
      {/* The mesh wall, rounded by light */}
      <path d={body} fill="#4a5058" />
      <path d={body} fill={url("mesh")} />
      <path d={body} fill={url("round")} />
      <path d={body} fill="none" stroke={INK} strokeWidth={1.5} />
      {/* Foot band and rim */}
      <path d="M31.6 97A32.4 7 0 0 0 96.4 97L95 108A31 7 0 0 1 33 108Z" fill={url("chrome")} stroke={INK} strokeWidth={1.5} />
      <ellipse cx={64} cy={24} rx={42} ry={10} fill="none" stroke={url("chrome")} strokeWidth={5} />
      <ellipse cx={64} cy={24} rx={44.5} ry={12.5} fill="none" stroke={INK} strokeWidth={1.5} />
      <ellipse cx={64} cy={24} rx={39.5} ry={7.5} fill="none" stroke={INK} strokeWidth={1} />
      <path d="M26 26.5A40 9 0 0 0 102 26.5" fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.5} />
    </Svg>
  )
}

/** Search — a glass lens in a bright ring, on a gel handle in the tone. */
export function IconSearch(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Rad id={id("lens")} s={[[0, "#ffffff", 0.92], [0.7, "#d6ebfb", 0.8], [1, "#8fbfe6", 0.9]]} cx={0.4} cy={0.35} r={0.7} />
        <Lin id={id("ring")} s={CHROME} x2={1} y2={1} />
        <Lin id={id("grip")} s={[[0, tone(80, "white")], [0.35, TONE], [0.8, tone(70, "black")], [1, tone(50, "black")]]} />
      </defs>
      <Shadow cx={70} cy={118} rx={46} />
      <g transform="translate(78 78) rotate(45)">
        <rect x={12} y={-11} width={40} height={22} rx={11} fill={url("grip")} stroke={RIM} strokeWidth={2.5} />
        <Gloss d={rr(18, -8, 28, 7, 3.5)} />
        <rect x={0} y={-8} width={15} height={16} rx={2} fill={url("ring")} stroke={INK} strokeWidth={1.5} />
      </g>
      <circle cx={52} cy={52} r={34} fill={url("lens")} />
      <circle cx={52} cy={52} r={34} fill="none" stroke={url("ring")} strokeWidth={9} />
      <circle cx={52} cy={52} r={38.5} fill="none" stroke={INK} strokeWidth={1.75} />
      <circle cx={52} cy={52} r={29.5} fill="none" stroke={INK} strokeOpacity={0.6} />
      <path d="M31 50A21 21 0 0 1 50 31" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <path d="M72 58A21 21 0 0 1 60 72" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  )
}

/** Preferences — a bright metal gear on a gel hub in the tone. */
export function IconPreferences(props: IconProps) {
  const [id, url] = useIds()
  const gear =
    "M55.1 21.3Q57.4 20.5 57.7 18L58.2 12.8Q58.5 10.3 61 10.3L67 10.3Q69.5 10.3 69.8 12.8L70.3 18Q70.6 20.5 72.9 21.3L80.7 23.8Q83.1 24.6 84.7 22.7L88.2 18.8Q89.9 16.9 91.9 18.4L96.9 22Q98.9 23.4 97.6 25.6L95 30.1Q93.7 32.3 95.2 34.3L100 40.9Q101.4 42.9 103.9 42.4L109 41.3Q111.5 40.8 112.2 43.1L114.1 48.9Q114.9 51.3 112.6 52.3L107.8 54.4Q105.5 55.4 105.5 57.9L105.5 66.1Q105.5 68.6 107.8 69.6L112.6 71.7Q114.9 72.7 114.1 75.1L112.2 80.9Q111.5 83.2 109 82.7L103.9 81.6Q101.4 81.1 100 83.1L95.2 89.7Q93.7 91.7 95 93.9L97.6 98.4Q98.9 100.6 96.9 102L91.9 105.6Q89.9 107.1 88.2 105.2L84.7 101.3Q83.1 99.4 80.7 100.2L72.9 102.7Q70.6 103.5 70.3 106L69.8 111.2Q69.5 113.7 67 113.7L61 113.7Q58.5 113.7 58.2 111.2L57.7 106Q57.4 103.5 55.1 102.7L47.3 100.2Q44.9 99.4 43.3 101.3L39.8 105.2Q38.1 107.1 36.1 105.6L31.1 102Q29.1 100.6 30.4 98.4L33 93.9Q34.3 91.7 32.8 89.7L28 83.1Q26.6 81.1 24.1 81.6L19 82.7Q16.5 83.2 15.8 80.9L13.9 75.1Q13.1 72.7 15.4 71.7L20.2 69.6Q22.5 68.6 22.5 66.1L22.5 57.9Q22.5 55.4 20.2 54.4L15.4 52.3Q13.1 51.3 13.9 48.9L15.8 43.1Q16.5 40.8 19 41.3L24.1 42.4Q26.6 42.9 28 40.9L32.8 34.3Q34.3 32.3 33 30.1L30.4 25.6Q29.1 23.4 31.1 22L36.1 18.4Q38.1 16.9 39.8 18.8L43.3 22.7Q44.9 24.6 47.3 23.8Z"
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("steel")} s={CHROME} x2={1} y2={1} />
        <Rad
          id={id("turned")}
          s={[[0, "#f7f8fa"], [0.35, "#d3d8de"], [0.55, "#f2f3f5"], [0.75, "#bfc5cc"], [0.9, "#eceef1"], [1, "#a7aeb7"]]}
        />
        <Rad id={id("hub")} s={[[0, tone(60, "white")], [0.6, TONE], [1, tone(60, "black")]]} cx={0.5} cy={0.7} r={0.65} />
        <clipPath id={id("clip")}>
          <path d={gear} />
        </clipPath>
      </defs>
      <Shadow cy={119} rx={40} />
      <path d={gear} fill={url("steel")} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <g clipPath={url("clip")}>
        <Gloss d={ell(64, 20, 56, 26)} s={[[0, "#fff", 0.7], [1, "#fff", 0]]} />
      </g>
      <circle cx={64} cy={62} r={33} fill={url("turned")} stroke={INK} strokeOpacity={0.55} strokeWidth={1.5} />
      <circle cx={64} cy={62} r={35.5} fill="none" stroke="#fff" strokeOpacity={0.7} />
      <circle cx={64} cy={62} r={15} fill={url("hub")} stroke={RIM} strokeWidth={2} />
      <Gloss d={ell(64, 55.5, 9.5, 5.5)} />
    </Svg>
  )
}

/** Mail — a white envelope sealed with a gel heart in the tone. */
export function IconMail(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={SEAL_RED}>
      <defs>
        <Lin id={id("paper")} s={[[0, "#ffffff"], [0.6, "#e9eef4"], [1, "#c9d2dd"]]} />
        <Lin id={id("flap")} s={[[0, "#fdfdfe"], [1, "#dde4ec"]]} />
        <Lin id={id("seal")} s={GEL} />
      </defs>
      <Shadow cy={112} rx={54} ry={5} />
      <rect x={8} y={28} width={112} height={76} rx={6} fill={url("paper")} stroke={INK} strokeWidth={2.5} />
      <path d="M11 101L53 66M117 101L75 66" stroke="#aab5c1" strokeWidth={2} />
      <path d="M12 103L54 68M116 103L74 68" stroke="#fff" strokeWidth={1.5} />
      <path d="M9.5 31L60 74Q64 77.5 68 74L118.5 31" fill="#000" fillOpacity={0.08} transform="translate(0 3)" />
      <path
        d="M9.5 31Q10 28 14 28H114Q118 28 118.5 31L68 74Q64 77.5 60 74Z"
        fill={url("flap")}
        stroke="#6a7582"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <g transform="translate(64 74) scale(0.24) translate(-64 -63)">
        <path d={HEART} fill={url("seal")} stroke={RIM} strokeWidth={9} strokeLinejoin="round" />
        <Gloss d={HEART_GLOSS_L} />
        <Gloss d={HEART_GLOSS_R} />
      </g>
    </Svg>
  )
}

/** Globe — a glass world, sea and land under a gloss cap. */
export function IconGlobe(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Rad
          id={id("sea")}
          s={[[0, "#b4ebff"], [0.35, "#45a2ec"], [0.78, "#1760c2"], [1, "#0b3787"]]}
          cx={0.5}
          cy={0.78}
          r={0.78}
        />
        <Lin id={id("land")} s={[[0, "#b4ea72"], [1, "#3f952a"]]} />
        <clipPath id={id("clip")}>
          <circle cx={64} cy={62} r={50} />
        </clipPath>
      </defs>
      <Shadow cy={119} rx={38} />
      <circle cx={64} cy={62} r={50} fill={url("sea")} />
      <g clipPath={url("clip")}>
        <g fill={url("land")} stroke="#2a6a18" strokeWidth={1.25} strokeLinejoin="round">
          <path d="M22 30C30 22 44 19 54 25C61 29 57 38 50 40C44 42 47 50 40 53C34 55 31 48 26 52C22 56 25 63 21 68C16 61 13 50 15 42C16 37 18 33 22 30Z" />
          <path d="M38 63C47 60 57 67 55 78C53 88 45 98 40 106C35 97 36 89 32 81C29 73 32 65 38 63Z" />
          <path d="M68 23C79 17 95 20 104 29C110 35 112 44 106 48C100 51 96 44 90 48C84 52 89 58 94 62C100 68 98 79 90 85C84 89 80 81 78 73C76 65 69 62 65 56C61 49 60 39 62 32C63 28 65 25 68 23Z" />
          <path d="M92 95C98 90 107 92 108 98C104 104 95 105 92 99Z" />
        </g>
        <g fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5}>
          <ellipse cx={64} cy={62} rx={22} ry={50} />
          <ellipse cx={64} cy={62} rx={40} ry={50} />
          <path d="M64 12V112M14 62H114M18 40Q64 48 110 40M18 84Q64 92 110 84" />
        </g>
        <ellipse cx={64} cy={96} rx={36} ry={18} fill="#bdf0ff" fillOpacity={0.3} />
      </g>
      <circle cx={64} cy={62} r={50} fill="none" stroke="#0a2c6b" strokeWidth={2.5} />
      <Gloss d={ell(64, 34, 36, 20)} s={[[0, "#fff", 0.92], [1, "#fff", 0.08]]} />
    </Svg>
  )
}

/** People — two busts: a white one behind, one in the tone in front. */
export function IconPeople(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("white")} s={[[0, "#ffffff"], [0.55, "#dde2e8"], [1, "#a3acb7"]]} />
        <Lin id={id("gel")} s={GEL} />
        <Rad id={id("head")} s={[[0, tone(60, "white")], [0.55, TONE], [1, tone(62, "black")]]} cx={0.5} cy={0.72} r={0.7} />
        <Rad id={id("head2")} s={[[0, "#ffffff"], [0.55, "#e3e7ec"], [1, "#9aa3ae"]]} cx={0.5} cy={0.72} r={0.7} />
      </defs>
      <Shadow cy={117} rx={52} />
      {/* Behind */}
      <path
        d="M58 96C58 72 70 62 85 62C100 62 112 72 112 96Q112 102 106 102H64Q58 102 58 96Z"
        fill={url("white")}
        stroke={INK}
        strokeWidth={2}
      />
      <circle cx={85} cy={37} r={17} fill={url("head2")} stroke={INK} strokeWidth={2} />
      <Gloss d={ell(85, 29, 10, 6)} />
      {/* In front */}
      <path
        d="M14 110C14 84 28 72 46 72C64 72 78 84 78 110Q78 116 72 116H20Q14 116 14 110Z"
        fill={url("gel")}
        stroke={RIM}
        strokeWidth={2.5}
      />
      <Gloss d="M22 96C24 84 33 76 46 76C59 76 68 84 70 96Q46 90 22 96Z" s={[[0, "#fff", 0.8], [1, "#fff", 0.1]]} />
      <circle cx={46} cy={48} r={20} fill={url("head")} stroke={RIM} strokeWidth={2.5} />
      <Gloss d={ell(46, 38.5, 12.5, 7.5)} />
    </Svg>
  )
}

/* ── Marks ─────────────────────────────────────────────────────────── */

/** Heart — a gel heart in the tone. */
export function IconHeart(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={TONE_HUE}>
      <defs>
        <Lin id={id("gel")} s={GEL} />
        <Rad id={id("glow")} s={[[0, tone(35, "white"), 0.85], [1, tone(35, "white"), 0]]} />
      </defs>
      <Shadow cy={118} rx={34} />
      <path d={HEART} fill={url("gel")} stroke={RIM} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={64} cy={80} rx={30} ry={18} fill={url("glow")} />
      <Gloss d={HEART_GLOSS_L} />
      <Gloss d={HEART_GLOSS_R} />
    </Svg>
  )
}

/** Star — a gel star in the tone. */
export function IconStar(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={TONE_HUE}>
      <defs>
        <Lin id={id("gel")} s={GEL} />
        <Rad id={id("glow")} s={[[0, tone(35, "white"), 0.8], [1, tone(35, "white"), 0]]} />
        <clipPath id={id("cap")}>
          <ellipse cx={64} cy={22} rx={70} ry={42} />
        </clipPath>
      </defs>
      <Shadow cy={119} rx={40} />
      <path
        d="M62.1 13.6Q64 9 65.9 13.6L76.8 41.1Q78.7 45.8 83.7 46.1L113.2 48.1Q118.2 48.4 114.4 51.6L91.6 70.5Q87.8 73.7 89 78.6L96.3 107.3Q97.5 112.1 93.3 109.4L68.2 93.7Q64 91 59.8 93.7L34.7 109.4Q30.5 112.1 31.7 107.3L39 78.6Q40.2 73.7 36.4 70.5L13.6 51.6Q9.8 48.4 14.8 48.1L44.3 46.1Q49.3 45.8 51.2 41.1Z"
        fill={url("gel")}
        stroke={RIM}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <ellipse cx={64} cy={82} rx={22} ry={12} fill={url("glow")} />
      <g clipPath={url("cap")}>
        <Gloss
          d="M62.5 19.8Q64 16.1 65.5 19.8L74.9 43.3Q76.3 47 80.3 47.3L105.5 48.9Q109.5 49.2 106.5 51.8L87 67.9Q84 70.5 85 74.4L91.2 98.9Q92.1 102.7 88.8 100.6L67.4 87.1Q64 85 60.6 87.1L39.2 100.6Q35.9 102.7 36.8 98.9L43 74.4Q44 70.5 41 67.9L21.5 51.8Q18.5 49.2 22.5 48.9L47.7 47.3Q51.7 47 53.1 43.3Z"
          s={[[0, "#fff", 0.95], [0.55, "#fff", 0.3]]}
        />
      </g>
    </Svg>
  )
}

/** Clock — a white face under glass in a gel bezel in the tone, at 10:10. */
export function IconClock(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("bezel")} s={GEL} />
        <Rad id={id("face")} s={[[0, "#ffffff"], [0.75, "#f3f5f8"], [1, "#cfd6df"]]} />
      </defs>
      <Shadow cy={119} rx={40} />
      <circle cx={64} cy={62} r={54} fill={url("bezel")} stroke={RIM} strokeWidth={2.5} />
      <path d="M27.2 31.1A48 48 0 0 1 100.8 31.1" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
      <circle cx={64} cy={62} r={42} fill={url("face")} stroke={tone(40, "black")} strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) =>
        i % 3 ? (
          <rect key={i} x={63} y={24} width={2} height={6} fill="#737a82" transform={`rotate(${i * 30} 64 62)`} />
        ) : (
          <rect key={i} x={61.5} y={23} width={5} height={11} rx={1} fill="#2b2f35" transform={`rotate(${i * 30} 64 62)`} />
        ),
      )}
      <g transform="translate(64 62)" fill="#1c1e21">
        <rect x={-3.5} y={-24} width={7} height={30} rx={3.5} transform="rotate(305)" />
        <rect x={-2.5} y={-35} width={5} height={41} rx={2.5} transform="rotate(60)" />
        <rect x={-1} y={-36} width={2} height={46} fill={tone(70, "black")} transform="rotate(192)" />
        <circle r={4.5} />
        <circle r={2} fill={TONE} />
      </g>
      <Gloss d={ell(64, 40, 32, 16)} s={[[0, "#fff", 0.85], [1, "#fff", 0]]} />
    </Svg>
  )
}

/** Lock — a gel padlock in the tone on a bright metal shackle. */
export function IconLock(props: IconProps) {
  const [id, url] = useIds()
  const shackle = "M42 58V42C42 26 52 16 64 16S86 26 86 42V58"
  return (
    <Svg {...props} hue={BRASS}>
      <defs>
        <Lin
          id={id("steel")}
          s={[[0, "#79808a"], [0.25, "#f4f5f7"], [0.45, "#b6bcc4"], [0.7, "#ffffff"], [1, "#7c838c"]]}
          user
          x1={34}
          x2={94}
          y2={0}
        />
        <Lin id={id("gel")} s={GEL} />
      </defs>
      <Shadow cy={119} rx={46} />
      <path d={shackle} fill="none" stroke={INK} strokeWidth={16} />
      <path d={shackle} fill="none" stroke={url("steel")} strokeWidth={11.5} />
      <rect x={20} y={54} width={88} height={62} rx={12} fill={url("gel")} stroke={RIM} strokeWidth={2.5} />
      <Gloss d={rr(26, 58, 76, 24, 8)} />
      <path d="M64 71A9 9 0 0 1 69 87.5L72 102H56L59 87.5A9 9 0 0 1 64 71Z" fill={tone(18, "black")} />
      <path d="M57.5 103.5H70.5" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

/** Chart — three gel bars in the tone on a white plinth. */
export function IconChart(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin
          id={id("bar")}
          s={[[0, tone(55, "black")], [0.14, TONE], [0.32, tone(52, "white")], [0.52, TONE], [0.85, tone(78, "black")], [1, tone(50, "black")]]}
          x2={1}
          y2={0}
        />
        <Lin id={id("plinth")} s={PLASTIC} />
      </defs>
      <Shadow cy={118} rx={56} />
      {[
        [18, 66],
        [52, 42],
        [86, 16],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width={24} height={108 - y} rx={6} fill={url("bar")} stroke={RIM} strokeWidth={2.5} />
          <Gloss d={rr(x + 4, y + 3, 16, 10, 5)} s={[[0, "#fff", 0.95], [1, "#fff", 0.1]]} />
        </g>
      ))}
      <rect x={8} y={100} width={112} height={14} rx={7} fill={url("plinth")} stroke={INK} strokeWidth={2} />
      <path d="M15 103.5H113" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

/** Music — a pair of beamed notes in tone gel. */
export function IconMusic(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <g id={id("notes")}>
          <ellipse cx={37} cy={94} rx={17} ry={12} transform="rotate(-22 37 94)" />
          <ellipse cx={93} cy={80} rx={17} ry={12} transform="rotate(-22 93 80)" />
          <rect x={45} y={34} width={7.5} height={58} />
          <rect x={101} y={20} width={7.5} height={58} />
          <path d="M45 28L108.5 14V32L45 46Z" />
        </g>
        <Lin id={id("gel")} s={GEL} user y1={12} y2={108} />
      </defs>
      <Shadow cy={118} rx={46} />
      <use href={`#${id("notes")}`} fill="none" stroke={RIM} strokeWidth={5} strokeLinejoin="round" />
      <use href={`#${id("notes")}`} fill={url("gel")} />
      <Gloss d="M48 31L105.5 18.4V23.5L48 36.2Z" s={[[0, "#fff", 0.9], [1, "#fff", 0.35]]} />
      <Gloss d={rr(46.5, 48, 3, 36, 1.5)} s={[[0, "#fff", 0.7], [1, "#fff", 0.1]]} />
      <Gloss d={rr(102.5, 36, 3, 34, 1.5)} s={[[0, "#fff", 0.7], [1, "#fff", 0.1]]} />
      <Gloss d={ell(31, 88, 9, 4.5)} transform="rotate(-22 31 88)" />
      <Gloss d={ell(87, 74, 9, 4.5)} transform="rotate(-22 87 74)" />
    </Svg>
  )
}

/** Picture — a framed photograph, a print in the tone tucked behind it. */
export function IconPicture(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("frame")} s={PLASTIC} />
        <Lin id={id("print")} s={[[0, tone(40, "white")], [1, tone(75, "white")]]} />
        <Lin id={id("sky")} s={[[0, "#3b8be4"], [1, "#d3ecff"]]} />
        <Lin id={id("far")} s={[[0, "#a9de6e"], [1, "#5ca93b"]]} />
        <Lin id={id("near")} s={[[0, "#5db73e"], [1, "#2c7a1d"]]} />
        <Rad id={id("sun")} s={[[0, "#fffbe0"], [0.55, "#ffd84a"], [1, "#f3a21f"]]} />
        <clipPath id={id("photo")}>
          <rect x={18} y={40} width={86} height={62} />
        </clipPath>
      </defs>
      <Shadow cy={118} rx={52} />
      <g transform="rotate(9 72 48)">
        <rect x={32} y={12} width={82} height={64} rx={2} fill="#f7f8fa" stroke={INK} strokeWidth={1.5} />
        <rect x={38} y={18} width={70} height={46} fill={url("print")} />
      </g>
      <rect x={10} y={32} width={102} height={78} rx={3} fill={url("frame")} stroke={INK} strokeWidth={2} />
      <g clipPath={url("photo")}>
        <rect x={18} y={40} width={86} height={62} fill={url("sky")} />
        <circle cx={85} cy={57} r={9} fill={url("sun")} />
        <path d="M18 84C34 68 54 70 68 80C80 72 94 70 104 76V102H18Z" fill={url("far")} />
        <path d="M18 94C40 82 70 84 104 96V102H18Z" fill={url("near")} />
        <path d="M18 40H72L18 86Z" fill="#fff" fillOpacity={0.2} />
      </g>
      <rect x={18} y={40} width={86} height={62} fill="none" stroke="#000" strokeOpacity={0.4} />
    </Svg>
  )
}

/** Download — a gel arrow in the tone dropping into a bright tray. */
export function IconDownload(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("tray")} s={[[0, "#fbfcfd"], [0.5, "#d4d9e0"], [1, "#9aa2ad"]]} />
        <Lin id={id("gel")} s={GEL} />
      </defs>
      <Shadow cy={119} rx={54} />
      <path
        d="M10 78H40L46 90H82L88 78H118V106Q118 114 110 114H18Q10 114 10 106Z"
        fill={url("tray")}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M12.5 80.5H38.5M89.5 80.5H115.5" stroke="#fff" strokeWidth={1.5} />
      <path d="M41.5 81L47 92H81L86.5 81" fill="none" stroke="#000" strokeOpacity={0.2} strokeWidth={2} />
      <path
        d="M50 12Q50 8 54 8L74 8Q78 8 78 12L78 48.5Q78 50 79.5 50L94 50Q98 50 95.4 53L67.2 86.2Q64 90 60.8 86.2L32.6 53Q30 50 34 50L48.5 50Q50 50 50 48.5Z"
        fill={url("gel")}
        stroke={RIM}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Gloss d={rr(53.5, 11, 21, 30, 3)} />
      <Gloss d="M37 53.5H91L86 59.5H42Z" s={[[0, "#fff", 0.75], [1, "#fff", 0.15]]} />
    </Svg>
  )
}

/** Lightning — a gel bolt in the tone. */
export function IconLightning(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={BOLT_YELLOW}>
      <defs>
        <Lin id={id("gel")} s={GEL} user y1={6} y2={122} />
      </defs>
      <Shadow cx={62} cy={121} rx={30} ry={4} />
      <path
        d="M64.4 8.6Q66 6 69 6L95 6Q98 6 96.6 8.7L76.9 46.2Q76 48 78 48L99 48Q102 48 100.1 50.4L45.9 119.6Q44 122 44.8 119.1L57.5 69.9Q58 68 56 68L31 68Q28 68 29.6 65.4Z"
        fill={url("gel")}
        stroke={RIM}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Gloss d="M68.6 10H92L81 31H55.4Z" />
      <Gloss d="M80 52H95L66 89Z" s={[[0, "#fff", 0.7], [1, "#fff", 0.05]]} />
    </Svg>
  )
}

/** Chat — a speech bubble in the tone behind a white glass one. */
export function IconChat(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <g id={id("back")}>
          <ellipse cx={78} cy={40} rx={42} ry={28} />
          <path d="M92 60L114 86L76 66Z" />
        </g>
        <g id={id("front")}>
          <ellipse cx={50} cy={74} rx={44} ry={30} />
          <path d="M32 96L12 118L54 102Z" />
        </g>
        <Lin id={id("gel")} s={GEL} user y1={12} y2={86} />
        <Lin id={id("glass")} s={[[0, "#ffffff"], [0.6, "#eef2f6"], [1, "#c3cdd9"]]} user y1={44} y2={118} />
        <Rad id={id("dot")} s={[[0, tone(55, "white")], [0.6, TONE], [1, tone(60, "black")]]} cx={0.5} cy={0.7} r={0.7} />
      </defs>
      <use href={`#${id("back")}`} fill="none" stroke={RIM} strokeWidth={5} strokeLinejoin="round" />
      <use href={`#${id("back")}`} fill={url("gel")} />
      <Gloss d={ell(78, 25, 30, 10)} />
      <use href={`#${id("front")}`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <use href={`#${id("front")}`} fill={url("glass")} />
      <Gloss d={ell(50, 57, 32, 10)} s={[[0, "#fff", 1], [1, "#fff", 0.2]]} />
      {[30, 50, 70].map((x) => (
        <circle key={x} cx={x} cy={76} r={7.5} fill={url("dot")} stroke={RIM} strokeWidth={1.5} />
      ))}
    </Svg>
  )
}

/** Code — a little Aqua window with a black terminal, its prompt in the tone. */
export function IconCode(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("bar")} s={[[0, "#fbfbfb"], [1, "#cdcdcd"]]} />
        <Lin id={id("glass")} s={[[0, "#32363c"], [1, "#07080a"]]} />
        <pattern id={id("rows")} width={4} height={4} patternUnits="userSpaceOnUse">
          <rect width={4} height={2} fill="#fff" fillOpacity={0.5} />
        </pattern>
      </defs>
      <Shadow cy={118} rx={54} />
      <rect x={8} y={12} width={112} height={100} rx={8} fill={url("bar")} stroke={INK} strokeWidth={2} />
      <path d="M16 13H112V34H9V20Q9 13 16 13Z" fill={url("rows")} />
      {(
        [
          ["#f04646", 20],
          ["#f4b01e", 31],
          ["#46be2d", 42],
        ] as const
      ).map(([c, x]) => (
        <g key={x}>
          <circle cx={x} cy={23} r={4.5} fill={c} stroke="#000" strokeOpacity={0.5} />
          <ellipse cx={x} cy={21.2} rx={2.6} ry={1.6} fill="#fff" fillOpacity={0.8} />
        </g>
      ))}
      <rect x={12} y={34} width={104} height={74} rx={2} fill={url("glass")} stroke="#000" strokeOpacity={0.5} />
      <path d="M22 49L32 57L22 65" fill="none" stroke={tone(60, "white")} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={38} y={61} width={16} height={5} fill="#f2f2f2" />
      <rect x={22} y={76} width={46} height={5} rx={2.5} fill={tone(70, "white")} />
      <rect x={22} y={86} width={66} height={5} rx={2.5} fill="#8a939e" />
      <rect x={22} y={96} width={34} height={5} rx={2.5} fill="#8a939e" />
      <path d="M12 34H80L12 86Z" fill="#fff" fillOpacity={0.08} />
    </Svg>
  )
}

/* ── Status (constant colours, like the traffic lights) ────────────── */

/** Info — the OS-blue gel gem with a white "i". */
export function IconInfo(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Rad
          id={id("gem")}
          s={[[0, "#aee4ff"], [0.4, "#4a9df0"], [0.8, "#1b5fc6"], [1, "#0d3c8e"]]}
          cx={0.5}
          cy={0.82}
          r={0.8}
        />
      </defs>
      <Shadow cy={119} rx={38} />
      <circle cx={64} cy={62} r={50} fill={url("gem")} stroke="#0b2d73" strokeWidth={2.5} />
      <g fill="#082f6c" fillOpacity={0.45} transform="translate(0 2)">
        <circle cx={64} cy={42} r={8.5} />
        <rect x={56} y={56} width={16} height={40} rx={3} />
      </g>
      <g fill="#fff">
        <circle cx={64} cy={42} r={8.5} />
        <rect x={56} y={56} width={16} height={40} rx={3} />
      </g>
      <Gloss d={ell(64, 31, 34, 18)} s={[[0, "#fff", 0.9], [1, "#fff", 0.06]]} />
    </Svg>
  )
}

/** Warning — the yellow gel triangle with a black "!". */
export function IconWarning(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("gel")} s={[[0, "#ee9f00"], [0.5, "#fcc41c"], [1, "#ffe98f"]]} />
        <clipPath id={id("cap")}>
          <ellipse cx={64} cy={28} rx={70} ry={38} />
        </clipPath>
      </defs>
      <Shadow cy={117} rx={54} />
      <path
        d="M56.9 24Q64 12 71.1 24L114.9 98Q122 110 108 110L20 110Q6 110 13.1 98Z"
        fill={url("gel")}
        stroke="#8d5c00"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <g clipPath={url("cap")}>
        <Gloss d="M59.5 27.8Q64 20 68.5 27.8L104.5 89.2Q109 97 100 97L28 97Q19 97 23.5 89.2Z" s={[[0, "#fff", 0.9], [0.5, "#fff", 0.25]]} />
      </g>
      <path d="M58 46Q58 40 64 40Q70 40 70 46L67.5 80Q67 84 64 84Q61 84 60.5 80Z" fill="#141414" />
      <circle cx={64} cy={96} r={7} fill="#141414" />
    </Svg>
  )
}

/** Check — a green gel tick. */
export function IconCheck(props: IconProps) {
  const [id, url] = useIds()
  const tick = "M24 62L52 90L106 30"
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("gel")} s={[[0, "#26880f"], [0.45, "#46be2d"], [0.8, "#8fe06d"], [1, "#c8f7ae"]]} user y1={16} y2={104} />
        <Lin id={id("gloss")} s={[[0, "#fff", 0.9], [1, "#fff", 0.3]]} user y1={18} y2={92} />
      </defs>
      <Shadow cy={117} rx={42} />
      <path d={tick} fill="none" stroke="#1a5c0e" strokeWidth={31} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tick} fill="none" stroke={url("gel")} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={tick}
        transform="translate(0 -6)"
        fill="none"
        stroke={url("gloss")}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/* ── Index ─────────────────────────────────────────────────────────── */

export const ICONS = {
  computer: IconComputer,
  home: IconHome,
  folder: IconFolder,
  document: IconDocument,
  trash: IconTrash,
  search: IconSearch,
  preferences: IconPreferences,
  mail: IconMail,
  globe: IconGlobe,
  people: IconPeople,
  heart: IconHeart,
  star: IconStar,
  clock: IconClock,
  lock: IconLock,
  chart: IconChart,
  music: IconMusic,
  picture: IconPicture,
  download: IconDownload,
  info: IconInfo,
  warning: IconWarning,
  check: IconCheck,
  lightning: IconLightning,
  chat: IconChat,
  code: IconCode,
} as const

export type IconName = keyof typeof ICONS

/** lucide-react name → the pack icon that replaces it (a key of ICONS).
    Anything missing here has no pack equivalent: drop it rather than keep a
    thin-line icon. */
export const lucideToPack: Record<string, IconName> = {
  Monitor: "computer",
  Laptop: "computer",
  Computer: "computer",
  MonitorSmartphone: "computer",
  Server: "computer",
  HardDrive: "computer",
  Home: "home",
  House: "home",
  Folder: "folder",
  FolderOpen: "folder",
  FolderClosed: "folder",
  Folders: "folder",
  Archive: "folder",
  File: "document",
  FileText: "document",
  Files: "document",
  Notebook: "document",
  BookOpen: "document",
  ClipboardList: "document",
  Newspaper: "document",
  Trash: "trash",
  Trash2: "trash",
  Search: "search",
  ScanSearch: "search",
  Settings: "preferences",
  Settings2: "preferences",
  Cog: "preferences",
  SlidersHorizontal: "preferences",
  Wrench: "preferences",
  Mail: "mail",
  MailOpen: "mail",
  Inbox: "mail",
  Send: "mail",
  AtSign: "mail",
  Globe: "globe",
  Globe2: "globe",
  Earth: "globe",
  Link: "globe",
  Link2: "globe",
  Network: "globe",
  Wifi: "globe",
  User: "people",
  Users: "people",
  UserRound: "people",
  UsersRound: "people",
  UserPlus: "people",
  CircleUser: "people",
  Contact: "people",
  Heart: "heart",
  Star: "star",
  Sparkles: "star",
  Sparkle: "star",
  Award: "star",
  Trophy: "star",
  Clock: "clock",
  Timer: "clock",
  AlarmClock: "clock",
  Hourglass: "clock",
  History: "clock",
  CalendarClock: "clock",
  Lock: "lock",
  LockKeyhole: "lock",
  Shield: "lock",
  ShieldCheck: "lock",
  Key: "lock",
  KeyRound: "lock",
  Fingerprint: "lock",
  BarChart: "chart",
  BarChart2: "chart",
  BarChart3: "chart",
  BarChart4: "chart",
  BarChartBig: "chart",
  ChartBar: "chart",
  ChartColumn: "chart",
  ChartNoAxesColumn: "chart",
  LineChart: "chart",
  ChartLine: "chart",
  PieChart: "chart",
  ChartPie: "chart",
  TrendingUp: "chart",
  Activity: "chart",
  Music: "music",
  Music2: "music",
  Headphones: "music",
  Disc: "music",
  Radio: "music",
  Mic: "music",
  Image: "picture",
  Images: "picture",
  Camera: "picture",
  Download: "download",
  ArrowDownToLine: "download",
  CloudDownload: "download",
  DownloadCloud: "download",
  Info: "info",
  BadgeInfo: "info",
  HelpCircle: "info",
  CircleHelp: "info",
  AlertTriangle: "warning",
  TriangleAlert: "warning",
  AlertCircle: "warning",
  CircleAlert: "warning",
  OctagonAlert: "warning",
  Check: "check",
  CheckCircle: "check",
  CheckCircle2: "check",
  CircleCheck: "check",
  CircleCheckBig: "check",
  BadgeCheck: "check",
  CheckSquare: "check",
  SquareCheck: "check",
  ListChecks: "check",
  Zap: "lightning",
  Bolt: "lightning",
  Rocket: "lightning",
  Gauge: "lightning",
  Flame: "lightning",
  MessageSquare: "chat",
  MessageCircle: "chat",
  MessagesSquare: "chat",
  MessageSquareText: "chat",
  Code: "code",
  Code2: "code",
  CodeXml: "code",
  Braces: "code",
  Terminal: "code",
  SquareTerminal: "code",
  TerminalSquare: "code",
  GitBranch: "code",
  Github: "code",
  Cpu: "code",
}
