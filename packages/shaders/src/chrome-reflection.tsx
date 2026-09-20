"use client"

import * as React from "react"

import { ShaderSurface } from "./shader-surface"

/**
 * Chrome reflection — a Y2K brushed-chrome surface: horizontal environment
 * bands (dark floor, bright horizon, light sky) with a slow-drifting specular
 * sweep and fine vertical brushing. The signature "liquid metal" look.
 *
 * CSS fallback: a static horizon gradient with a soft highlight band — no JS,
 * no WebGL, shown when WebGL is unavailable or reduced-motion is on.
 */
const FRAG = `
uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float y = uv.y;

  // Environment reflection: sky (light) top, dark band at the horizon, floor.
  vec3 sky   = vec3(0.93, 0.95, 0.98);
  vec3 horizon = vec3(0.28, 0.31, 0.36);
  vec3 floorc = vec3(0.72, 0.75, 0.80);
  float h = smoothstep(0.42, 0.52, y);          // horizon step
  vec3 col = mix(horizon, sky, h);
  col = mix(floorc, col, smoothstep(0.30, 0.46, y));

  // Drifting specular sweep across the horizon.
  float sweep = sin((uv.x * 3.0) + u_time * 0.6) * 0.5 + 0.5;
  float band = smoothstep(0.40, 0.50, y) * (1.0 - smoothstep(0.50, 0.62, y));
  col += band * sweep * 0.35;

  // Fine vertical brushing.
  float brush = sin(uv.x * u_resolution.x * 0.5) * 0.015;
  col += brush;

  gl_FragColor = vec4(col, 1.0);
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
              "linear-gradient(to bottom, #eef1f5 0%, #c3c8cf 44%, #474b54 50%, #b7bbc2 56%, #d6d9de 100%)",
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
