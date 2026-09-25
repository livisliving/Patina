/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
/** The five millennium colour families. Values live in packages/ui/src/styles/y2k.css (data-tone). */
export type Tone = "pink" | "aqua" | "lime" | "tangerine" | "grape"

export const TONES: { id: Tone; label: string; era: string; blurb: string }[] = [
  {
    id: "pink",
    label: "Y2K pink",
    era: "2001–06 · McBling",
    blurb: "Juicy Couture velour, the pink Razr, rhinestones, Hello Kitty. The default.",
  },
  {
    id: "aqua",
    label: "Aqua",
    era: "1998–01 · Bondi / Aqua",
    blurb: "Bondi Blue iMac, Mac OS X's water-and-gel interface, the blue that started it.",
  },
  {
    id: "lime",
    label: "Lime",
    era: "1999–02 · Cyber",
    blurb: "iMac Lime, Nickelodeon slime, Matrix terminals, acid raves.",
  },
  {
    id: "tangerine",
    label: "Tangerine",
    era: "1999–03 · Candy tech",
    blurb: "iMac Tangerine, Fanta, inflatable chairs, orange translucent plastic.",
  },
  {
    id: "grape",
    label: "Grape",
    era: "2000–04 · Lavender",
    blurb: "iMac Grape, MSN Messenger purple, Lisa Frank, early Frutiger Aero.",
  },
]
