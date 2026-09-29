"use client"

import * as React from "react"

import { cn } from "@/lib/utils"


/**
 * Patina icons — DESIGN.md › Shapes, Components › Icons.
 *
 * The pack's own icon set, so a restyled page never needs a thin-line icon
 * (Lucide, Heroicons, Feather are forbidden). Eight are Olivia's own
 * pictures, loaded when an icon first draws them: Preview, QuickTime,
 * Music, Document, Trash, Folder, Heart and Star, the last four the same art
 * the desktop uses. The rest are Aqua objects drawn for Patina, things as
 * 10.0–10.3 drew them rather than symbols (a check box, a light bulb, a box
 * going in):
 * light from the top left, a crisp white gloss cap on gel and glass,
 * vertical gradients, a dark 1-unit hairline so it reads on the pinstripes
 * without a heavy outline, and a soft contact shadow under anything that
 * stands on a surface.
 *
 * Colour: an icon looks the same in every tone. Its gel parts are one fixed
 * hue (`hue` on Svg), mixed toward white or black for the shading: OS blue
 * for most, red for Mail's seal, brass for the lock, yellow for the bulb.
 * Only Folder, Heart and Star take the tone: each tone's own picture of
 * folder and heart, the star turned by --y2k-star-filter. White plastic,
 * paper, glass and metal are neutral, and the status icons keep their own
 * colours: Info's OS blue, Warning's yellow, Check's aqua check box.
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

/** The icon's own hue, fixed for each icon. Set on the Svg, so an icon's
    gradients all read the same one. */
const TONE = "var(--icon-hue)"
/** The hue mixed toward white or black (pct = how much hue remains). */
const tone = (pct: number, mix: "white" | "black") =>
  `color-mix(in srgb, var(--icon-hue) ${pct}%, ${mix})`
/** Fixed hues. OS_BLUE is the aqua tone's base, the gel the icons were drawn in. */
const OS_BLUE = "#4d83d2"
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

/** `hue` is the icon's own colour: OS blue unless it says otherwise. */
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

/** Pictures that load when an icon first draws them, not with the page:
 *  base64 WebP barely compresses, and a page that shows one icon should not
 *  carry every picture. Until the module arrives the icon is its empty box. */
function useLate<T>(load: () => Promise<T>) {
  const [value, setValue] = React.useState<T>()
  React.useEffect(() => {
    let on = true
    void load().then((v) => on && setValue(() => v))
    return () => {
      on = false
    }
  }, [load])
  return value
}
const loadPictures = () => import("./icon-pictures")
const loadHearts = () => import("./icon-hearts")
const loadMusic = () => import("./icon-music").then((m) => m.MUSIC)
const loadPreview = () => import("./icon-preview").then((m) => m.PREVIEW_PNG)
const loadQuickTime = () => import("./icon-quicktime").then((m) => m.QUICKTIME_PNG)

/** Each tone's picture as the background of `.cls`, keyed to the tone on
 *  <html> (pink when unset), so the server's HTML paints the right one and a
 *  tone change needs no render. The desktop's folder uses it too: the one
 *  <style> is shared by its href. */
export function tonePictureCss(cls: string, [pink, aqua, lime, tangerine, grape]: readonly string[]) {
  const by = { aqua, lime, tangerine, grape }
  return [
    `.${cls}{background:url(${pink}) center/contain no-repeat}`,
    ...Object.entries(by).map(([t, src]) => `html[data-tone="${t}"] .${cls}{background-image:url(${src})}`),
  ].join("\n")
}

/** One of Olivia's pictures as the icon, once it has loaded. Each is sized
 *  to look as big as the rest when it is inlined (scripts/picture-size.mjs):
 *  the Finder face and the folder had the most room round them. The drawn
 *  icons are drawn to the grid at 81–91% of the box. */
function Picture({ src, ...props }: IconProps & { src?: string }) {
  return <Svg {...props}>{src && <image href={src} width={128} height={128} />}</Svg>
}

/** A picture in the tone's own colour: each tone's is the background of the
 *  svg, swapped by the stylesheet. */
