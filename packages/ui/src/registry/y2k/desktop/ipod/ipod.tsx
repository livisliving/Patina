"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox, SearchField, Slider } from "@/components/ui/forms"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WindowScrollArea, WindowWell } from "@/components/ui/window"
import { WindowSidebar, WindowSidebarItem } from "@/components/ui/window-sidebar"
import { cn } from "@/lib/utils"
import { parseColor } from "@/lib/color"

import { STATIONS, TRACKS, createPlayer, duration, type Player, type Track } from "./ipod-synth"
import { Visualiser } from "./ipod-visualiser"
import { STAR_MASK } from "./star-mask"
import { useVolume } from "../volume"
import { useTone } from "../use-tone"

/**
 * The iPod: iTunes 2 on 10.1 (Olivia's screenshot), rebuilt from the pack's
 * parts on brushed metal — round buttons for the transport, the slider for
 * volume, a status display, the search field, the source list, the list view
 * and iTunes 4's rounded buttons along the foot. Sized off the 1× screenshot and put on the
 * 4px grid: a 64px control strip, 16px margins round the panes, 18px rows.
 * The Apple logo in the idle display is the Patina star.
 */

type Column = "title" | "time" | "artist"
type Source = { id: string; label: string; kind: "library" | "radio" | "playlist"; songs?: string[] }

const HEADER = 17
const ROW = 18

/** The list in a random order, for shuffle. */
function shuffled<T>(list: T[]) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

/* ── Glyphs ───────────────────────────────────────────────────────── */

/** A transport glyph at the reference's size, flat in the button's grey. */
function Glyph({ d, w, h, className }: { d: string; w: number; h: number; className?: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={cn("size-auto", className)} aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  )
}
const PREV = "M8 0v9L0 4.5zM16 0v9L8 4.5z"
const NEXT = "M0 0v9l8-4.5zM8 0v9l8-4.5z"
const PLAY = "M0 0l13 7.5L0 15z"
const PAUSE = "M0 0h4v15H0zM8 0h4v15H8z"

/** The foot's glyphs, 16×14, as iTunes 4 draws them: a heavy plus, arrows
 *  with solid heads. */
const FOOT = {
  add: <path d="M8 1.5v11M2.5 7h11" strokeWidth="2.6" strokeLinecap="butt" />,
  shuffle: (
    <>
      <path d="M1 4h3l6 6h2M1 10h3l6-6h2" strokeWidth="1.8" />
      <path d="M11.5 1.5l4 2.5-4 2.5zM11.5 7.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  repeat: (
    <>
      <path d="M2 8.5V6.5A2.5 2.5 0 0 1 4.5 4H11M14 5.5v2A2.5 2.5 0 0 1 11.5 10H5" strokeWidth="1.8" />
      <path d="M10.5 1.5l4 2.5-4 2.5zM5.5 7.5L1.5 10l4 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  visuals: (
    <>
      <path d="M8 1v12M2 7h12M3.8 2.8l8.4 8.4M12.2 2.8l-8.4 8.4" strokeWidth="1.5" />
      <circle cx="8" cy="7" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  eject: <path d="M8 2l6 6H2zM2 10h12v2H2z" fill="currentColor" stroke="none" />,
} satisfies Record<string, React.ReactNode>

/** A button of the foot, as iTunes 4 draws them: 32×24, 4px corners, a #666
 *  rim round a pale bevel (#f0f0f0 and white at the top, #dedede to #bababa,
 *  then two dark rows), a white line under it on the metal; the glyph
 *  near-black, embossed. On (shuffle, repeat, the visualiser), the glyph
 *  lights up in the tone. */
function FootButton({ on, className, ...props }: React.ComponentProps<"button"> & { on?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        "flex h-6 w-8 shrink-0 cursor-default items-center justify-center rounded-[4px] border border-[#666] outline-none",
        "bg-[linear-gradient(to_bottom,#f0f0f0_0_1px,#fff_1px_2px,#fdfdfd_2px_3px,#dedede_3px,#bababa_20px,#9f9f9f_20px_21px,#858585_21px)]",
        "shadow-[0_1px_0_rgba(255,255,255,0.75),0_0_0_1px_rgba(0,0,0,0.1)] active:brightness-90",
        "text-[#2b2b2b] [&_svg]:drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]",
        "aria-pressed:text-(--y2k-tone) aria-pressed:[&_svg]:drop-shadow-[0_0_2px_color-mix(in_srgb,var(--y2k-tone)_70%,transparent)]",
        "focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-(--y2k-tone-focus)",
        className
      )}
      {...props}
    />
  )
}

