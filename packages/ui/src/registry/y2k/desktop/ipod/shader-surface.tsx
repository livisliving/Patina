"use client"

import * as React from "react"

/**
 * A minimal fragment-shader surface: draws a single full-bleed quad and runs
 * the given fragment shader, feeding it `u_resolution` and `u_time`. It handles
 * WebGL context creation, DPR-aware resize, the RAF loop, and cleanup.
 *
 * Graceful degradation: if WebGL is unavailable OR the user prefers reduced
 * motion, nothing is drawn on the canvas and the `fallback` (a CSS layer the
 * caller supplies) shows through instead. Callers should ALWAYS render a
 * `fallback` so the effect has a static, dependency-free substitute.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

export type ShaderSurfaceProps = React.ComponentProps<"div"> & {
  /** Fragment shader source. Receives uniforms u_resolution (vec2), u_time (float, seconds). */
  fragment: string
  /** CSS fallback shown when WebGL/animation is unavailable. Rendered behind the canvas. */
  fallback: React.ReactNode
}

export function ShaderSurface({ ref, fragment, fallback, style, children, ...props }: ShaderSurfaceProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [supported, setSupported] = React.useState(false)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return // keep fallback

    const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false })
    if (!gl) return // keep fallback

    // compile
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("shader compile error:", gl.getShaderInfoLog(s))
        return null
      }
      return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, `precision highp float;\n${fragment}`)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("shader link error:", gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    // full-bleed quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, "a_pos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, "u_resolution")
    const uTime = gl.getUniformLocation(prog, "u_time")

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth * dpr
      const h = canvas.clientHeight * dpr
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    setSupported(true)
    let raf = 0
    // start=0 baseline; use performance.now via the RAF timestamp (no Date.now)
    let start: number | null = null
    const loop = (t: number) => {
      if (start === null) start = t
      resize()
      gl.uniform1f(uTime, (t - start) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [fragment])

  return (
    <div ref={ref} style={{ position: "relative", overflow: "hidden", ...style }} {...props}>
      {/* CSS fallback layer — always present, hidden once WebGL takes over */}
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: supported ? 0 : 1, transition: "opacity 200ms" }}>
        {fallback}
      </div>
      <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {children != null && <div style={{ position: "relative" }}>{children}</div>}
    </div>
  )
}