function TonePicture({ cls, pictures, className, ...props }: IconProps & { cls: string; pictures?: readonly string[] }) {
  return (
    <>
      {pictures && (
        <style href={cls} precedence="default">
          {tonePictureCss(cls, pictures)}
        </style>
      )}
      <Svg {...props} className={cn(cls, className)} />
    </>
  )
}

/* ── Places and things ─────────────────────────────────────────────── */

/** Computer — a white iMac, its dark glass screen in a pale bezel. */
export function IconComputer(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("shell")} s={[[0, "#ffffff"], [0.6, "#e3e9f1"], [1, "#b8c4d3"]]} />
        <Lin id={id("bezel")} s={[[0, "#eef1f5"], [1, "#c9d1db"]]} />
        <Lin id={id("screen")} s={[[0, "#4a4a4a"], [0.55, "#1c1c1c"], [1, "#050505"]]} x2={1} y2={1} />
      </defs>
      <Shadow cy={117} rx={40} />
      {/* The foot, then the rounded white shell */}
      <path d="M44 102h40l8 12H36z" fill={url("shell")} stroke={INK} />
      <path d="M18 28c0-12 8-17 20-17h52c12 0 20 5 20 17l2 58c0 14-8 20-22 20H38c-14 0-22-6-22-20z" fill={url("shell")} stroke={INK} />
      <Gloss d="M24 26c0-8 6-11 15-11h50c9 0 15 3 15 11Q64 20 24 26Z" s={[[0, "#fff", 0.95], [1, "#fff", 0.2]]} />
      {/* The dark glass in a pale bezel, with a diagonal catch of light */}
      <rect x={29} y={19} width={70} height={58} rx={6} fill={url("bezel")} stroke="#9aa4b0" />
      <rect x={32} y={22} width={64} height={52} rx={4} fill={url("screen")} stroke="rgba(0,0,0,0.6)" />
      <path d="M33 23h40L33 63z" fill="rgba(255,255,255,0.14)" />
      {/* Speakers and the disc slot */}
      <circle cx={36} cy={90} r={4} fill="#aab3be" stroke="#8a95a3" />
      <circle cx={92} cy={90} r={4} fill="#aab3be" stroke="#8a95a3" />
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
      <rect x={84} y={24} width={11} height={28} fill="#d8ccb2" stroke="#6b5a3e" />
      {/* The wall and gable, under a dark roof edge */}
      <path d="M26 58L64 24l38 34v52H26z" fill={url("wall")} stroke="#6b5a3e" />
      <path d="M14 64L64 19l50 45" fill="none" stroke="#2b2724" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* A shuttered window and the door */}
      <rect x={55} y={44} width={18} height={16} fill="#f7f4ec" stroke="#6b5a3e" />
      <rect x={49} y={44} width={6} height={16} fill={url("wood")} />
      <rect x={73} y={44} width={6} height={16} fill={url("wood")} />
      <rect x={54} y={74} width={20} height={36} fill={url("wood")} stroke="#5a2e0e" />
      <path d="M60 78v28M68 78v28" stroke="rgba(0,0,0,0.25)" />
      <circle cx={70} cy={93} r={1.6} fill="#f3d27a" />
    </Svg>
  )
}

/** Folder — Olivia's Aqua folder in the tone's own colour. */
export function IconFolder(props: IconProps) {
  const p = useLate(loadPictures)
  return <TonePicture {...props} cls="y2k-folder" pictures={p && [p.FOLDER_PINK, p.FOLDER_AQUA, p.FOLDER_LIME, p.FOLDER_TANGERINE, p.FOLDER_GRAPE]} />
}

/** Document — Olivia's clean sheet with a folded corner. */
export function IconDocument(props: IconProps) {
  return <Picture {...props} src={useLate(loadPictures)?.DOC} />
}