function FootGlyph({ name }: { name: keyof typeof FOOT }) {
  return (
    <svg viewBox="0 0 16 14" className="h-[14px] w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {FOOT[name]}
    </svg>
  )
}

/** The volume's speakers: one 6×10 body at both ends, the loud one with two
 *  waves, each with the metal's white catch a pixel down and right. */
function Speaker({ loud }: { loud?: boolean }) {
  const w = loud ? 12 : 7
  const art = (
    <>
      <path d="M0 3h3l3-3v10L3 7H0z" />
      {loud && <path d="M7 1.5a5 5 0 0 1 0 7M8.5 0.5a5.3 5.3 0 0 1 0 9" fill="none" stroke="currentColor" />}
    </>
  )
  return (
    <svg viewBox={`0 0 ${w} 11`} width={w} height={11} className="shrink-0 -translate-y-px" aria-hidden>
      <g fill="currentColor" transform="translate(1 1)" className="text-white/60">
        {art}
      </g>
      <g fill="currentColor" className="text-[#393939]">
        {art}
      </g>
    </svg>
  )
}

/** The iris's colours round the clock from the top, read off the
 *  reference: cyan, green, yellow, red at the foot, magenta, violet, blue. */
const IRIS = ["#40dcd8", "#70df88", "#c4fb74", "#dcd84e", "#f47c6c", "#d048c8", "#be74fc", "#a8b0f0"]
const mix = (a: string, b: string, t: number) => {
  const [p, q] = [parseColor(a)!, parseColor(b)!]
  return `rgb(${[p.r * (1 - t) + q.r * t, p.g * (1 - t) + q.g * t, p.b * (1 - t) + q.b * t].map(Math.round).join(", ")})`
}
/** SVG has no conic gradient: 32 wedges, each a blend between the stops. */
const WEDGES = Array.from({ length: 32 }, (_, i) => {
  const [a, b] = [(i / 32) * Math.PI * 2, ((i + 1.1) / 32) * Math.PI * 2]
  const at = ((i + 0.5) / 32) * IRIS.length
  const fill = mix(IRIS[Math.floor(at)], IRIS[(Math.floor(at) + 1) % IRIS.length], at % 1)
  const pt = (t: number) => `${(9.5 + 6 * Math.sin(t)).toFixed(2)} ${(6.5 - 6 * Math.cos(t)).toFixed(2)}`
  return { d: `M9.5 6.5L${pt(a)}A6 6 0 0 1 ${pt(b)}z`, fill }
})

/** Browse: the reference's 19×13 eye — dark lids, a rainbow iris darkening
 *  to its rim, the pupil, a catchlight up and to the left. */
function Eye() {
  const id = React.useId()
  return (
    <svg viewBox="0 0 19 13" width={19} height={13} className="size-auto" aria-hidden>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.38" stopColor="#adadad" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="0.62" stopColor="#adadad" />
        </linearGradient>
        <radialGradient id={`${id}r`}>
          <stop offset="0.45" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <path d="M0.5 6.5L4 2.6Q6 0.5 9.5 0.5T15 2.6L18.5 6.5L15 10.4Q13 12.5 9.5 12.5T4 10.4z" fill={`url(#${id}l)`} stroke="#393939" strokeLinejoin="round" />
      {WEDGES.map((w) => (
        <path key={w.d} d={w.d} fill={w.fill} />
      ))}
      <circle cx="9.5" cy="6.5" r="6" fill={`url(#${id}r)`} stroke="#393939" />
      <circle cx="9.5" cy="6.7" r="2.4" fill="#313131" />
      <circle cx="6.8" cy="4" r="1.5" fill="#fff" fillOpacity="0.75" />
    </svg>
  )
}

