"use client"

import * as React from "react"
import { parseColor } from "@patina/ui/color"

import { ShaderSurface } from "./shader-surface"

/**
 * Translucent plastic — the iMac G3 gel: a tone-tinted translucent shell with a
 * glossy cap on top, light pooling at the base, and slow internal caustics. The
 * tone colour is read from the --y2k-tone CSS var and baked into the shader as
 * a constant; it is re-read whenever <html data-tone> changes.
 *
 * CSS fallback: a tone radial-gradient blob with a white gloss cap — no WebGL,
 * shown when WebGL is unavailable or reduced-motion is on.
 */

const PINK: [number, number, number] = [0.91, 0.27, 0.6]

/**
 * Read the computed --y2k-tone as a 0–1 rgb triple; falls back to pink. The
 * browser returns custom properties in whichever syntax it likes, which is why
 * the parse lives in @patina/ui and is shared with the Design System palette —
 * miss a syntax here and the shader silently sticks on the fallback colour.
 */
function readTone(el: HTMLElement | null): [number, number, number] {
  if (!el || typeof window === "undefined") return PINK
  const c = parseColor(getComputedStyle(el).getPropertyValue("--y2k-tone"))
  return c ? [c.r / 255, c.g / 255, c.b / 255] : PINK
}

/* uv.y runs 0 at the bottom of the quad to 1 at the top (gl_FragCoord is
   bottom-up), so "up" in the shader is up on screen. */
const frag = (r: number, g: number, b: number) => `
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 c = uv - 0.5;
  vec3 tone = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});

  // Shell body: saturated and deep at the bottom, lighter toward the top,
  // where the light enters.
  vec3 deep = tone * 0.45;
  vec3 lit = mix(tone, vec3(1.0), 0.28);
  vec3 col = mix(deep, lit, smoothstep(0.0, 0.92, uv.y));

  // Light that passed through the shell pools along the base.
  col += tone * 0.30 * smoothstep(0.30, 0.0, uv.y);

  // Internal caustics. Zero-mean and low amplitude, so they read as a faint
  // drift inside the plastic instead of dirt on top of it.
  float n = noise(uv * 3.0 + vec2(u_time * 0.06, u_time * 0.04));
  n = mix(n, noise(uv * 6.0 - vec2(0.0, u_time * 0.05)), 0.4);
  col += (n - 0.5) * 0.07;

  // Aqua gloss cap: a soft ellipse of white across the upper third.
  vec2 gloss = vec2(c.x / 0.46, (uv.y - 0.80) / 0.24);
  float sheen = 1.0 - smoothstep(0.30, 1.0, length(gloss));
  col = mix(col, vec3(1.0), sheen * 0.72);

  // The thick wall of the shell darkens all four edges evenly.
  float rx = smoothstep(0.0, 0.10, uv.x) * (1.0 - smoothstep(0.90, 1.0, uv.x));
  float ry = smoothstep(0.0, 0.10, uv.y) * (1.0 - smoothstep(0.90, 1.0, uv.y));
  col *= mix(0.80, 1.0, rx * ry);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export function TranslucentPlastic({ className, style, children, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [rgb, setRgb] = React.useState<[number, number, number]>(PINK)

  // Re-read the tone on mount and on every tone switch, so the plastic tracks
  // the active tone the way the CSS fallback does.
  React.useEffect(() => {
    const sync = () => setRgb(readTone(ref.current))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tone"] })
    return () => mo.disconnect()
  }, [])

  return (
    <ShaderSurface
      ref={ref}
      fragment={frag(...rgb)}
      className={className}
      style={style}
      fallback={
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--y2k-tone) 30%, white) 0%, var(--y2k-tone) 55%, color-mix(in srgb, var(--y2k-tone) 55%, black) 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 40%)",
            }}
          />
        </div>
      }
      {...props}
    >
      {children}
    </ShaderSurface>
  )
}