/** Trash — Olivia's wire-mesh Bin. */
export function IconTrash(props: IconProps) {
  return <Picture {...props} src={useLate(loadPictures)?.BIN} />
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
        <rect x={12} y={-11} width={40} height={22} rx={11} fill={url("grip")} stroke={RIM} />
        <Gloss d={rr(18, -8, 28, 7, 3.5)} />
        <rect x={0} y={-8} width={15} height={16} rx={2} fill={url("ring")} stroke={INK} />
      </g>
      <circle cx={52} cy={52} r={34} fill={url("lens")} />
      <circle cx={52} cy={52} r={34} fill="none" stroke={url("ring")} strokeWidth={9} />
      <circle cx={52} cy={52} r={38.5} fill="none" stroke={INK} />
      <circle cx={52} cy={52} r={29.5} fill="none" stroke={INK} strokeOpacity={0.6} />
      <path d="M31 50A21 21 0 0 1 50 31" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <path d="M72 58A21 21 0 0 1 60 72" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  )
}

/** Preferences — the light switch on a bright metal plate that System
    Preferences was in 10.0–10.3, its white rocker up. */
export function IconPreferences(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("plate")} s={[[0, "#fbfbfc"], [0.45, "#dfe3e8"], [0.7, "#f3f4f6"], [1, "#b9c0c9"]]} />
        <Lin id={id("slot")} s={[[0, "#59616b"], [1, "#a9b1bb"]]} />
        <Lin id={id("rocker")} s={PLASTIC} />
      </defs>
      <Shadow cy={119} rx={40} />
      <path d={rr(22, 10, 84, 104, 14)} fill={url("plate")} stroke={INK} />
      <Gloss d="M28 22Q28 14 36 14H92Q100 14 100 22V40Q64 50 28 40Z" s={[[0, "#fff", 0.9], [1, "#fff", 0.1]]} />
      {/* Two screws, their slots turned */}
      {[24, 100].map((cy) => (
        <g key={cy}>
          <circle cx={64} cy={cy} r={4.5} fill={url("rocker")} stroke={INK} strokeOpacity={0.7} />
          <path d={`M61 ${cy + 2}L67 ${cy - 2}`} stroke="#6b737d" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      ))}
      {/* The switch in its slot, up */}
      <path d={rr(44, 36, 40, 56, 8)} fill={url("slot")} stroke={INK} />
      <path d={rr(48, 40, 32, 26, 6)} fill={url("rocker")} stroke={INK} strokeOpacity={0.8} />
      <path d={rr(51, 42, 26, 9, 4.5)} fill="#fff" fillOpacity={0.85} />
      <path d="M48 66H80V70Q80 76 74 76H54Q48 76 48 70Z" fill="#000" fillOpacity={0.18} />
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
      <rect x={8} y={28} width={112} height={76} rx={6} fill={url("paper")} stroke={INK} />
      <path d="M11 101L53 66M117 101L75 66" stroke="#aab5c1" strokeWidth={2} />
      <path d="M12 103L54 68M116 103L74 68" stroke="#fff" strokeWidth={1.5} />
      <path d="M9.5 31L60 74Q64 77.5 68 74L118.5 31" fill="#000" fillOpacity={0.08} transform="translate(0 3)" />
      <path
        d="M9.5 31Q10 28 14 28H114Q118 28 118.5 31L68 74Q64 77.5 60 74Z"
        fill={url("flap")}
        stroke="#6a7582"
        strokeLinejoin="round"
      />
      <g transform="translate(64 74) scale(0.24) translate(-64 -63)">
        <path d={HEART} fill={url("seal")} stroke={RIM} strokeWidth={4} strokeLinejoin="round" />
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
      {/* A 1px rim (at 128), as dark as the Aqua pictures beside it in the
          Dock draw theirs: 2.5 made the only heavy outline among them. */}
      <circle cx={64} cy={62} r={50} fill="none" stroke="#0a2c6b" strokeWidth={1} />
      <Gloss d={ell(64, 34, 36, 20)} s={[[0, "#fff", 0.92], [1, "#fff", 0.08]]} />
    </Svg>
  )
}

/** Pager — a white pager, a greeting on its green screen, three black keys
    (read, up, next) and the speaker's slots; its belt clip along the top.
    White plastic and the green LCD are neutral: the same in every tone. */