/** Source-list icons, 16px: the library, the radio, a playlist. */
const SOURCE_ICON: Record<Source["kind"], React.ReactNode> = {
  library: (
    <svg viewBox="0 0 16 16" aria-hidden>
      <rect x="3.5" y="1.5" width="11" height="11" rx="1.5" fill="#f1cf72" stroke="#9c7a24" />
      <rect x="1.5" y="3.5" width="11" height="11" rx="1.5" fill="#fbe39c" stroke="#9c7a24" />
      <path d="M9 6v4.6a1.6 1.6 0 1 1-1-1.5V5.3l2.6-.8v1.4z" fill="#111" />
    </svg>
  ),
  radio: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 5L5 15M8 5l3 10M6.2 11h3.6M5.6 13.4h4.8" stroke="#222" strokeWidth="1.2" />
      <circle cx="8" cy="4" r="1.2" fill="#222" />
      <path d="M4.8 1.5a4 4 0 0 0 0 5M11.2 1.5a4 4 0 0 1 0 5M2.8 0.5a6.5 6.5 0 0 0 0 7M13.2 0.5a6.5 6.5 0 0 1 0 7" style={{ stroke: "var(--y2k-tone)" }} strokeWidth="1.1" />
    </svg>
  ),
  playlist: (
    <svg viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="1.5" width="12" height="13" rx="1.5" style={{ fill: "var(--y2k-tone)" }} stroke="rgba(0,0,0,0.45)" />
      <path d="M9 4.5v5.1a1.6 1.6 0 1 1-1-1.5V4l2.6-.8v1.4z" fill="#fff" />
    </svg>
  ),
}

/* ── Parts ────────────────────────────────────────────────────────── */

/** The recessed metal a control sits in, measured down the reference's
 *  wells against its metal: dark under the top edge, clear at the middle,
 *  lit along the foot. Laid over the metal, so it shades ours the same way. */
const WELL_STOPS: [number, string][] = [
  [0, "rgba(0,0,0,0.32)"],
  [0.1, "rgba(0,0,0,0.28)"],
  [0.2, "rgba(0,0,0,0.18)"],
  [0.3, "rgba(0,0,0,0.07)"],
  [0.38, "rgba(0,0,0,0)"],
  [0.46, "rgba(255,255,255,0.22)"],
  [0.6, "rgba(255,255,255,0.38)"],
  [0.7, "rgba(255,255,255,0.44)"],
  [0.9, "rgba(255,255,255,0.58)"],
  [1, "rgba(255,255,255,0.8)"],
]
const WELL = { backgroundImage: `linear-gradient(to bottom, ${WELL_STOPS.map(([at, c]) => `${c} ${at * 100}%`).join(", ")})` }

/** The volume's layout: the pack's metal slider between the speakers. */
const VOLUME = "mx-[5px] min-w-0 flex-1"

/** A control over its 11px label, as the reference sets Search and Browse. */
function Labeled({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-[3px]", className)}>
      {children}
      <span className="text-[11px] leading-none text-(--y2k-ink)">{label}</span>
    </div>
  )
}

/** The status display: the Patina star at rest; the song, its artist and
 *  where it has got to while one is loaded. It keeps its own clock, read
 *  off the player four times a second while `ticking`, so only it redraws;
 *  give it a `key` per song so a new one starts from 0:00. */
function Display({
  track,
  player,
  ticking,
  className,
}: {
  track: Track | null
  player: React.RefObject<Player | null>
  ticking: boolean
  className?: string
}) {
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!ticking) return
    const id = setInterval(() => setElapsed(player.current?.elapsed() ?? 0), 250)
    return () => clearInterval(id)
  }, [ticking, player])
  const total = track ? duration(track) : 0
  return (
    <WindowWell
      className={cn(
        "flex h-12 w-61 flex-col items-center justify-center rounded-[20px] bg-[#dee7c6] px-6 text-[#323931]",
        // The measured edge, row by row: two dark rows along the top and a
        // three-row fall into the face; a grey pixel and a two-pixel fall at
        // the sides; one darker row at the foot, and the metal's white catch
        // under it.
        "shadow-[inset_0_1px_0_#6b6b6b,inset_0_2px_0_#636363,inset_0_3px_0_rgba(0,0,0,0.26),inset_0_4px_0_rgba(0,0,0,0.115),inset_0_5px_0_rgba(0,0,0,0.04),inset_1px_0_0_#b5b5b5,inset_-1px_0_0_#b5b5b5,inset_2px_0_0_rgba(0,0,0,0.2),inset_-2px_0_0_rgba(0,0,0,0.2),inset_3px_0_0_rgba(0,0,0,0.07),inset_-3px_0_0_rgba(0,0,0,0.07),inset_0_-1px_0_rgba(0,0,0,0.15),0_1px_0_#fff,0_2px_0_rgba(255,255,255,0.6)]",
        className
      )}
    >
      {!track ? (
        // At rest, the Patina star where iTunes has its logo: flat in the
        // display's ink, with the logo's faint drop down and to the right.
        <span className="drop-shadow-[1px_2px_3px_rgba(0,0,0,0.35)]">
          <span aria-hidden className="block size-9 bg-current mask-contain mask-center mask-no-repeat" style={{ maskImage: `url(${STAR_MASK})` }} />
        </span>
      ) : (
        <div className="flex w-full flex-col items-center text-[11px] leading-[13px]">
          <span className="max-w-full truncate font-bold">{track.title}</span>
          <span className="max-w-full truncate">
            {track.artist} — {track.album}
          </span>
          {Number.isFinite(total) ? (
            <span className="flex w-full items-center gap-2 tabular-nums">
              <span>{clock(elapsed)}</span>
              <span className="relative h-[7px] flex-1 rounded-full border border-current">
                <span className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
              </span>
              <span>-{clock(Math.max(0, total - elapsed))}</span>
            </span>
          ) : (
            <span className="tabular-nums">Elapsed Time: {clock(elapsed)}</span>
          )}
        </div>
      )}
    </WindowWell>
  )
}

