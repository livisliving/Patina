"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { parseColor } from "@/lib/color"

import type { Player, Track } from "./ipod-synth"
import type { Tone } from "../tones"

/**
 * The iPod's visualiser, after the ones a desktop played in 2003: Winamp's
 * Tripex and Windows Media Player's own. Each frame is the last one pulled
 * about — pushed outward, swirled, folded, lifted — and dimmed a little, and
 * the music is drawn over it: its spectrum, its waveform, points of light.
 * So everything leaves a trail, and the trail cools from white into the
 * song's colour and on to black.
 *
 * The colour is the song's own: a song named for a tone (Bubblegum Gel,
 * Bondi Blue…) plays in that tone; one named for a material (Pinstripe,
 * Brushed Metal) in chrome; a station in the desktop's tone. Nine scenes
 * take turns every 16 beats, in an order the song's seed deals. Reduced
 * motion, or no WebGL, shows the palette as a still gradient.
 */

type RGB = [number, number, number]
/** Deep, base, light, highlight. */
type Palette = [RGB, RGB, RGB, RGB]
type Song = { pal: Palette; bpm: number; seed: number; from: number; playing: boolean }

const CHROME: Palette = [[27, 31, 38], [138, 146, 158], [213, 218, 226], [255, 255, 255]]
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB

/** A tone's gel from its base, deep to white; chrome when there's none. */
function palette(b: RGB | null): Palette {
  if (!b) return CHROME
  return [mix(b, [0, 0, 0], 0.7), b, mix(b, [255, 255, 255], 0.55), mix(b, [255, 255, 255], 0.92)]
}

