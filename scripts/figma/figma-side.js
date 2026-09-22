// Runs INSIDE Figma (Plugin API), wrapped by scripts/figma/lib.mjs: `main(P)`
// is called with the payload the Node side built. Everything is an upsert —
// found by name it is updated, so ids (and the bindings on them) survive a
// re-run; only the generated sheets are rebuilt from scratch.
/* global figma */

const alias = (v) => figma.variables.createVariableAlias(v)
const rgb = (c) => ({ r: c.r, g: c.g, b: c.b })

async function loadFonts(list) {
  for (const f of list) await figma.loadFontAsync(f)
}

async function upsertCollections(spec) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  const all = await figma.variables.getLocalVariablesAsync()
  const out = {}
  let created = 0
  for (const c of spec) {
    let col = cols.find((k) => k.name === c.name)
    if (!col) col = figma.variables.createVariableCollection(c.name)
    if (col.modes[0].name !== c.mode) col.renameMode(col.modes[0].modeId, c.mode)
    const mode = col.modes[0].modeId
    out[c.name] = {}
    for (const v of c.variables) {
      let variable = all.find((x) => x.variableCollectionId === col.id && x.name === v.name)
      if (!variable) { variable = figma.variables.createVariable(v.name, col, v.type); all.push(variable); created++ }
      variable.setValueForMode(mode, v.value)
      if (v.description) variable.description = v.description
      out[c.name][v.name] = variable
    }
  }
  return { vars: out, created }
}

/** {kind, dir, stops:[{position,color,variable}]} | {kind:"solid", color, variable} → a Paint */
function paintOf(spec, V) {
  const lookup = (ref) => ref && V[ref.collection]?.[ref.name]
  if (spec.kind === "solid") {
    const v = lookup(spec.variable)
    const p = figma.util.solidPaint(spec.color)
    return v ? figma.variables.setBoundVariableForPaint(p, "color", v) : p
  }
  if (spec.kind === "gradient") {
    // Node space → gradient space (row 1 is the gradient's own axis). `down`
    // runs top→bottom, `right` left→right, `diag` bottom-left→top-right — CSS's 45deg.
    const T = { right: [[1, 0, 0], [0, 1, 0]], down: [[0, 1, 0], [-1, 0, 1]], diag: [[0.5, -0.5, 0.5], [0.5, 0.5, 0]] }[spec.dir ?? "down"]
    const gradientStops = spec.stops.map((s) => {
      const v = lookup(s.variable)
      const stop = { position: s.position, color: s.color }
      if (v) stop.boundVariables = { color: alias(v) }
      return stop
    })
    return { type: "GRADIENT_LINEAR", gradientTransform: T, gradientStops }
  }
  if (spec.kind === "image") {
    const image = figma.createImage(figma.base64Decode(spec.base64))
    return { type: "IMAGE", scaleMode: "TILE", imageHash: image.hash, scalingFactor: spec.scale ?? 1 }
  }
  throw new Error(`paint kind ${spec.kind}`)
}

/** A 4px-tall stripe as a pattern source (1px rows), or null if this Figma has no pattern fills. */
function patternSource(page, name, rows, w) {
  const src = figma.createFrame()
  src.name = `Pattern/${name}`
  src.resize(w, rows.length)
  src.fills = []
  src.clipsContent = true
  rows.forEach((c, y) => {
    const r = figma.createRectangle()
    r.resize(w, 1); r.y = y; r.x = 0
    r.fills = [figma.util.solidPaint(c)]
    r.name = `row ${y + 1}`
    src.appendChild(r)
  })
  page.appendChild(src)
  try {
    const probe = figma.createRectangle()
    probe.fills = [{ type: "PATTERN", sourceNodeId: src.id, tileType: "RECTANGULAR", scalingFactor: 1, spacing: { x: 0, y: 0 }, horizontalAlignment: "START" }]
    const ok = probe.fills[0]?.type === "PATTERN"
    probe.remove()
    return ok ? src : (src.remove(), null)
  } catch (e) {
    src.remove()
    return null
  }
}