export function IconPager(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("body")} s={PLASTIC} />
        <Lin id={id("clip")} s={[[0, "#f6f8fa"], [1, "#c3cbd5"]]} />
        <Lin id={id("bezel")} s={[[0, "#dde2e8"], [1, "#aab4c0"]]} />
        <Lin id={id("lcd")} s={[[0, "#cfe8a4"], [0.55, "#a8cc74"], [1, "#86ad52"]]} x2={1} y2={1} />
        <Lin id={id("key")} s={[[0, "#55524d"], [0.5, "#26241f"], [1, "#0d0c0a"]]} />
        <Rad id={id("led")} s={[[0, "#e4ffc8"], [0.6, "#8fd65a"], [1, "#3f8a22"]]} cx={0.4} cy={0.35} r={0.7} />
      </defs>
      <Shadow cy={111} rx={50} />
      <path d="M52 31V27Q52 24 56 24H104Q109 24 110 28L111 31Z" fill={url("clip")} stroke={INK} />
      <path d={rr(10, 28, 108, 78, 14)} fill={url("body")} stroke={INK} />
      <Gloss d="M14 42Q14 31 26 31H102Q114 31 114 42Q64 49 14 42Z" s={[[0, "#fff", 0.95], [1, "#fff", 0.2]]} />
      {/* The screen: a grey bezel round the green glass, the greeting on it */}
      <path d={rr(20, 40, 72, 28, 6)} fill={url("bezel")} stroke="#8a95a3" />
      <path d={rr(25, 44, 62, 20, 3)} fill={url("lcd")} stroke="#5d7a3a" strokeOpacity={0.6} />
      <g fill="#223d16" fillOpacity={0.85}>
        <rect x={29} y={48} width={30} height={3} rx={1} />
        <rect x={29} y={55} width={20} height={3} rx={1} />
        <rect x={51} y={55} width={3} height={3} />
      </g>
      <path d="M26 45H70L40 63H26Z" fill="#fff" fillOpacity={0.18} />
      <circle cx={104} cy={46} r={3.5} fill={url("led")} stroke={INK} strokeOpacity={0.6} />
      {/* Three black keys, their glyphs: read, up, next */}
      {[17, 50, 83].map((x) => (
        <g key={x}>
          <path d={rr(x, 73, 28, 11, 5.5)} fill={url("key")} stroke="#000" strokeOpacity={0.5} />
          <path d={rr(x + 3, 74.5, 22, 3, 1.5)} fill="#fff" fillOpacity={0.18} />
        </g>
      ))}
      <path d={rr(26, 77.5, 10, 2.5, 1.25)} fill="#a8ec72" />
      <path d="M64 75.5L68 80.5H60ZM95 76L100 78.5L95 81Z" fill="#fff" />
      <path d="M98 99L102 90M103 99L107 90M108 99L112 90" stroke="#5a636e" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

/** People — two framed portraits, as the login window framed its users'
    pictures: one behind, one in front, a bust against the sky in each. */
export function IconPeople(props: IconProps) {
  const [id, url] = useIds()
  const frame = (x: number, y: number, sky: string, key: string) => (
    <g key={key}>
      <path d={rr(x, y, 62, 62, 6)} fill={url("frame")} stroke={INK} />
      <path d={rr(x + 6, y + 6, 50, 50, 2)} fill={url(sky)} stroke="#000" strokeOpacity={0.35} />
      <circle cx={x + 31} cy={y + 26} r={10} fill={url("bust")} />
      <path d={`M${x + 12} ${y + 56}C${x + 12} ${y + 42} ${x + 20} ${y + 37} ${x + 31} ${y + 37}C${x + 42} ${y + 37} ${x + 50} ${y + 42} ${x + 50} ${y + 56}Z`} fill={url("bust")} />
      <path d={`M${x + 7} ${y + 7}H${x + 55}V${y + 24}Q${x + 31} ${y + 30} ${x + 7} ${y + 24}Z`} fill="#fff" fillOpacity={0.25} />
    </g>
  )
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("frame")} s={PLASTIC} />
        <Lin id={id("sky")} s={[[0, "#5f9fe6"], [1, "#cfe6ff"]]} />
        <Lin id={id("dusk")} s={[[0, "#8fb8e0"], [1, "#f0e2cf"]]} />
        <Lin id={id("bust")} s={[[0, "#ffffff"], [1, "#b6c0cc"]]} />
      </defs>
      <Shadow cy={118} rx={50} />
      {frame(52, 10, "dusk", "back")}
      {frame(14, 44, "sky", "front")}
    </Svg>
  )
}