const SCENES = 9
/** Steps through the nine scenes that visit every one before repeating. */
const STEPS = [1, 2, 4, 5, 7, 8]
/** The trails' buffer is at most this wide: soft, as the originals were. */
const MAX_W = 400

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`

/* One step: the last frame, moved and dimmed, and this frame's music over
   it. p runs across the buffer at a height of 1, centred. */
const STEP = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_prev;
uniform sampler2D u_audio;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scene;
uniform vec3 u_bands;
uniform vec3 u_c1;
uniform vec3 u_c3;

const float TAU = 6.2831853;

/* The spectrum, low notes at 0, spread so the synth's range (to about
   4kHz) fills it; the waveform, -1 to 1. */
float spec(float x) { return texture2D(u_audio, vec2(0.004 + 0.35 * pow(x, 1.5), 0.25)).r; }
float wave(float x) { return texture2D(u_audio, vec2(x, 0.75)).r * 2.0 - 1.0; }

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

vec3 prev(vec2 p) {
  vec2 uv = p / vec2(u_res.x / u_res.y, 1.0) + 0.5;
  vec2 inside = step(0.0, uv) * step(uv, vec2(1.0));
  return texture2D(u_prev, uv).rgb * inside.x * inside.y;
}

/* A line d away: a sharp core and a soft halo. */
float glow(float d, float w) { d = abs(d); return smoothstep(w, 0.0, d) + 0.35 * smoothstep(w * 4.0, 0.0, d); }
/* A point of light of radius r at c. */
float spot(vec2 p, vec2 c, float r) { return smoothstep(r, r * 0.2, length(p - c)); }
/* A point in space, seen from 2.2 back: where it lands, and how near. */
vec3 project(vec3 q) { float z = q.z + 2.2; return vec3(q.xy / z * 1.2, 2.2 / z); }

void main() {
  vec2 p = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  float r = length(p);
  float ang = atan(p.y, p.x);
  float t = u_time;
  float bass = u_bands.x, mid = u_bands.y;
  float s = floor(u_scene + 0.5);

  vec2 q = p;
  float keep = 0.94;
  float heat = 0.0;

  if (s < 0.5) {
    // Tunnel: a ring on the spectrum, streaming outward as it turns.
    q = rot(p, 0.012 + 0.01 * sin(t * 0.21)) * (0.955 - 0.03 * bass);
    keep = 0.95;
    float x = abs(fract(ang / TAU + 0.25) * 2.0 - 1.0);
    heat = glow(r - (0.05 + 0.05 * bass + 0.16 * spec(x)), 0.005);
  } else if (s < 1.5) {
    // Vortex: a turning waveform, swirled hardest at the middle and drawn in.
    q = rot(p, 0.05 + 0.15 * exp(-r * 4.0)) * 1.01;
    keep = 0.97;
    vec2 w = rot(p, t * 0.5);
    heat = glow(w.y - 0.12 * wave(w.x * 0.6 + 0.5), 0.007) * step(abs(w.x), 0.45);
  } else if (s < 2.5) {
    // Rings of light turning in space; their trails become ribbons.
    q = rot(p, -0.004) * 0.995;
    keep = 0.9;
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float tilt = t * (0.45 + 0.2 * fk) + fk * 2.1;
      for (int i = 0; i < 36; i++) {
        float f = float(i) / 36.0;
        vec3 c = vec3(cos(f * TAU), sin(f * TAU), 0.0) * (0.42 + 0.08 * fk + 0.12 * bass);
        c.yz = rot(c.yz, tilt);
        c.xz = rot(c.xz, tilt * 0.7 + fk);
        vec3 sp = project(c);
        heat += spot(p, sp.xy, 0.009 * sp.z) * (0.55 + 0.6 * spec(f));
      }
    }
  } else if (s < 3.5) {
    // A dotted helix, turning and tipping, bright where the music is.
    q = p * 0.99;
    keep = 0.82;
    for (int i = 0; i < 96; i++) {
      float f = float(i) / 96.0;
      float u = f * TAU * 3.0 + t * 0.8;
      vec3 c = vec3(cos(u) * (0.12 + 0.3 * f), (f - 0.5) * 0.9, sin(u) * (0.12 + 0.3 * f));
      c.xy = rot(c.xy, t * 0.3);
      c.yz = rot(c.yz, 0.5 + 0.3 * sin(t * 0.2));
      vec3 sp = project(c);
      heat += spot(p, sp.xy, 0.011 * sp.z) * (0.45 + 0.9 * spec(f));
    }
  } else if (s < 4.5) {
    // Spectrum bars from the floor; the last frame sinks beneath as a ghost.
    q = p + vec2(0.0, 0.008);
    keep = 0.8;
    float n = 24.0;
    float h = 0.06 + 0.85 * spec((floor(v_uv.x * n) + 0.5) / n);
    heat = step(fract(v_uv.x * n), 0.8) * step(v_uv.y, h) * (0.4 + 0.6 * v_uv.y / h);
  } else if (s < 5.5) {
    // The waveform across the middle, its past stretched above and below.
    q = vec2(p.x * 0.996, p.y * 0.965);
    keep = 0.93;
    heat = glow(p.y - 0.28 * wave(v_uv.x) * (0.6 + 0.8 * mid), 0.005);
  } else if (s < 6.5) {
    // Kaleidoscope: the last frame folded six ways and turning, so a
    // waveform and a light, drawn once off the middle, repeat in a mandala.
    float seg = TAU / 6.0;
    float fa = abs(mod(ang, seg) - seg * 0.5);
    q = rot(vec2(cos(fa), sin(fa)) * r, 0.008) * 0.985;
    keep = 0.94;
    vec2 w = rot(p, -0.3);
    heat = glow(w.y - 0.06 * wave(w.x * 2.0), 0.005) * step(0.05, w.x) * step(w.x, 0.4) + spot(p, rot(vec2(0.1 + 0.15 * (0.5 + 0.5 * sin(t * 1.3)), 0.0), 0.3), 0.02 + 0.04 * bass);
  } else if (s < 7.5) {
    // Flames off the spectrum, mirrored from the middle, rising and flickering.
    float n = sin(p.y * 23.0 + t * 4.0) * sin(p.x * 17.0 - t * 3.0);
    q = p + vec2(0.004 * n, -0.012);
    keep = 0.93;
    float f = spec(min(abs(v_uv.x - 0.5) * 1.6, 1.0));
    heat = step(v_uv.y, 0.02 + 0.1 * f) * (0.5 + f) * (0.75 + 0.25 * sin(v_uv.x * 90.0 + t * 20.0));
  } else {
    // A sun on the bass, rays on the spectrum, blown outward.
    q = rot(p, 0.006) * 0.975;
    keep = 0.9;
    float a = fract(ang / TAU) * 24.0;
    float len = 0.08 + 0.3 * spec(abs(floor(a) / 12.0 - 1.0));
    float core = 0.05 + 0.09 * bass;
    heat = smoothstep(0.15, 0.0, abs(fract(a) - 0.5)) * step(r, len) * (1.0 - r / len) + smoothstep(core, core * 0.6, r);
  }

  // Trails cool toward the tone: every channel but the tone's own fades a
  // little faster, so white turns to colour before it turns to black.
  vec3 tint = u_c1 / max(max(u_c1.r, u_c1.g), max(u_c1.b, 0.001));
  vec3 col = prev(q) * keep * mix(vec3(1.0), tint, 0.1) - 1.5 / 255.0;
  // Drawn in the tone, white only where it burns hottest.
  vec3 ink = mix(u_c1, u_c3, clamp(heat - 0.5, 0.0, 1.0)) * min(heat, 1.5);
  gl_FragColor = vec4(clamp(max(col, 0.0) + ink, 0.0, 1.0), 1.0);
}
`

