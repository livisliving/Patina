"use client"

import * as React from "react"

import { ShaderSurface } from "./shader-surface"

/**
 * Translucent plastic — the iMac G3 gel: a tone-tinted translucent shell with
 * drifting internal caustics and a glossy top sheen. The tone colour is read
 * from the --y2k-tone CSS var at mount and baked into the shader as a constant.
 *
 * CSS fallback: a tone radial-gradient blob with a white gloss cap — no WebGL,
 * shown when WebGL is unavailable or reduced-motion is on.
 */

/** Parse a computed CSS colour to a 0–1 rgb triple; falls back to hot pink. */
function readTone(el: HTMLElement | null): [number, number, number] {
  if (!el || typeof window === "undefined") return [0.91, 0.27, 0.6]
  const raw = getComputedStyle(el).getPropertyValue("--y2k-tone").trim()
  const m = raw.match(/(\d+(?:\.\d+)?)/g)
  if (m && m.length >= 3) return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255]
  return [0.91, 0.27, 0.6]
}

const frag = (r: number, g: number, b: number) => `
uniform vec2 u_resolution;
uniform float u_time;

// simple value noise for caustics
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 tone = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});

  // Base translucent tint: darker at the bottom, brighter toward the top.
  vec3 col = mix(tone * 0.55, mix(tone, vec3(1.0), 0.35), uv.y);

  // Drifting internal caustics (refraction inside the plastic).
  float n = noise(uv * 4.0 + vec2(u_time * 0.15, u_time * 0.1));
  n += 0.5 * noise(uv * 8.0 - vec2(u_time * 0.1, 0.0));
  col += (n - 0.7) * 0.18 * tone;

  // Glossy top sheen — a bright cap on the upper third.
  float sheen = smoothstep(0.62, 1.0, uv.y) * (1.0 - uv.y * 0.3);
  col = mix(col, vec3(1.0), sheen * 0.5);

  // Soft edge darkening (the thick rim of a gel shell).
  float edge = smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  col *= mix(0.8, 1.0, edge);

  gl_FragColor = vec4(col, 1.0);
}
`

export function TranslucentPlastic({ className, style, children, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [rgb, setRgb] = React.useState<[number, number, number]>([0.91, 0.27, 0.6])

  React.useEffect(() => {
    setRgb(readTone(ref.current))
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
              "radial-gradient(ellipse at 50% 25%, color-mix(in srgb, var(--y2k-tone) 40%, white) 0%, var(--y2k-tone) 55%, color-mix(in srgb, var(--y2k-tone) 55%, black) 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 45%)",
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