/* ── The window's content ─────────────────────────────────────────── */

/** The iPod's window content. `hidden` while minimized: the music plays on,
 *  but the clock and the visualizer rest. Memoised, as it sits open on the
 *  desktop through every desktop update. */
export const IPod = React.memo(function IPod({ onEject, hidden }: { onEject: () => void; hidden?: boolean }) {
  // The system volume from the menu bar: the iPod's own volume is scaled by it.
  const level = useVolume() / 100
  const wellId = React.useId()
  const tone = useTone()
  const player = React.useRef<Player | null>(null)
  const ended = React.useRef<() => void>(() => {})
  React.useEffect(() => {
    const p = createPlayer(() => ended.current())
    player.current = p
    return () => p.close()
  }, [])

  const [sources, setSources] = React.useState<Source[]>([
    { id: "library", label: "Library", kind: "library" },
    { id: "radio", label: "Radio Tuner", kind: "radio" },
  ])
  const [sourceId, setSourceId] = React.useState("library")
  const [sort, setSort] = React.useState<{ col: Column; dir: "ascending" | "descending" }>({ col: "title", dir: "ascending" })
  const [query, setQuery] = React.useState("")
  const [unchecked, setUnchecked] = React.useState<Set<string>>(() => new Set())
  const [selected, setSelected] = React.useState<string | null>(null)
  const [current, setCurrent] = React.useState<Track | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [volume, setVolume] = React.useState(70)
  const [shuffle, setShuffle] = React.useState(false)
  // Shuffle's order, dealt when it is switched on.
  const [deck, setDeck] = React.useState<string[]>([])
  const [repeat, setRepeat] = React.useState(false)
  const [browse, setBrowse] = React.useState(false)
  const [genre, setGenre] = React.useState<string | null>(null)
  const [visuals, setVisuals] = React.useState(false)

  React.useEffect(() => player.current?.setVolume((volume / 100) * level), [volume, level])

  // Striped empty rows fill the list to its foot, as the reference's do.
  const viewport = React.useRef<HTMLDivElement>(null)
  const [fits, setFits] = React.useState(0)
  React.useEffect(() => {
    const el = viewport.current
    if (!el) return
    const ro = new ResizeObserver(() => setFits(Math.max(0, Math.floor((el.clientHeight - HEADER) / ROW))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [visuals])

  const source = sources.find((s) => s.id === sourceId) ?? sources[0]
  const radio = source.kind === "radio"
  const pool = radio ? STATIONS : source.kind === "playlist" ? TRACKS.filter((t) => source.songs?.includes(t.title)) : TRACKS
  const genres = [...new Set(pool.map((t) => t.genre))].sort()
  const q = query.trim().toLowerCase()
  const rows = pool.filter(
    (t) => (radio || !browse || !genre || t.genre === genre) && (!q || [t.title, t.artist, t.album].some((f) => f.toLowerCase().includes(q)))
  )
  if (!radio) {
    const by = { title: (t: Track) => t.title, artist: (t: Track) => `${t.artist} ${t.title}`, time: (t: Track) => duration(t) }[sort.col]
    rows.sort((a, b) => {
      const [x, y] = [by(a), by(b)]
      const order = typeof x === "number" ? x - (y as number) : x.localeCompare(y as string)
      return sort.dir === "ascending" ? order : -order
    })
  }
  // Until a row is picked, the tone's own song is the one selected and the
  // one Play starts: Bubblegum Gel in pink, Bondi Blue in aqua, and so on.
  const chosen = selected ?? (radio ? null : (TRACKS.find((t) => t.tone === tone)?.title ?? null))
  // What plays: the list as shown, less the songs unticked — in the dealt
  // order while shuffle is on.
  const listed = radio ? rows : rows.filter((t) => !unchecked.has(t.title))
  const queue = shuffle ? deck.flatMap((title) => listed.filter((t) => t.title === title)) : listed
  // Where the loaded song stands in it (by title: a song is its name), and
  // what the transport can do from there. Shuffle and repeat go round, so
  // only an empty list stops them; otherwise the ends of the list do.
  const at = current ? queue.findIndex((t) => t.title === current.title) : -1
  const round = shuffle || repeat
  const canPrevious = queue.length > 0 && (round || at > 0)
  const canNext = queue.length > 0 && (round || at < queue.length - 1)

  const start = (t: Track) => {
    player.current?.play(t)
    setCurrent(t)
    setPlaying(true)
  }
  const stop = () => {
    player.current?.stop()
    setCurrent(null)
    setPlaying(false)
  }
  const skip = (dir: 1 | -1) => {
    const n = queue.length
    if (!n) return stop()
    // With nothing loaded, forward is the top of the list and back its end.
    const i = at < 0 ? (dir === 1 ? 0 : n - 1) : at + dir
    if (i >= 0 && i < n) start(queue[i])
    else if (round) start(queue[(i + n) % n])
    else stop()
  }
  // A song that plays out moves on — through the latest list and settings.
  React.useEffect(() => {
    ended.current = () => skip(1)
  })

  const playPause = () => {
    if (!current) {
      const t = rows.find((r) => r.title === chosen) ?? queue[0]
      if (t) start(t)
    } else if (playing) {
      player.current?.pause()
      setPlaying(false)
    } else {
      player.current?.resume()
      setPlaying(true)
    }
  }
  const toggleShuffle = () => {
    // Deal every song and station afresh, the one playing first so Next
    // moves off it; each list then plays in the deal's order.
    const rest = [...TRACKS, ...STATIONS].map((t) => t.title).filter((t) => t !== current?.title)
    if (!shuffle) setDeck([...(current ? [current.title] : []), ...shuffled(rest)])
    setShuffle((v) => !v)
  }

  const sortBy = (col: Column) =>
    setSort((s) => ({ col, dir: s.col === col && s.dir === "ascending" ? "descending" : "ascending" }))
  const pick = (id: string) => {
    setSourceId(id)
    setSelected(null)
    setGenre(null)
  }
  const addPlaylist = () => {
    const n = sources.filter((s) => s.kind === "playlist").length + 1
    const id = `playlist-${n}`
    const songs = chosen && !radio ? [chosen] : []
    setSources((s) => [...s, { id, label: n === 1 ? "untitled playlist" : `untitled playlist ${n}`, kind: "playlist", songs }])
    pick(id)
  }

  const columns = radio ? 3 : 5

  return (
    <div className="flex min-h-[360px] flex-1 flex-col desk:min-h-0">
      {/* The control strip: transport and volume · the display · search and browse. */}
      {/* A pixel up: the reference's controls start on the title bar's last row. */}
      {/* The display keeps its 244px while it can, centred, 16px clear of
          the columns either side, which share what is left. */}
      <div className="-mt-px flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-2 px-6 pb-2 desk:grid desk:h-16 desk:grid-cols-[minmax(108px,1fr)_minmax(0,244px)_minmax(0,1fr)] desk:pb-0">
        <div className="flex w-27 flex-col">
          {/* The discs sit where the reference's do (centres 19, 52 and 85px
              in; prev and next a pixel low), in one recessed well 5.5px wider
              than each: a single path, so the overlaps don't shade twice. */}
          <div className="relative flex h-10 items-center gap-[3px] pl-[5px]">
            <svg viewBox="-2 -4 112 48" className="absolute -top-1 -left-0.5 h-12 w-28" aria-hidden>
              <defs>
                <linearGradient id={wellId} gradientUnits="userSpaceOnUse" x1="0" y1="-1" x2="0" y2="42">
                  {WELL_STOPS.map(([at, c]) => (
                    <stop key={at} offset={at} stopColor={c} />
                  ))}
                </linearGradient>
              </defs>
              <path
                d="M-0.5 20.5a19.5 19.5 0 1 0 39 0a19.5 19.5 0 1 0-39 0M30.5 20.5a21.5 21.5 0 1 0 43 0a21.5 21.5 0 1 0-43 0M65.5 20.5a19.5 19.5 0 1 0 39 0a19.5 19.5 0 1 0-39 0"
                fill={`url(#${wellId})`}
              />
            </svg>
            <Button variant="metal" size="icon" aria-label="Previous" disabled={!canPrevious} onClick={() => skip(-1)} className="size-7 translate-y-px">
              <Glyph d={PREV} w={16} h={9} />
            </Button>
            <Button variant="metal" size="icon" aria-label={playing ? "Pause" : "Play"} disabled={!current && !queue.length} onClick={playPause} className="size-8">
              {playing ? <Glyph d={PAUSE} w={12} h={15} /> : <Glyph d={PLAY} w={13} h={15} className="translate-x-px" />}
            </Button>
            <Button variant="metal" size="icon" aria-label="Next" disabled={!canNext} onClick={() => skip(1)} className="size-7 translate-y-px">
              <Glyph d={NEXT} w={16} h={9} />
            </Button>
          </div>
          {/* The speakers ride the groove's middle, as the reference's do. */}
          <div className="flex h-[22px] items-center">
            <Speaker />
            <Slider min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" thumb="metal" className={VOLUME} />
            <Speaker loud />
          </div>
        </div>

        <Display key={current?.title} track={current} player={player} ticking={playing && !hidden} className="order-last w-full desk:order-none" />

        {/* Search takes the width its column leaves, up to 176px, with Browse
            beside it; once its well would be under 80px, both go. */}
        <div className="@container min-w-0 flex-1">
          <div className="flex items-start justify-end gap-2 @max-[128px]:hidden">
            <Labeled label="Search" className="max-w-44 min-w-0 flex-1">
              <span style={WELL} className="my-1 flex h-8 w-full items-center rounded-full px-2">
                <SearchField value={query} onChange={setQuery} placeholder="" aria-label="Search songs" className="w-full" />
              </span>
            </Labeled>
            <Labeled label="Browse">
              <span style={WELL} className="flex size-10 items-center justify-center rounded-full">
                <Button variant="metal" size="icon" aria-label="Browse" aria-pressed={browse} onClick={() => setBrowse((v) => !v)} className="size-7">
                  <Eye />
                </Button>
              </span>
            </Labeled>
          </div>
        </div>
      </div>

      {/* The source list and the songs, sunk into the metal. */}
      <div className="flex min-h-0 flex-1 px-4">
        <WindowWell className="hidden w-36 shrink-0 flex-col overflow-hidden shadow-[0_0_0_1px_#636363,1px_1px_0_1px_rgba(255,255,255,0.7)] sm:flex">
          <div className="h-[17px] shrink-0 bg-(image:--y2k-listheader) text-center text-[12px] leading-[17px]">Source</div>
          <WindowSidebar aria-label="Source" className="w-full flex-1 border-0 py-0 shadow-none">
            {sources.map((s) => (
              <WindowSidebarItem key={s.id} icon={SOURCE_ICON[s.kind]} selected={s.id === sourceId} onClick={() => pick(s.id)}>
                {s.label}
              </WindowSidebarItem>
            ))}
          </WindowSidebar>
        </WindowWell>

        {/* The splitter between the panes, its grip halfway down. */}
        <div aria-hidden className="hidden w-2 shrink-0 items-center justify-center sm:flex">
          <span className="size-1 rounded-full bg-black/80" />
        </div>

        <WindowWell className="flex min-w-0 flex-1 flex-col overflow-hidden shadow-[0_0_0_1px_#636363,1px_1px_0_1px_rgba(255,255,255,0.7)]">
          {browse && !radio && (
            <WindowScrollArea className="h-28 flex-none border-b border-[#636363]">
              <Table className="leading-[14px]">
                <TableHeader>
                  <tr>
                    <TableHead className="text-center">Genre</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {[null, ...genres].map((g) => (
                    <TableRow key={g ?? "all"} selected={genre === g} onClick={() => setGenre(g)} className="cursor-default">
                      <TableCell>{g ?? `All (${genres.length} Genres)`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </WindowScrollArea>
          )}
          {visuals ? (
            !hidden && <Visualiser track={current} tone={tone} player={player} playing={playing} className="min-h-0 flex-1" />
          ) : (
            <WindowScrollArea viewportRef={viewport}>
              <Table className="table-fixed leading-[14px] [&_td:not(:last-child)]:border-r [&_td]:border-[#dedede]">
                <colgroup>
                  {radio ? (
                    <>
                      <col className="w-44" />
                      <col />
                      <col className="w-2" />
                    </>
                  ) : (
                    <>
                      <col className="w-5" />
                      <col />
                      <col className="w-12" />
                      <col className="w-32" />
                      <col className="w-2" />
                    </>
                  )}
                </colgroup>
                <TableHeader>
                  {radio ? (
                    <tr>
                      <TableHead>Stream</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead className="px-0" />
                    </tr>
                  ) : (
                    <tr>
                      <TableHead className="px-0" />
                      {(["title", "time", "artist"] as const).map((col) => (
                        <TableHead
                          key={col}
                          sorted={sort.col === col ? sort.dir : undefined}
                          onClick={() => sortBy(col)}
                          className={cn("cursor-default select-none", col === "time" && "text-right")}
                        >
                          {{ title: "Song", time: "Time", artist: "Artist" }[col]}
                        </TableHead>
                      ))}
                      <TableHead className="px-0" />
                    </tr>
                  )}
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <TableRow
                      key={t.title}
                      selected={chosen === t.title}
                      onClick={() => setSelected(t.title)}
                      onOpen={() => start(t)}
                      className="cursor-default"
                    >
                      {radio ? (
                        <>
                          <TableCell className="truncate">
                            {current === t && <Speaker loud />} {t.title} ({t.genre})
                          </TableCell>
                          <TableCell className="truncate">{t.album}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="px-0.5 py-0">
                            <Checkbox
                              label={<span className="sr-only">Play {t.title}</span>}
                              className="flex"
                              checked={!unchecked.has(t.title)}
                              onCheckedChange={(on) =>
                                setUnchecked((u) => {
                                  const next = new Set(u)
                                  if (on) next.delete(t.title)
                                  else next.add(t.title)
                                  return next
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="truncate">
                            <span className="flex items-center gap-1">
                              {current === t && <Speaker loud />}
                              <span className="truncate">{t.title}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{clock(duration(t))}</TableCell>
                          <TableCell className="truncate">{t.artist}</TableCell>
                        </>
                      )}
                      <TableCell />
                    </TableRow>
                  ))}
                  {Array.from({ length: Math.max(0, fits - rows.length) }, (_, i) => (
                    <TableRow key={`fill-${i}`} aria-hidden className="h-[18px]">
                      {Array.from({ length: columns }, (_, c) => (
                        <TableCell key={c} className="p-0" />
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </WindowScrollArea>
          )}
        </WindowWell>
      </div>

      {/* The foot: a new playlist, shuffle, repeat · the visualiser, eject. */}
      <div className="flex h-9 shrink-0 items-center justify-between px-5">
        <div className="flex gap-2">
          <FootButton aria-label="New playlist" onClick={addPlaylist}>
            <FootGlyph name="add" />
          </FootButton>
          <FootButton aria-label="Shuffle" on={shuffle} onClick={toggleShuffle}>
            <FootGlyph name="shuffle" />
          </FootButton>
          <FootButton aria-label="Repeat" on={repeat} onClick={() => setRepeat((v) => !v)}>
            <FootGlyph name="repeat" />
          </FootButton>
        </div>
        <div className="flex gap-2">
          <FootButton aria-label="Visualiser" on={visuals} onClick={() => setVisuals((v) => !v)}>
            <FootGlyph name="visuals" />
          </FootButton>
          <FootButton
            aria-label="Eject"
            onClick={() => {
              stop()
              onEject()
            }}
          >
            <FootGlyph name="eject" />
          </FootButton>
        </div>
      </div>
    </div>
  )
})

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