/* ── Marks ─────────────────────────────────────────────────────────── */

/** Heart — Olivia's gel heart in the tone's own colour. */
export function IconHeart(props: IconProps) {
  const h = useLate(loadHearts)
  return <TonePicture {...props} cls="y2k-heart" pictures={h && [h.HEART_PINK, h.HEART_AQUA, h.HEART_LIME, h.HEART_TANGERINE, h.HEART_GRAPE]} />
}

/** Star — Olivia's gel star, turned to the tone by --y2k-star-filter. */
export function IconStar({ style, ...props }: IconProps) {
  return <Picture {...props} style={{ filter: "var(--y2k-star-filter, none)", ...style }} src={useLate(loadPictures)?.STAR} />
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
      <circle cx={64} cy={62} r={54} fill={url("bezel")} stroke={RIM} />
      <path d="M27.2 31.1A48 48 0 0 1 100.8 31.1" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
      <circle cx={64} cy={62} r={42} fill={url("face")} stroke={tone(40, "black")} />
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
      <path d={shackle} fill="none" stroke={INK} strokeWidth={13.5} />
      <path d={shackle} fill="none" stroke={url("steel")} strokeWidth={11.5} />
      <rect x={20} y={54} width={88} height={62} rx={12} fill={url("gel")} stroke={RIM} />
      <Gloss d={rr(26, 58, 76, 24, 8)} />
      <path d="M64 71A9 9 0 0 1 69 87.5L72 102H56L59 87.5A9 9 0 0 1 64 71Z" fill={tone(18, "black")} />
      <path d="M57.5 103.5H70.5" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

/** Chart — a sheet of graph paper with a bar chart on it: three glossy
    bars, blue, green and orange, over a pale blue grid. */
export function IconChart(props: IconProps) {
  const [id, url] = useIds()
  const bars = [
    [30, 70, "#3d7fd6", "#9cc8f7"],
    [54, 46, "#2f9a2a", "#a6e38a"],
    [78, 26, "#e07a12", "#fcd08a"],
  ] as const
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("paper")} s={[[0, "#ffffff"], [0.7, "#f3f5f8"], [1, "#dde2e8"]]} />
        <pattern id={id("grid")} width={8} height={8} patternUnits="userSpaceOnUse">
          <path d="M8 0V8H0" fill="none" stroke="#b9d3ee" strokeWidth={0.75} />
        </pattern>
        {bars.map(([x, , dark, light]) => (
          <Lin key={x} id={id(`bar${x}`)} s={[[0, dark], [0.35, light], [0.6, dark], [1, dark]]} x2={1} y2={0} />
        ))}
      </defs>
      <Shadow cy={117} rx={54} />
      <path d={rr(10, 14, 108, 96, 4)} fill={url("paper")} stroke={INK} />
      <rect x={18} y={20} width={92} height={80} fill={url("grid")} />
      <path d="M22 20V98H112" fill="none" stroke="#6b737d" strokeWidth={1.5} />
      {bars.map(([x, y, dark]) => (
        <g key={x}>
          <path d={rr(x, y, 18, 98 - y, 3)} fill={url(`bar${x}`)} stroke={dark} />
          <Gloss d={rr(x + 3, y + 2, 12, 8, 3)} s={[[0, "#fff", 0.9], [1, "#fff", 0.1]]} />
        </g>
      ))}
    </Svg>
  )
}

/** Music — Olivia's CD under a blue note: a picture, loaded when first
    drawn. */
export function IconMusic(props: IconProps) {
  return <Picture {...props} src={useLate(loadMusic)} />
}

/** Preview — two prints and a loupe: Olivia's own artwork, a PNG (one of
    the two icons not drawn here), its shadow in the picture. */
export function IconPreview(props: IconProps) {
  return <Picture {...props} src={useLate(loadPreview)} />
}