async function upsertPaintStyles(specs, V, patternsPage) {
  const styles = await figma.getLocalPaintStylesAsync()
  let created = 0, patterns = "unknown"
  const patternOK = (() => { let v = null; return (page, name, rows, w) => { if (v === false) return null; const s = patternSource(page, name, rows, w); v = !!s; return s } })()
  const out = {}
  // Old pattern sources are rebuilt with the sheets.
  for (const n of patternsPage.children.filter((n) => n.name.startsWith("Pattern/"))) n.remove()
  for (const s of specs) {
    let style = styles.find((x) => x.name === s.name)
    if (!style) { style = figma.createPaintStyle(); style.name = s.name; styles.push(style); created++ }
    if (s.description) style.description = s.description
    let paint
    if (s.kind === "stripe") {
      const src = patternOK(patternsPage, s.name.split("/").slice(1).join(" "), s.rows, s.width ?? 4)
      if (src) {
        paint = { type: "PATTERN", sourceNodeId: src.id, tileType: "RECTANGULAR", scalingFactor: 1, spacing: { x: 0, y: 0 }, horizontalAlignment: "START" }
        patterns = "pattern"
      } else {
        paint = paintOf({ kind: "image", base64: s.png }, V)
        patterns = "image"
      }
    } else paint = paintOf(s, V)
    try { style.paints = [paint] } catch (e) { throw new Error(`${s.name}: ${e.message}`) }
    out[s.name] = style
  }
  return { styles: out, created, patterns }
}

async function upsertEffectStyles(specs) {
  const styles = await figma.getLocalEffectStylesAsync()
  let created = 0
  const out = {}
  for (const s of specs) {
    let style = styles.find((x) => x.name === s.name)
    if (!style) { style = figma.createEffectStyle(); style.name = s.name; styles.push(style); created++ }
    style.effects = s.effects
    out[s.name] = style
  }
  return { styles: out, created }
}

async function upsertTextStyles(specs) {
  const styles = await figma.getLocalTextStylesAsync()
  let created = 0
  const out = {}
  for (const s of specs) {
    let style = styles.find((x) => x.name === s.name)
    if (!style) { style = figma.createTextStyle(); style.name = s.name; styles.push(style); created++ }
    await figma.loadFontAsync(s.font)
    style.fontName = s.font
    style.fontSize = s.size
    style.lineHeight = s.lineHeight
    style.letterSpacing = { unit: "PERCENT", value: s.letterSpacing ?? 0 }
    if (s.description) style.description = s.description
    out[s.name] = style
  }
  return { styles: out, created }
}

/* ── Sheets ──────────────────────────────────────────────────────── */

function page(name) {
  let p = figma.root.children.find((x) => x.name === name)
  if (!p) { p = figma.createPage(); p.name = name }
  return p
}
function fresh(p, name) {
  for (const n of p.children.filter((n) => n.name === name)) n.remove()
  const f = figma.createFrame(); f.name = name; p.appendChild(f); return f
}
/** Orphans a failed run left on a page — nodes created but never parented. */
function sweep(p) {
  for (const n of p.children.filter((n) => /^(Rectangle|Text|Frame|swatch|row \d+)$/.test(n.name) || n.name.startsWith("Pattern/"))) n.remove()
}
function column(name, gap = 16, pad = 32) {
  const f = figma.createFrame(); f.name = name
  f.layoutMode = "VERTICAL"; f.itemSpacing = gap
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = pad
  f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"
  f.fills = []
  return f
}
function row(name, gap = 16) {
  const f = figma.createFrame(); f.name = name
  f.layoutMode = "HORIZONTAL"; f.layoutWrap = "WRAP"; f.itemSpacing = gap; f.counterAxisSpacing = gap
  // resize() fixes both axes, so the sizing modes come after it.
  f.resize(1216, 10)
  f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "AUTO"
  f.fills = []
  return f
}
async function label(text, styleId, width) {
  const t = figma.createText()
  // A new text node wears Inter; give it its face before its words.
  if (styleId) await setTextStyle(t, styleId)
  else t.fontName = { family: "Lucida Grande", style: "Regular" }
  t.characters = text
  if (width) { t.resize(width, t.height); t.textAutoResize = "HEIGHT" }
  return t
}
async function setTextStyle(node, id) { if (node.setTextStyleIdAsync) await node.setTextStyleIdAsync(id); else node.textStyleId = id }
async function setFillStyle(node, id) { if (node.setFillStyleIdAsync) await node.setFillStyleIdAsync(id); else node.fillStyleId = id }
async function setEffectStyle(node, id) { if (node.setEffectStyleIdAsync) await node.setEffectStyleIdAsync(id); else node.effectStyleId = id }

