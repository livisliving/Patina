"use client"

import { ShaderSurface } from "@patina/shaders"

import type { Track } from "./ipod-synth"
import type { Tone } from "./tones"

/**
 * The iPod's visualiser: the song in its own colours. A song named for a
 * tone (Bubblegum Gel, Bondi Blue…) plays in that tone's gel, deep to white;
 * one named for a material (Pinstripe, Brushed Metal) in chrome; a station in
 * the desktop's tone. Five scenes — plasma, rings, spectrum bars, a starburst,
 * gel waves — take turns every 16 beats, cross-fading over the last two, in an
 * order the song's seed deals, and everything pulses on the song's beat.
 * Reduced motion, or no WebGL, shows the palette as a still gradient.
 */

/** The tones' bases, as y2k.css sets --y2k-tone for each. */
const BASE: Record<Tone, [number, number, number]> = {
  pink: [232, 68, 154],
  aqua: [77, 131, 210],
  lime: [127, 195, 28],
  tangerine: [232, 137, 26],
  grape: [122, 58, 186],
}
const CHROME: Palette = [[27, 31, 38], [138, 146, 158], [213, 218, 226], [255, 255, 255]]

type RGB = [number, number, number]
/** Deep, base, light, highlight. */
type Palette = [RGB, RGB, RGB, RGB]

const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB
const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

function palette(tone: Tone | null): Palette {
  if (!tone) return CHROME
  const b = BASE[tone]
  return [mix(b, BLACK, 0.7), b, mix(b, WHITE, 0.55), mix(b, WHITE, 0.92)]
}

const f = (n: number) => n.toFixed(3)
const vec3 = (c: RGB) => `vec3(${c.map((v) => f(v / 255)).join(", ")})`

function fragment(p: Palette, bpm: number, seed: number) {
  return `
uniform vec2 u_resolution;
uniform float u_time;

const vec3 C0 = ${vec3(p[0])};
const vec3 C1 = ${vec3(p[1])};
const vec3 C2 = ${vec3(p[2])};
const vec3 C3 = ${vec3(p[3])};
const float BPM = ${f(bpm)};
const float SEED = ${f(seed)};
// Where the song starts in the scenes, and how far it steps each time.
const float FIRST = ${f(seed % 5)};
const float STEP = ${f(1 + (seed % 4))};

vec3 ramp(float x) {
  x = clamp(x, 0.0, 1.0);
  if (x < 0.4) return mix(C0, C1, x / 0.4);
  if (x < 0.8) return mix(C1, C2, (x - 0.4) / 0.4);
  return mix(C2, C3, (x - 0.8) / 0.2);
}

float hash(float n) { return fract(sin(n) * 43758.5453); }

float plasma(vec2 p, float t) {
  float v = sin(p.x * 4.5 + t) + sin(p.y * 6.0 - t * 1.3) + sin((p.x + p.y) * 3.5 + t * 0.7) + sin(length(p * 4.5) - t * 1.6);
  return v * 0.125 + 0.5;
}

float rings(vec2 p, float t, float pulse) {
  float r = length(p);
  return (0.5 + 0.5 * sin(r * 16.0 - t * 4.0 + pulse * 2.0)) * smoothstep(1.3, 0.0, r);
}

/* Sixteen bars, mirrored about the middle, jumping to new heights on each
   beat and swelling with it. */
float bars(vec2 uv, float beat, float pulse) {
  float i = floor(uv.x * 16.0);
  float h = 0.15 + 0.75 * hash(i * 7.1 + beat * 3.3 + SEED) * (0.65 + 0.35 * pulse);
  float y = abs(uv.y - 0.5) * 2.0;
  float lit = step(fract(uv.x * 16.0), 0.78) * step(y, h);
  return lit * (0.45 + 0.55 * (1.0 - y / max(h, 0.001))) + (1.0 - lit) * 0.06;
}

/* The Patina star, breathing on the beat, over turning rays. */
float burst(vec2 p, float t, float pulse) {
  float a = atan(p.y, p.x);
  float r = length(p);
  float rays = (0.5 + 0.5 * cos(a * 10.0 + t * 0.8)) * smoothstep(1.2, 0.1, r) * 0.75;
  float edge = (0.22 + 0.1 * cos(a * 5.0 - t * 0.5)) * (1.0 + 0.3 * pulse);
  return clamp(rays + smoothstep(0.02, 0.0, r - edge), 0.0, 1.0);
}

float waves(vec2 uv, float t) {
  float y = uv.y + 0.08 * sin(uv.x * 6.0 + t * 1.2) + 0.05 * sin(uv.x * 11.0 - t * 0.9);
  return 0.5 + 0.5 * sin(y * 18.0 - t * 2.0);
}

float scene(float m, vec2 uv, vec2 p, float t, float beat, float pulse) {
  if (m < 0.5) return plasma(p, t * 0.8);
  if (m < 1.5) return rings(p, t, pulse);
  if (m < 2.5) return bars(uv, beat, pulse);
  if (m < 3.5) return burst(p, t, pulse);
  return waves(uv, t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time;
  float beats = t * BPM / 60.0;
  float beat = floor(beats);
  float pulse = exp(-fract(beats) * 5.0);
  float turn = floor(beats / 16.0);
  float a = scene(mod(FIRST + turn * STEP, 5.0), uv, p, t, beat, pulse);
  float b = scene(mod(FIRST + (turn + 1.0) * STEP, 5.0), uv, p, t, beat, pulse);
  vec3 col = ramp(mix(a, b, smoothstep(14.0, 16.0, mod(beats, 16.0))));
  col *= 0.85 + 0.25 * pulse;
  // The gel's gloss across the top, and a soft falloff to the corners.
  col += 0.12 * smoothstep(0.6, 0.95, uv.y);
  col *= 1.0 - 0.3 * dot(p, p);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`
}

export function Visualiser({ track, tone, className }: { track: Track | null; tone: Tone; className?: string }) {
  // A station, or nothing loaded yet, plays in the desktop's tone.
  const own = track && track.bars !== Infinity ? (track.tone ?? null) : tone
  const p = palette(own)
  const css = (c: RGB) => `rgb(${c.map(Math.round).join(", ")})`
  return (
    <ShaderSurface
      fragment={fragment(p, track?.bpm ?? 90, track?.seed ?? 0)}
      className={className}
      fallback={
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 50% 60%, ${css(p[3])} 0%, ${css(p[2])} 22%, ${css(p[1])} 48%, ${css(p[0])} 100%)`,
          }}
        />
      }
    />
  )
}