/** QuickTime Player — the Q on a metal player: Olivia's own artwork, a PNG
    (the other icon not drawn here), its shadow in the picture. */
export function IconQuickTime(props: IconProps) {
  return <Picture {...props} src={useLate(loadQuickTime)} />
}

/** Download — an open cardboard box, as the Installer's was, with a gel
    arrow dropping into it. */
export function IconDownload(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("front")} s={[[0, "#e2b577"], [1, "#b27c3e"]]} />
        <Lin id={id("flap")} s={[[0, "#f0cd94"], [1, "#cf9a58"]]} />
        <Lin id={id("inside")} s={[[0, "#6e4718"], [1, "#9a6a33"]]} />
        <Lin id={id("gel")} s={GEL} />
      </defs>
      <Shadow cy={117} rx={52} />
      {/* The inside and the open flaps */}
      <path d="M20 64L32 50H96L108 64Z" fill={url("inside")} stroke="#6e4a1e" strokeLinejoin="round" />
      <path d="M20 64L6 46L30 42L32 50Z" fill={url("flap")} stroke="#6e4a1e" strokeLinejoin="round" />
      <path d="M108 64L122 46L98 42L96 50Z" fill={url("flap")} stroke="#6e4a1e" strokeLinejoin="round" />
      {/* The arrow, going in */}
      <path
        d="M54 10Q54 6 58 6H70Q74 6 74 10V40H86Q90 40 87.5 43L66.5 68Q64 71 61.5 68L40.5 43Q38 40 42 40H54Z"
        fill={url("gel")}
        stroke={RIM}
        strokeLinejoin="round"
      />
      <Gloss d={rr(57, 9, 14, 24, 3)} />
      {/* The front of the box, taped */}
      <path d="M20 64H108V106Q108 110 104 110H24Q20 110 20 106Z" fill={url("front")} stroke="#6e4a1e" strokeLinejoin="round" />
      <path d="M56 64H72V110H56Z" fill="#f4e3c2" fillOpacity={0.55} />
      <path d="M21 65H107" stroke="#fff" strokeOpacity={0.45} />
    </Svg>
  )
}

/** Lightning — a light bulb, as Energy Saver's was: warm glass round a
    filament, on a bright metal screw. */
export function IconLightning(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props} hue={BOLT_YELLOW}>
      <defs>
        <Rad id={id("glass")} s={[[0, "#fffdf0"], [0.55, tone(45, "white")], [1, tone(85, "white")]]} cx={0.45} cy={0.4} r={0.65} />
        <Rad id={id("glow")} s={[[0, TONE, 0.55], [1, TONE, 0]]} />
        <Lin id={id("screw")} s={CHROME} x2={1} y2={0} />
      </defs>
      <Shadow cy={120} rx={24} ry={4} />
      <circle cx={64} cy={48} r={46} fill={url("glow")} />
      <path
        d="M64 10C87 10 102 27 102 48C102 64 92 72 88 82V88H40V82C36 72 26 64 26 48C26 27 41 10 64 10Z"
        fill={url("glass")}
        stroke={tone(40, "black")}
      />
      <path d="M54 88V70L58 60L62 70L66 60L70 70L74 60V88" fill="none" stroke="#d96a12" strokeWidth={2} strokeLinejoin="round" />
      <Gloss d={ell(52, 32, 16, 12)} s={[[0, "#fff", 0.95], [1, "#fff", 0.1]]} />
      {/* The screw, threaded, and its dark foot */}
      <path d={rr(42, 88, 44, 20, 3)} fill={url("screw")} stroke={INK} />
      <path d="M43 94H85M43 100H85" stroke={INK} strokeOpacity={0.45} />
      <path d="M52 108H76L72 116H56Z" fill="#3a3f46" stroke={INK} strokeLinejoin="round" />
    </Svg>
  )
}

/** Chat — one speech bubble of blue glass, as iChat's was: thick, clear,
    lit from the top, its tail at the foot. */