async function swatch(name, fill, labelStyle, w = 96, h = 48) {
  const cell = column(name, 4, 0)
  const r = figma.createRectangle(); r.name = "swatch"; r.resize(w, h); r.cornerRadius = 4
  if (fill.styleId) await setFillStyle(r, fill.styleId); else r.fills = [fill.paint]
  r.strokes = [figma.util.solidPaint("#00000033")]; r.strokeWeight = 1
  cell.appendChild(r)
  // "tone/list/01" → "list/01"; "Tone/Gel" → "Gel"
  cell.appendChild(await label(name.split("/").slice(1).join("/"), labelStyle, w))
  return cell
}

async function sheets(P, V, paints, effects, texts) {
  const body = texts[P.sheet.labelStyle]?.id, head = texts[P.sheet.headingStyle]?.id
  const first = figma.root.children[0]
  if (first.name === "Page 1") first.name = "Cover"
  const cover = page("Cover"), colours = page("Colours"), type = page("Type"), fx = page("Effects")
  for (const p of [cover, colours, type, fx]) sweep(p)

  // Cover: the wallpaper, the wordmark, what this file is.
  const c = fresh(cover, "Cover")
  c.resize(1440, 900)
  await setFillStyle(c, paints["Tone/Wallpaper"].id)
  const stack = column("Text", 16, 64); stack.x = 64; stack.y = 64
  c.appendChild(stack)
  const title = await label("Patina — Y2K", texts["Display/Wordmark"]?.id)
  title.fills = [figma.util.solidPaint("#ffffff")]
  stack.appendChild(title)
  for (const line of P.cover) { const t = await label(line, body); t.fills = [figma.util.solidPaint("#ffffff")]; stack.appendChild(t) }

  // Colours: every solid variable as a swatch, every row profile as a strip.
  const cs = fresh(colours, "Sheet"); cs.layoutMode = "VERTICAL"; cs.itemSpacing = 32
  cs.paddingTop = cs.paddingBottom = cs.paddingLeft = cs.paddingRight = 32
  cs.primaryAxisSizingMode = "AUTO"; cs.counterAxisSizingMode = "AUTO"
  cs.fills = [figma.util.solidPaint("#ffffff")]
  for (const group of P.sheet.colourGroups) {
    cs.appendChild(await label(group.title, head))
    const r = row(group.title); cs.appendChild(r)
    for (const item of group.items) {
      if (item.style) {
        const rows = item.rows
        r.appendChild(await swatch(item.style, { styleId: paints[item.style].id }, body, item.wide ? 128 : 64, rows * (item.scale ?? 4)))
      } else {
        const v = V[item.collection][item.name]
        r.appendChild(await swatch(item.name, { paint: figma.variables.setBoundVariableForPaint(figma.util.solidPaint("#000000"), "color", v) }, body))
      }
    }
  }
  // Also the metrics, as a table of names and numbers.
  cs.appendChild(await label("Size", head))
  const metrics = row("Size"); cs.appendChild(metrics)
  for (const [name, v] of Object.entries(V.Size)) {
    const t = await label(`${name}  ${v.valuesByMode[Object.keys(v.valuesByMode)[0]]}`, body, 224)
    metrics.appendChild(t)
  }

  // Type: one line per text style.
  const ts = fresh(type, "Sheet"); ts.layoutMode = "VERTICAL"; ts.itemSpacing = 24
  ts.paddingTop = ts.paddingBottom = ts.paddingLeft = ts.paddingRight = 32
  ts.resize(1280, 10); ts.primaryAxisSizingMode = "AUTO"; ts.counterAxisSizingMode = "FIXED"
  ts.fills = [figma.util.solidPaint("#ffffff")]
  for (const s of P.textStyles) {
    const cell = column(s.name, 4, 0)
    cell.appendChild(await label(`${s.name} · ${s.font.family} ${s.font.style} ${s.size}px / ${s.lineHeight.value}%`, body))
    const sample = await label(P.sheet.sample, texts[s.name].id, 1216)
    cell.appendChild(sample)
    ts.appendChild(cell)
  }

  // Effects: a white card wearing each one.
  const es = fresh(fx, "Sheet"); es.layoutMode = "HORIZONTAL"; es.layoutWrap = "WRAP"; es.itemSpacing = 48; es.counterAxisSpacing = 48
  es.paddingTop = es.paddingBottom = es.paddingLeft = es.paddingRight = 64
  es.resize(1280, 10); es.primaryAxisSizingMode = "FIXED"; es.counterAxisSizingMode = "AUTO"
  es.fills = [figma.util.solidPaint("#dedede")]
  for (const [name, style] of Object.entries(effects)) {
    const cell = column(name, 8, 0)
    const card = figma.createRectangle(); card.resize(160, 48); card.cornerRadius = 8
    card.fills = [figma.util.solidPaint("#ffffff")]
    await setEffectStyle(card, style.id)
    cell.appendChild(card)
    cell.appendChild(await label(name, body, 160))
    es.appendChild(cell)
  }

  // A gradient-direction witness: black at the top, white at the foot.
  const w = fresh(colours, "Witness"); w.resize(64, 64); w.x = -128; w.y = 0
  w.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: { r: 0, g: 0, b: 0, a: 1 } }, { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } }] }]
  return { witness: w.id, pages: figma.root.children.map((p) => p.name) }
}

