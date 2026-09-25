"use client"

/**
 * The Design System window's contents: every component of the pack, the
 * palette and the type. Its own module, so the demo loads it (and the
 * components, shaders and icons only it shows) when the window opens, not
 * with the page. desktop.tsx keeps the window, its filter and its buttons.
 */

import * as React from "react"
import {
  BevelButton,
  Button,
  Checkbox,
  cn,
  ICONS,
  Marquee,
  parseColor,
  PopupButton,
  Progress,
  Radio,
  RadioGroup,
  SearchField,
  Slider,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  TreeView,
  VisitorCounter,
  WindowAlert,
  WindowBody,
  WindowGroup,
} from "@patina/ui"
import { ChromeReflection, TranslucentPlastic } from "@patina/shaders"

import { DocIcon } from "./aqua-icons"
import { INIT } from "./install"
import { Mono } from "./mono"
import { TONES, type Tone } from "./tones"

/** The Design System's table demo, with its own selection. */
function DemoTable() {
  const [row, setRow] = React.useState<string | null>(null)
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead sorted="ascending">Name</TableHead>
          <TableHead>Size</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {[["Desktop", "4"], ["Library", "1200"], ["Movies", "8"]].map(([n, sz]) => (
          <TableRow key={n} selected={row === n} onClick={() => setRow(n)}>
            <TableCell>{n}</TableCell>
            <TableCell>{sz}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** The Design System's stepper demo, with its own value. */
function DemoStepper() {
  const [value, setValue] = React.useState(10)
  return <Stepper value={value} onValueChange={setValue} min={0} max={20} />
}

const ChevronL = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const ChevronR = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M3.5 1.5L7 5 3.5 8.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)

/* ── Design System: colour + type documentation ───────────────────── */

/** Fixed (never toned) tokens documented in the "Colours" group. */
const FIXED_TOKENS = [
  { token: "--y2k-ink", role: "Text" },
  { token: "--y2k-ink-secondary", role: "Secondary text" },
  { token: "--y2k-ink-disabled", role: "Disabled text" },
  { token: "--y2k-window-border", role: "Window rim" },
  { token: "--y2k-separator", role: "Hairline" },
  { token: "--y2k-input-bg", role: "Field" },
] as const

/** Traffic lights: the measured gem rows. The swatch paints the real
 *  gradient; the printed value is its middle row. */
const LIGHT_TOKENS = [
  { token: "--y2k-light-red", role: "Close" },
  { token: "--y2k-light-yellow", role: "Minimise" },
  { token: "--y2k-light-green", role: "Zoom" },
] as const

/** Per-tone tokens listed for all five tones. */
const TONE_TOKENS = [
  { token: "--y2k-tone", role: "Base" },
  { token: "--y2k-tone-selection", role: "Selection" },
  { token: "--y2k-tone-list", role: "List gradient" },
  { token: "--y2k-wall-hi", role: "Wallpaper hi" },
  { token: "--y2k-wall-mid", role: "Wallpaper mid" },
  { token: "--y2k-wall-lo", role: "Wallpaper lo" },
] as const

/** Aqua's type scale. Each line is set at its own size and says where the
 *  size is used. Font sizes are never snapped to the 4px grid. */
const TYPE_SCALE = [
  { px: 11, name: "Small", use: "status bars, placards, segmented controls, toolbar labels, bevel buttons" },
  { px: 12, name: "Legend", use: "group box captions in bold, list and table rows" },
  { px: 13, name: "System", use: "buttons, menus, fields and body text; window titles and headings in bold" },
  { px: 14, name: "Dock label", use: "the name over a Dock icon, bold and white on a dark shadow" },
] as const

/** The three faces, each shown in itself at the size it is used, with what
 *  stands in where it is not installed. */
const TYPE_FACES = [
  {
    token: "--y2k-font-ui",
    role: "Interface",
    sample: "Lucida Grande",
    px: 13,
    fallback: "Lucida Grande on a Mac. Elsewhere Lato, which is open source and loads with the page, then the system sans. Japanese and Chinese fall back to AquaKana and Hiragino.",
  },
  { token: "--y2k-font-wordmark", role: "Wordmark", sample: "Patina", px: 44, fallback: "EB Garamond, loaded with the page. Only for the wordmark." },
  { token: "--y2k-font-mono", role: "Code", sample: INIT, px: 11, fallback: "Monaco on a Mac, then the system monospace." },
] as const

const TONE_IDS = TONES.map((t) => t.id)
const FIXED_NAMES: string[] = [...FIXED_TOKENS, ...LIGHT_TOKENS].map((t) => t.token)
const TONE_NAMES: string[] = TONE_TOKENS.map((t) => t.token)

type TokenValues = { fixed: Record<string, string>; byTone: Record<string, Record<string, string>> }
const NO_TOKENS: TokenValues = { fixed: {}, byTone: {} }
let tokenValues: TokenValues | null = null
const tokenReaders = new Set<() => void>()

/** Read every token's declared value out of the stylesheet, once: the fixed
 *  ones off <html>, the five tones through a hidden `data-tone` probe. Touches
 *  the document, so it is only ever called from an effect. */
function readTokens() {
  if (tokenValues) return
  const read = (el: Element, names: readonly string[]) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
  }
  const probe = document.createElement("div")
  probe.style.display = "none"
  document.body.appendChild(probe)
  const byTone: TokenValues["byTone"] = {}
  for (const id of TONE_IDS) {
    probe.dataset.tone = id
    byTone[id] = read(probe, TONE_NAMES)
  }
  probe.remove()
  tokenValues = { fixed: read(document.documentElement, FIXED_NAMES), byTone }
  tokenReaders.forEach((listener) => listener())
}

function subscribeTokens(listener: () => void) {
  tokenReaders.add(listener)
  return () => {
    tokenReaders.delete(listener)
  }
}

/**
 * The palette the Design System prints: measured values rather than a
 * hand-copied table, so it can never drift from y2k.css. Reading costs a
 * style recalc, so it waits until the window is open (this module only
 * loads with it); until then, and on the server, rows render "—".
 */
function useTokenValues() {
  React.useEffect(readTokens, [])
  return React.useSyncExternalStore(subscribeTokens, () => tokenValues ?? NO_TOKENS, () => NO_TOKENS)
}

/** The middle `rgb(...)`/hex stop of a gradient, what a gradient token's
 *  swatch is labelled with, since the whole gradient string is unreadable. */
function midStop(value: string) {
  const stops = value.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi)
  if (!stops) return value
  return stops[Math.floor(stops.length / 2)]
}

/** Normalise a colour token to "#rrggbb · rgb(r, g, b)" (plus its alpha when
 *  it is translucent). The browser hands custom properties back in whatever
 *  form it likes — #0006, rgba(0, 0, 0, 0.4) — which reads badly in a palette,
 *  and the hex-with-alpha shorthand hides the actual RGB. */
function formatColor(raw: string) {
  const v = midStop(raw.trim())
  const c = parseColor(v)
  if (!c) return v
  const { r, g, b, a } = c
  const pair = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  const out = `#${pair(r)}${pair(g)}${pair(b)} · rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  return a < 1 ? `${out} · ${Math.round(a * 100)}% α` : out
}

/** A 32px colour chip: paints `background` (a flat colour or a gradient) over
 *  a checkerboard, so an α-token reads as translucent rather than solid. */
function Swatch({ background }: { background: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-8 shrink-0 rounded-[4px] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]",
        "bg-[linear-gradient(45deg,#cfcfcf_25%,transparent_25%),linear-gradient(-45deg,#cfcfcf_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cfcfcf_75%),linear-gradient(-45deg,transparent_75%,#cfcfcf_75%)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]"
      )}
    >
      <span className="block size-full rounded-[4px]" style={{ background }} />
    </span>
  )
}

/** One documented token: chip, role, token name, and the literal value. */
function ColorRow({ token, role, value }: { token: string; role: string; value?: string }) {
  return (
    // Wraps rather than truncates when the row is narrower than name + value
    // (the palette is readable down to a phone-width window).
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Swatch background={`var(${token})`} />
      <span className="min-w-[132px] flex-1">
        <span className="block text-[11px]">{role}</span>
        <Mono className="block truncate text-(--y2k-ink-secondary)">{token}</Mono>
      </span>
      <Mono className="shrink-0 text-(--y2k-ink-secondary)">
        {value ? formatColor(value) : "—"}
      </Mono>
    </div>
  )
}

/** The groups, by label: a group shows only if its label matches the
 *  filter. The group bodies are unique JSX, but the label set lives here once
 *  so the "no results" check can't drift out of sync with the rendered groups. */
const DS_GROUPS = [
  "Buttons", "Variants", "Sizes", "Icon buttons", "States", "Form controls",
  "Checkbox & radio", "Text fields", "Slider & stepper", "Progress", "Tabs",
  "Tree & table", "Alert", "Icons", "Marquee & counter", "Materials", "Tone",
  "Colours", "Type",
]

export function DesignSystem({ query, tone, onTone }: { query: string; tone: Tone; onTone: (tone: Tone) => void }) {
  // The "Form controls" group's popup and search field, its own.
  const [dsControlsWhere, setDsControlsWhere] = React.useState("Documents")
  const [dsControlsSearch, setDsControlsSearch] = React.useState("")
  // Literal token values for the "Colours" group.
  const { fixed: fixedColors, byTone: toneColors } = useTokenValues()
  const q = query.trim().toLowerCase()
  const dsMatch = (label: string) => !q || label.toLowerCase().includes(q)
  const dsNoResults = q && !DS_GROUPS.some(dsMatch)

  return (
    <WindowBody className="flex flex-col gap-3">
    {dsMatch("Buttons") && (
    <WindowGroup label="Buttons">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Cancel</Button>
        <Button isDefault>Save</Button>
        <Button isDefault pulsing>Save</Button>
        <span className="text-[11px] text-(--y2k-ink-secondary)">The default button, at rest and with the dialogue throb.</span>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Variants") && (
    <WindowGroup label="Variants">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="white">White gel</Button>
        <Button variant="tone">Tone gel</Button>
        <span className="text-[11px] text-(--y2k-ink-secondary)">White gel, and gel in the current tone.</span>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Sizes") && (
    <WindowGroup label="Sizes">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Regular</Button>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Icon buttons") && (
    <WindowGroup label="Icon buttons">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="icon" aria-label="Back"><ChevronL /></Button>
        <Button size="icon" variant="tone" aria-label="Forward"><ChevronR /></Button>
        <span className="text-[11px] text-(--y2k-ink-secondary)">Round icon buttons, white or tone.</span>
      </div>
    </WindowGroup>
    )}
    {dsMatch("States") && (
    <WindowGroup label="States">
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled>Disabled (white)</Button>
        <Button variant="tone" disabled>Disabled (tone)</Button>
        {/* The ring drawn, not focus taken: autoFocus scrolled the window to it. */}
        <Button className="outline-3 outline-offset-1 outline-(--y2k-tone-focus)">Focused</Button>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Form controls") && (
    <WindowGroup label="Form controls">
      <div className="flex flex-wrap items-center gap-3">
        <PopupButton value={dsControlsWhere} onChange={setDsControlsWhere} options={["Documents", "Desktop", "Home", "Applications"]} className="w-[140px]" />
        <Checkbox label="Save Image Preview" defaultChecked />
        <SearchField value={dsControlsSearch} onChange={setDsControlsSearch} className="w-36" placeholder="Search" />
        <BevelButton>Choose…</BevelButton>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Checkbox & radio") && (
    <WindowGroup label="Checkbox & radio">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div className="flex flex-col gap-1">
          <Checkbox label="Show disks" defaultChecked />
          <Checkbox label="Mixed state" defaultChecked="mixed" />
          <Checkbox label="Disabled" disabled />
        </div>
        <RadioGroup defaultValue="small">
          <Radio value="small" label="Small" />
          <Radio value="large" label="Large" />
          <Radio value="huge" label="Huge" disabled />
        </RadioGroup>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Text fields") && (
    <WindowGroup label="Text fields">
      <div className="flex flex-col gap-2 sm:w-[240px]">
        <label className="flex flex-col gap-1 text-[13px]">
          Name
          <TextField defaultValue="Untitled" />
        </label>
        <TextField defaultValue="Read-only" readOnly />
      </div>
    </WindowGroup>
    )}
    {dsMatch("Slider & stepper") && (
    <WindowGroup label="Slider & stepper">
      <div className="flex flex-col gap-3 sm:w-[240px]">
        <Slider defaultValue={60} aria-label="Volume" />
        <Slider thumb="pointer" ticks={7} defaultValue={40} step={100 / 6} aria-label="Speed" />
        <DemoStepper />
      </div>
    </WindowGroup>
    )}
    {dsMatch("Tree & table") && (
    <WindowGroup label="Tree & table">
      <div className="flex flex-wrap items-start gap-4">
        <TreeView
          className="w-[200px]"
          items={[
            { label: "Documents", defaultOpen: true, children: [{ label: "Letter.rtf" }, { label: "Notes.txt" }] },
            { label: "Sites" },
          ]}
        />
        <div className="w-[240px]">
          <DemoTable />
        </div>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Alert") && (
    <WindowGroup label="Alert">
      <div className="overflow-hidden rounded-[2px] bg-(image:--y2k-pinstripe) shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
        <WindowAlert
          icon={<DocIcon />}
          message="Do you want to save changes to “Read Me” before closing?"
          informative="If you don’t save, your changes will be lost."
          buttons={
            <>
              <Button>Don’t Save</Button>
              <span className="flex-1" />
              <Button>Cancel</Button>
              <Button isDefault>Save</Button>
            </>
          }
        />
      </div>
    </WindowGroup>
    )}
    {dsMatch("Progress") && (
    <WindowGroup label="Progress">
      <div className="flex flex-col gap-4">
        <Progress value={55} aria-label="Copying" />
        <Progress value={100} aria-label="Done" />
        <Progress aria-label="Loading" />
        <span className="text-[11px] text-(--y2k-ink-secondary)">A running bar, a finished one, and the barber pole for a wait of unknown length.</span>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Tabs") && (
    <WindowGroup label="Tabs">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general">Folder tabs on a pinstriped panel. The selected tab is light tone gel with black text.</TabsContent>
        <TabsContent value="appearance">Appearance settings would live here.</TabsContent>
        <TabsContent value="advanced">Advanced settings would live here.</TabsContent>
      </Tabs>
    </WindowGroup>
    )}
    {dsMatch("Icons") && (
    <WindowGroup label="Icons">
      <div className="grid grid-cols-4 gap-y-3 sm:grid-cols-6">
        {Object.entries(ICONS).map(([name, Icon]) => (
          <span key={name} className="flex flex-col items-center gap-1 text-[11px]">
            <Icon className="size-8" />
            {name}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-(--y2k-ink-secondary)">At 32px, the size a toolbar uses. They look the same in every tone, apart from Folder, Heart and Star. <Mono>lucideToPack</Mono> maps lucide icon names to these.</p>
    </WindowGroup>
    )}
    {dsMatch("Marquee & counter") && (
    <WindowGroup label="Marquee & counter">
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-[4px] bg-(--y2k-input-bg) px-1 py-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]">
          <Marquee speed={16}>★ welcome to my homepage ★ sign my guestbook ★ best viewed in 800×600 ★</Marquee>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px]">You are visitor</span>
          <VisitorCounter count={1337} />
        </div>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Materials") && (
    <WindowGroup label="Materials">
      {/* Six materials, one tile each, the reference's Surfaces
          tile: 180×88, 5px corners, the #7f7f7f rim, a 12px bold
          name. The first four are static; the last two are the
          animated shaders (a CSS stand-in when WebGL is off). */}
      <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-x-6 gap-y-4">
        {([
          ["Light pinstripe", <div key="t" className="y2k-pinstripe-light size-full" />],
          ["Pinstripe", <div key="t" className="y2k-pinstripe size-full" />],
          ["Dark pinstripe", <div key="t" className="y2k-pinstripe-dark size-full" />],
          ["Brushed metal", <div key="t" className="y2k-metal size-full" />],
          ["Chrome reflection", <ChromeReflection key="t" className="size-full" />],
          ["Translucent plastic", <TranslucentPlastic key="t" className="size-full" />],
        ] as const).map(([label, face]) => (
          <div key={label}>
            <div className="h-[88px] overflow-hidden rounded-[5px] border border-(--y2k-window-border)">{face}</div>
            <div className="mt-[6px] text-[12px] font-bold">{label}</div>
          </div>
        ))}
      </div>
    </WindowGroup>
    )}
    {dsMatch("Tone") && (
    <WindowGroup label="Tone">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Tone">
        {TONES.map((t) => (
          <span key={t.id} data-tone={t.id}>
            <Button
              variant="tone"
              role="radio"
              aria-checked={tone === t.id}
              onClick={() => onTone(t.id)}
              className={cn(tone === t.id && "outline-3 outline-offset-1 outline-black/40")}
            >
              {t.label}
            </Button>
          </span>
        ))}
      </div>
    </WindowGroup>
    )}
    {dsMatch("Colours") && (
    <WindowGroup label="Colours">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-bold">Neutrals and surfaces, the same in every tone</p>
          <div className="flex flex-col gap-2">
            {FIXED_TOKENS.map((t) => (
              <ColorRow key={t.token} token={t.token} role={t.role} value={fixedColors[t.token]} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-bold">Traffic lights (each value is the middle row of its gradient)</p>
          <div className="flex flex-col gap-2">
            {LIGHT_TOKENS.map((t) => (
              <ColorRow key={t.token} token={t.token} role={`${t.role} (gradient)`} value={fixedColors[t.token]} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-bold">Tone colours, set by <Mono>data-tone</Mono> on &lt;html&gt;</p>
          {/* One tab per tone instead of five stacked lists — the
              section was far too long. Each trigger carries its own
              data-tone, so the selected segment fills with the gel it
              documents; the panel below is scoped the same way, which
              is what makes the swatches resolve to that tone. */}
          {/* The tabs keep their own pick; a new tone starts them
              again on that tone's family. */}
          <Tabs key={tone} defaultValue={tone}>
            <TabsList className="flex w-full overflow-x-auto pl-0">
              {TONES.map((t) => (
                <TabsTrigger key={t.id} value={t.id} data-tone={t.id} className="flex-1 px-1 whitespace-nowrap sm:px-2">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TONES.map((t) => (
              <TabsContent key={t.id} value={t.id} data-tone={t.id} className="flex flex-col gap-2">
                {TONE_TOKENS.map((tk) => (
                  <ColorRow key={tk.token} token={tk.token} role={tk.role} value={toneColors[t.id]?.[tk.token]} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
          <p className="text-[11px] text-(--y2k-ink-secondary)">
            The rest of each tone is worked out from its base. Every gel row keeps the lightness and chroma
            of the matching row in the original Aqua gel and takes the tone&apos;s hue. The glow is the base
            at 50% and the focus ring is the light tone at 55%.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-bold">No swatch</p>
          <p className="text-[11px] text-(--y2k-ink-secondary)">
            These are gradients and textures, so there&apos;s no single colour to show:{" "}
            <Mono>--y2k-gel-white</Mono>,{" "}
            <Mono>--y2k-tone-button</Mono>,{" "}
            <Mono>--y2k-listheader</Mono>,{" "}
            <Mono>--y2k-pinstripe</Mono>,{" "}
            <Mono>--y2k-metal</Mono>,{" "}
            <Mono>--y2k-shadow-window</Mono>.
          </p>
        </section>
      </div>
    </WindowGroup>
    )}
    {dsMatch("Type") && (
    <WindowGroup label="Type">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-3">
          <p className="text-[11px] font-bold">Faces</p>
          {TYPE_FACES.map((f) => (
            <div key={f.token} className="flex flex-col gap-1">
              <span className="leading-none break-words" style={{ fontFamily: `var(${f.token})`, fontSize: `${f.px}px` }}>
                {f.sample}
              </span>
              <span className="text-[11px]">
                <strong>{f.role}</strong>, {f.px}px · <Mono>{f.token}</Mono>
              </span>
              <span className="text-[11px] leading-[1.45] text-(--y2k-ink-secondary)">{f.fallback}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 border-t border-(--y2k-separator) pt-3">
          <p className="text-[11px] font-bold">Sizes</p>
          {TYPE_SCALE.map((s) => (
            <div key={s.px} className="grid grid-cols-[40px_minmax(0,1fr)] items-baseline gap-x-3">
              <Mono className="text-(--y2k-ink-secondary)">{s.px}px</Mono>
              <p className="leading-[1.45]" style={{ fontSize: `${s.px}px` }}>
                <strong>{s.name}:</strong> {s.use}
              </p>
            </div>
          ))}
          <p className="text-[11px] leading-[1.45] text-(--y2k-ink-secondary)">
            Line height is 1.45 to 1.6 for text and 1.0 for chrome. Sentence case everywhere.
          </p>
        </section>
      </div>
    </WindowGroup>
    )}
    {dsNoResults && (
      <p className="p-2 text-center text-[12px] text-(--y2k-ink-secondary)">No components match “{query}”.</p>
    )}
    </WindowBody>
  )
}
