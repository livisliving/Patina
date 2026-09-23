/**
 * The iPod's music: short original chiptunes, played by the browser's own
 * synthesiser (Web Audio) — no audio files, nothing licensed. A track is a
 * tempo, a key, a four-chord loop and a lead voice; the melody is drawn from a
 * seeded random walk over the chords, so the same track always plays the same
 * tune. A radio station is a track that never ends: a new melody every 16 bars.
 */

import type { Tone } from "../tones"

export type Track = {
  title: string
  artist: string
  album: string
  genre: string
  bpm: number
  /** MIDI note of the key's tonic (60 = middle C). */
  root: number
  minor?: boolean
  /** The four-bar loop, as scale degrees (0 = the tonic chord). */
  chords: [number, number, number, number]
  lead: OscillatorType
  drums: boolean
  /** Length in bars; a station plays forever. */
  bars: number
  seed: number
  /** The colour family this song is named for: the iPod's default in it. */
  tone?: Tone
}

const song = (t: Omit<Track, "artist" | "album">): Track => ({ artist: "Patina", album: "Millennium Tones", ...t })

export const TRACKS: Track[] = [
  song({ title: "Bubblegum Gel", genre: "Pop", bpm: 120, root: 60, chords: [0, 4, 5, 3], lead: "square", drums: true, bars: 32, seed: 11, tone: "pink" }),
  song({ title: "Bondi Blue", genre: "Pop", bpm: 104, root: 67, chords: [5, 3, 0, 4], lead: "triangle", drums: true, bars: 28, seed: 23, tone: "aqua" }),
  song({ title: "Lime Jelly", genre: "Electronica", bpm: 132, root: 62, chords: [0, 3, 4, 3], lead: "square", drums: true, bars: 40, seed: 37, tone: "lime" }),
  song({ title: "Tangerine Sky", genre: "Lounge", bpm: 96, root: 65, chords: [1, 4, 0, 5], lead: "sawtooth", drums: true, bars: 24, seed: 41, tone: "tangerine" }),
  song({ title: "Grape Soda", genre: "Ambient", bpm: 84, root: 57, minor: true, chords: [0, 5, 2, 6], lead: "triangle", drums: false, bars: 20, seed: 53, tone: "grape" }),
  song({ title: "Pinstripe", genre: "Electronica", bpm: 124, root: 63, chords: [0, 5, 3, 4], lead: "square", drums: true, bars: 32, seed: 67 }),
  song({ title: "Brushed Metal", genre: "Lounge", bpm: 112, root: 58, chords: [3, 4, 2, 5], lead: "sawtooth", drums: true, bars: 28, seed: 79 }),
]

/** Radio Tuner's streams: tracks without an end. */
export const STATIONS: Track[] = [
  { title: "Patina FM", artist: "Ambient", album: "Soft pads, no drums", genre: "Ambient", bpm: 76, root: 55, chords: [0, 3, 5, 4], lead: "triangle", drums: false, bars: Infinity, seed: 101 },
  { title: "Gel Radio", artist: "Electronica", album: "Fast square leads", genre: "Electronica", bpm: 136, root: 62, chords: [0, 5, 3, 4], lead: "square", drums: true, bars: Infinity, seed: 202 },
  { title: "Millennium 40", artist: "Pop", album: "The hits, forever", genre: "Pop", bpm: 118, root: 60, chords: [0, 4, 5, 3], lead: "square", drums: true, bars: Infinity, seed: 303 },
]

/** Seconds; Infinity for a station. */
export const duration = (t: Track) => (t.bars * 240) / t.bpm

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]

/** A deterministic 0–1 generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** A scale degree (any octave) → MIDI note. */
function note(t: Track, degree: number, octave = 0) {
  const scale = t.minor ? MINOR : MAJOR
  const o = Math.floor(degree / 7)
  return t.root + scale[((degree % 7) + 7) % 7] + 12 * (o + octave)
}

type Note = { step: number; degree: number; len: number }

/** Four bars of melody over the loop: quarter and eighth notes stepping
 *  around the chord tones, resting now and then. */
function melody(t: Track, seed: number): Note[] {
  const r = random(seed)
  const out: Note[] = []
  let degree = t.chords[0] + 2
  for (let bar = 0; bar < 4; bar++) {
    const chord = t.chords[bar]
    let step = 0
    while (step < 16) {
      const len = r() < 0.6 ? 4 : 2
      if (r() > 0.18) {
        // On the beat, land on a chord tone (now and then an octave up);
        // between beats, walk a step either way.
        if (step % 4 === 0) degree = chord + [0, 2, 4][Math.floor(r() * 3)] + (r() < 0.3 ? 7 : 0)
        else degree += r() < 0.5 ? -1 : 1
        out.push({ step: bar * 16 + step, degree, len })
      }
      step += len
    }
  }
  return out
}

export type Player = ReturnType<typeof createPlayer>

/**
 * One player per iPod window. `play` starts a track from the top; pause and
 * resume suspend the whole context, so time stands still with the music.
 * `onEnded` fires when a track (never a station) plays out.
 */