/** `figma:tone`: the Tone collection's values and the Cover's tone line, nothing else. */
async function retone(P) {
  await loadFonts(P.fonts)
  const { created } = await upsertCollections(P.collections)
  const cover = figma.root.children.find((p) => p.name === "Cover")?.findOne((n) => n.name === "Cover")
  const line = cover?.findOne((n) => n.type === "TEXT" && n.characters.startsWith("Tone:"))
  if (line) line.characters = P.coverLine
  return { file: figma.root.name, tone: P.tone, variablesCreated: created, coverUpdated: !!line }
}

async function main(P) {
  if (P.task === "tone") return retone(P)
  await loadFonts(P.fonts)
  const { vars: V, created: newVars } = await upsertCollections(P.collections)
  const colours = page("Colours")
  const { styles: paints, created: newPaints, patterns } = await upsertPaintStyles(P.paintStyles, V, colours)
  const { styles: effects, created: newEffects } = await upsertEffectStyles(P.effectStyles)
  const { styles: texts, created: newTexts } = await upsertTextStyles(P.textStyles)
  const built = await sheets(P, V, paints, effects, texts)
  return {
    file: figma.root.name,
    variables: { total: (await figma.variables.getLocalVariablesAsync()).length, created: newVars },
    paintStyles: { total: Object.keys(paints).length, created: newPaints, stripes: patterns },
    effectStyles: { total: Object.keys(effects).length, created: newEffects },
    textStyles: { total: Object.keys(texts).length, created: newTexts },
    ...built,
  }
}