export function IconChat(props: IconProps) {
  const [id, url] = useIds()
  const bubble = "M64 14C95 14 118 32 118 56C118 80 95 98 64 98C58 98 53 97.4 48 96.4L22 114L30 90C17 82 10 70 10 56C10 32 33 14 64 14Z"
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("glass")} s={[[0, "#2f74d0"], [0.45, "#7ab6f4"], [0.85, "#c9e4ff"], [1, "#eaf5ff"]]} />
      </defs>
      <Shadow cy={118} rx={46} />
      <path d={bubble} fill={url("glass")} stroke={RIM} strokeLinejoin="round" />
      <path d={bubble} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} transform="translate(64 56) scale(0.94) translate(-64 -56)" />
      <Gloss d="M22 48C24 30 42 20 64 20C86 20 104 30 106 48Q64 40 22 48Z" s={[[0, "#fff", 0.95], [1, "#fff", 0.15]]} />
    </Svg>
  )
}

/* ── Status (constant colours, like the traffic lights) ────────────── */

/** Info — a marble of blue glass with a white "i" seen through it: dark at
    the top under the gloss, bright where the light gathers at its foot. */
export function IconInfo(props: IconProps) {
  const [id, url] = useIds()
  return (
    <Svg {...props}>
      <defs>
        <Rad
          id={id("glass")}
          s={[[0, "#c6efff"], [0.35, "#5fb0f4"], [0.75, "#1c62c9"], [1, "#0d3c8e"]]}
          cx={0.5}
          cy={0.86}
          r={0.86}
        />
        <Rad id={id("caustic")} s={[[0, "#e6fbff", 0.9], [1, "#e6fbff", 0]]} />
      </defs>
      <Shadow cy={119} rx={38} />
      <circle cx={64} cy={62} r={50} fill={url("glass")} stroke="#0b2d73" />
      <ellipse cx={64} cy={96} rx={30} ry={12} fill={url("caustic")} />
      <g fill="#0a2c6b" fillOpacity={0.35} transform="translate(0 2)">
        <circle cx={64} cy={42} r={8.5} />
        <rect x={56} y={56} width={16} height={40} rx={3} />
      </g>
      <g fill="#fff">
        <circle cx={64} cy={42} r={8.5} />
        <rect x={56} y={56} width={16} height={40} rx={3} />
      </g>
      <Gloss d={ell(64, 32, 36, 20)} s={[[0, "#fff", 0.92], [1, "#fff", 0.05]]} />
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

/** Check — the pack's own Aqua check box, ticked, at icon size: its twelve
    measured rows (the aqua tone's, so the same in every tone) and its black
    tick running out past the top right, both scaled seven times. */
export function IconCheck(props: IconProps) {
  const [id, url] = useIds()
  const rows = ["#b0b9e2", "#aac6ef", "#4b8fda", "#4489d3", "#609bdc", "#81b9f6", "#93c7fe", "#a3d3ff", "#b3e0ff", "#c6f3fe", "#dafefd", "#93b4b7"]
  return (
    <Svg {...props}>
      <defs>
        <Lin id={id("box")} s={rows.map((c, i) => [(i + 0.5) / 12, c] as const)} />
        <Lin id={id("sides")} s={[[0, "#2c5f9e", 0.35], [0.07, "#2c5f9e", 0], [0.93, "#2c5f9e", 0], [1, "#2c5f9e", 0.35]]} x2={1} y2={0} />
      </defs>
      <Shadow cy={120} rx={44} />
      <path d={rr(20, 30, 84, 84, 6)} fill={url("box")} stroke={RIM} />
      <path d={rr(20, 30, 84, 84, 6)} fill={url("sides")} />
      <path d="M36.8 53.1L59.2 95.1L108.9 16.7" fill="none" stroke="#000" strokeWidth={13.3} strokeLinejoin="round" />
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
  pager: IconPager,
  people: IconPeople,
  heart: IconHeart,
  star: IconStar,
  clock: IconClock,
  lock: IconLock,
  chart: IconChart,
  music: IconMusic,
  preview: IconPreview,
  quicktime: IconQuickTime,
  download: IconDownload,
  info: IconInfo,
  warning: IconWarning,
  check: IconCheck,
  lightning: IconLightning,
  chat: IconChat,
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
  Image: "preview",
  Images: "preview",
  Camera: "preview",
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
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