const SHOW = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_frame;
void main() { gl_FragColor = vec4(texture2D(u_frame, v_uv).rgb, 1.0); }
`

const css = (c: RGB) => `rgb(${c.map(Math.round).join(", ")})`
const still = (p: Palette) =>
  `radial-gradient(circle at 50% 60%, ${css(p[3])} 0%, ${css(p[2])} 22%, ${css(p[1])} 48%, ${css(p[0])} 100%)`

export function Visualiser({
  track,
  tone,
  player,
  playing,
  className,
}: {
  track: Track | null
  tone: Tone
  player: React.RefObject<Player | null>
  playing: boolean
  className?: string
}) {
  // A station, or nothing loaded yet, plays in the desktop's tone.
  const own = track && track.bars !== Infinity ? (track.tone ?? null) : tone
  const bpm = track?.bpm ?? 90
  const seed = track?.seed ?? 0
  const box = React.useRef<HTMLDivElement>(null)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = React.useState(() => still(CHROME))
  // What the drawing loop reads each frame, kept current without restarting it.
  const song = React.useRef<Song>({ pal: CHROME, bpm, seed, from: 0, playing })

  // The tone's base is read off this box's own data-tone, as y2k.css sets it,
  // so the visualiser can't drift from the chrome.
  React.useLayoutEffect(() => {
    const c = own && box.current ? parseColor(getComputedStyle(box.current).getPropertyValue("--y2k-tone")) : null
    const pal = palette(c ? [c.r, c.g, c.b] : null)
    song.current.pal = pal
    setFallback(still(pal))
  }, [own])
  // A new song starts its scenes from the top.
  React.useLayoutEffect(() => {
    Object.assign(song.current, { bpm, seed, from: performance.now() })
  }, [bpm, seed])
  React.useLayoutEffect(() => {
    song.current.playing = playing
  }, [playing])

  React.useEffect(() => {
    const el = canvas.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const gl = el.getContext("webgl", { antialias: false })
    return gl ? run(gl, el, song, player) : undefined
  }, [player])

  return (
    <div ref={box} data-tone={own ?? undefined} className={cn("relative overflow-hidden bg-black", className)}>
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: fallback }} />
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
    </div>
  )
}

/** Runs the visualiser on `gl` until the returned cleanup is called. */
function run(gl: WebGLRenderingContext, el: HTMLCanvasElement, song: React.RefObject<Song>, player: React.RefObject<Player | null>) {
  const program = (frag: string) => {
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("visualiser:", gl.getShaderInfoLog(s))
      return s
    }
    const p = gl.createProgram()!
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, frag))
    gl.bindAttribLocation(p, 0, "a_pos")
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
    return { p, u: (name: string) => gl.getUniformLocation(p, name) }
  }
  const step = program(STEP)
  const show = program(SHOW)
  if (!step || !show) return

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const texture = (w: number, h: number, format: number) => {
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, format, w, h, 0, format, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  // The music, as a 256×2 picture: the spectrum to 12kHz above (47Hz a
  // step), 11ms of the waveform below.
  const sound = new Uint8Array(512)
  const freq = new Uint8Array(256)
  const time = new Uint8Array(512)
  const audio = texture(256, 2, gl.LUMINANCE)
  // Bass, middle and top — to 234Hz, 1.9kHz, 5.6kHz — quick to rise and slow to fall.
  const BANDS = [
    [1, 5],
    [5, 40],
    [40, 120],
  ]
  const bands = [0, 0, 0]
  const listen = () => {
    const a = song.current.playing ? player.current?.analyser() : null
    if (a) {
      a.getByteFrequencyData(freq)
      a.getByteTimeDomainData(time)
    } else {
      freq.fill(0)
      time.fill(128)
    }
    sound.set(freq)
    // The waveform at a steady height, however loud the song: its peak to 90%.
    let peak = 0
    for (let i = 0; i < 512; i++) peak = Math.max(peak, Math.abs(time[i] - 128))
    const gain = Math.min(4, 115 / Math.max(peak, 8))
    for (let i = 0; i < 256; i++) sound[256 + i] = Math.max(0, Math.min(255, 128 + (time[i * 2] - 128) * gain))
    BANDS.forEach(([from, to], i) => {
      let sum = 0
      for (let k = from; k < to; k++) sum += freq[k]
      bands[i] = Math.max(sum / (to - from) / 255, bands[i] * 0.9)
    })
    gl.bindTexture(gl.TEXTURE_2D, audio)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, sound)
  }

  // Two frames, drawn into in turn: each step reads the other.
  let frames: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = []
  let [w, h] = [0, 0]
  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = Math.max(1, Math.round(el.clientWidth * dpr))
    el.height = Math.max(1, Math.round(el.clientHeight * dpr))
    const nw = Math.max(1, Math.min(MAX_W, Math.round(el.clientWidth)))
    const nh = Math.max(1, Math.round((nw * el.clientHeight) / Math.max(1, el.clientWidth)))
    if (nw === w && nh === h) return
    ;[w, h] = [nw, nh]
    frames.forEach((f) => (gl.deleteTexture(f.tex), gl.deleteFramebuffer(f.fbo)))
    frames = [0, 1].map(() => {
      const tex = texture(w, h, gl.RGBA)
      const fbo = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return { tex, fbo }
    })
  }
  size()
  const ro = new ResizeObserver(size)
  ro.observe(el)

  let raf = 0
  let last = 0
  let turn = 0
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    // Sixty steps a second on any screen: the trails' lengths count steps.
    if (now - last < 15) return
    last = now
    listen()
    const { pal, bpm, seed, from } = song.current
    const beats = ((now - from) / 60000) * bpm
    const scene = (seed + Math.floor(beats / 16) * STEPS[seed % STEPS.length]) % SCENES

    const [src, dst] = turn ? [frames[1], frames[0]] : [frames[0], frames[1]]
    turn ^= 1
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo)
    gl.viewport(0, 0, w, h)
    gl.useProgram(step.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, src.tex)
    gl.uniform1i(step.u("u_prev"), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, audio)
    gl.uniform1i(step.u("u_audio"), 1)
    gl.uniform2f(step.u("u_res"), w, h)
    gl.uniform1f(step.u("u_time"), now / 1000)
    gl.uniform1f(step.u("u_scene"), scene)
    gl.uniform3f(step.u("u_bands"), bands[0], bands[1], bands[2])
    gl.uniform3fv(step.u("u_c1"), pal[1].map((v) => v / 255))
    gl.uniform3fv(step.u("u_c3"), pal[3].map((v) => v / 255))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, el.width, el.height)
    gl.useProgram(show.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, dst.tex)
    gl.uniform1i(show.u("u_frame"), 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  raf = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    frames.forEach((f) => (gl.deleteTexture(f.tex), gl.deleteFramebuffer(f.fbo)))
    gl.deleteTexture(audio)
    gl.deleteBuffer(quad)
    gl.deleteProgram(step.p)
    gl.deleteProgram(show.p)
  }
}
