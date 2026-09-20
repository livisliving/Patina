"use client"

import * as React from "react"

import { ShaderSurface } from "./shader-surface"

/**
 * Chrome reflection — the Y2K liquid-metal surface. Polished chrome has almost
 * no colour of its own: what you see is the environment it reflects, squeezed
 * into a vertical stack of bands — a dark ceiling, a bright horizon flare, dark
 * ground, and a pale bounce at the bottom. The contrast between those bands is
 * the whole effect, so the ramp runs nearly black to nearly white; a slow wave
 * bends the horizon and a specular streak travels across it.
 *
 * CSS fallback: the same band stack as a static gradient with a diagonal
 * highlight — no WebGL, shown when WebGL is unavailable or reduced-motion is on.
 */
const FRAG = `
uniform vec2 u_resolution;
uniform float u_time;

/* The reflected environment, sampled by height. Chrome is a mirror: these
   stops are the room, not the metal. */
float env(float y) {
  float v = mix(0.78, 0.44, smoothstep(0.00, 0.18, y)); // bounce → mid floor
  v = mix(v, 0.12, smoothstep(0.18, 0.42, y));          // → dark ground
  v = mix(v, 1.00, smoothstep(0.42, 0.52, y));          // → horizon flare
  v = mix(v, 0.58, smoothstep(0.52, 0.68, y));          // → mid sky
  v = mix(v, 0.20, smoothstep(0.68, 1.00, y));          // → dark ceiling
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // A slow wave bends the reflection, so the bands never read as a flat
  // gradient — this is what makes it look like liquid metal.
  float y = uv.y + 0.035 * sin(uv.x * 4.2 + u_time * 0.35) + 0.015 * sin(uv.x * 9.0 - u_time * 0.22);

  // Very slightly cool, like real polished chrome.
  vec3 col = vec3(env(y)) * vec3(0.96, 0.98, 1.05);

  // A narrow specular streak travelling across the surface.
  float streak = smoothstep(0.93, 1.0, sin((uv.x * 1.7 + uv.y * 0.9) - u_time * 0.5));
  col += streak * 0.30;

  // Fine horizontal brushing: tied to uv (not to device pixels), so it does
  // not alias into moiré on a high-DPR screen.
  col += (fract(sin(y * 220.0) * 43758.5453) - 0.5) * 0.025;

  // The turned edge of the metal catches a rim of light left and right.
  float rim = (1.0 - smoothstep(0.0, 0.06, uv.x)) + (1.0 - smoothstep(0.0, 0.06, 1.0 - uv.x));
  col += rim * 0.12;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export function ChromeReflection({ className, style, children, ...props }: React.ComponentProps<"div">) {
  return (
    <ShaderSurface
      fragment={FRAG}
      className={className}
      style={style}
      fallback={
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to bottom, #2e333c 0%, #8f959f 26%, #f7f9fc 46%, #171a20 54%, #6d727b 78%, #c8ccd3 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
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