export function createPlayer(onEnded: () => void) {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let noise: AudioBuffer | null = null
  let bus: GainNode | null = null
  let track: Track | null = null
  // The phrase pair now playing: a station writes a fresh one every 16
  // bars, so only the current pair is kept.
  let pair = -1
  let tunes: Note[][] = []
  let startAt = 0
  let next = 0
  let timer: ReturnType<typeof setInterval> | undefined
  let volume = 0.5

  const audio = () => {
    if (ctx) return ctx
    // Safari gives Web Audio the "ambient" session, which an iPhone's silent
    // switch mutes; music is "playback", as an <audio> element's would be.
    // Set before the context exists, which takes the session it finds.
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = "playback"
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = volume
    const limit = ctx.createDynamicsCompressor()
    master.connect(limit).connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return ctx
  }

  /** A pitched voice through its own envelope. */
  function tone(type: OscillatorType, freq: number, at: number, len: number, level: number) {
    const c = ctx!
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(level, at + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, at + len)
    osc.connect(env).connect(bus!)
    osc.start(at)
    osc.stop(at + len + 0.02)
  }

  /** A burst of noise: the snare (band) or the hi-hat (high). */
  function hit(at: number, len: number, level: number, filter: BiquadFilterType, freq: number) {
    const c = ctx!
    const src = c.createBufferSource()
    const f = c.createBiquadFilter()
    const env = c.createGain()
    src.buffer = noise
    f.type = filter
    f.frequency.value = freq
    env.gain.setValueAtTime(level, at)
    env.gain.exponentialRampToValueAtTime(0.0001, at + len)
    src.connect(f).connect(env).connect(bus!)
    src.start(at)
    src.stop(at + len)
  }

  function kick(at: number) {
    const c = ctx!
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.frequency.setValueAtTime(140, at)
    osc.frequency.exponentialRampToValueAtTime(40, at + 0.12)
    env.gain.setValueAtTime(0.55, at)
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
    osc.connect(env).connect(bus!)
    osc.start(at)
    osc.stop(at + 0.18)
  }

  /** Everything that sounds on one sixteenth. */
  function play16(step: number, at: number) {
    const t = track!
    const s = 60 / t.bpm / 4
    const inBar = step % 16
    const bar = Math.floor(step / 16)
    const chord = t.chords[bar % 4]
    // A–A–B–A: the second tune takes every third four-bar phrase; a station
    // writes a fresh pair every 16 bars.
    const phrase = Math.floor(bar / 4)
    const now = t.bars === Infinity ? Math.floor(phrase / 4) : 0
    if (now !== pair) [pair, tunes] = [now, []]
    const b = phrase % 4 === 2 ? 1 : 0
    const tune = (tunes[b] ??= melody(t, t.seed + pair * 2 + b))
    const at16 = (bar % 4) * 16 + inBar
    for (const n of tune) if (n.step === at16) tone(t.lead, hz(note(t, n.degree, 1)), at, n.len * s * 0.9, t.lead === "triangle" ? 0.22 : 0.1)
    // The arpeggio on the eighths, the bass on a bouncing pattern.
    if (inBar % 2 === 0) tone("square", hz(note(t, chord + [0, 2, 4, 2][(inBar / 2) % 4])), at, s * 1.6, 0.035)
    if ([0, 6, 8, 14].includes(inBar)) tone("triangle", hz(note(t, chord, -2)), at, s * 1.8, 0.3)
    if (!t.drums) return
    if (inBar === 0 || inBar === 8 || inBar === 10) kick(at)
    if (inBar === 4 || inBar === 12) hit(at, 0.12, 0.2, "bandpass", 1800)
    if (inBar % 2 === 0) hit(at, 0.03, 0.06, "highpass", 7000)
  }

  /** Schedule what falls due in the next moment; a hidden tab wakes up
   *  rarely, so it looks further ahead. */
  function tick() {
    const c = ctx!
    const t = track
    if (!t) return
    const s = 60 / t.bpm / 4
    const end = startAt + duration(t)
    if (c.currentTime >= end) {
      stop()
      onEnded()
      return
    }
    const horizon = c.currentTime + (document.hidden ? 1.5 : 0.12)
    while (startAt + next * s < Math.min(horizon, end)) {
      play16(next, startAt + next * s)
      next++
    }
  }

  function stop() {
    clearInterval(timer)
    timer = undefined
    bus?.disconnect()
    bus = null
    track = null
  }

  return {
    play(t: Track) {
      const c = audio()
      stop()
      void c.resume()
      track = t
      pair = -1
      bus = c.createGain()
      bus.connect(master!)
      startAt = c.currentTime + 0.05
      next = 0
      timer = setInterval(tick, 25)
      tick()
    },
    // Paused, the scheduler rests too; stopped, so does the whole context.
    pause() {
      clearInterval(timer)
      void ctx?.suspend()
    },
    resume() {
      void ctx?.resume()
      clearInterval(timer)
      if (track) timer = setInterval(tick, 25)
    },
    stop() {
      stop()
      void ctx?.suspend()
    },
    /** Seconds into the current track. */
    elapsed: () => (ctx && track ? Math.max(0, ctx.currentTime - startAt) : 0),
    /** 0–1, eased so the slider's middle sounds like the middle. */
    setVolume(v: number) {
      volume = v * v * 0.8
      if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02)
    },
    close() {
      stop()
      void ctx?.close()
      ctx = null
    },
  }
}
