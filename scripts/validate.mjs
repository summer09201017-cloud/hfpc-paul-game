// ===========================================================================
// game-content-validator — drop-in, zero-dependency content checker
// ---------------------------------------------------------------------------
// Validate a data-driven game's content file before it reaches the engine.
// Catches: duplicate ids, missing required fields per item type, quiz
// answerIndex out of range, unknown effect keys (typos), bad ranges.
//
// Usage:   node validate.mjs path/to/content.json
//          node validate.mjs            (uses CONFIG.defaultFile)
// Exit:    0 = clean (warnings allowed), 1 = at least one error.
//
// Adapt by editing the CONFIG block below to your project's field names and
// effect vocabulary. Defaults match 保羅大富翁 (journey1.json).
// ===========================================================================
import { readFileSync } from 'node:fs'

// ---------------------------------------------------------------- CONFIG ----
const CONFIG = {
  defaultFile: 'src/data/journey1.json',
  itemsField: 'tiles_or_stations', // resolved below (auto-detects common names)
  idField: 'id',
  typeField: 'type',
  topLevelRequired: ['title'], // top-level keys that must exist
  // Required fields per item type. Dotted paths allowed (e.g. 'quiz.answerIndex').
  requiredByType: {
    start: [],
    story: [],
    rest: [],
    end: [],
    event: ['event.title', 'event.effect'],
    quiz: ['quiz.question', 'quiz.options', 'quiz.answerIndex', 'quiz.explanation'],
  },
  // Allowed keys inside any `effect` (and the effect blocks nested in events),
  // with a type check. Unknown keys are reported as errors (likely typos).
  effectVocab: {
    points: 'number',
    gospelPoints: 'number', // 保羅大富翁's score key; keep both during migrations
    skipNext: 'boolean',
    addItem: 'string',
    removeItem: 'string',
    addCompanion: 'string',
    removeCompanion: 'string',
    move: 'number',
  },
  // Optional numeric range checks: field -> [min, max]. Skipped if field absent.
  ranges: { x: [0, 100], y: [0, 100] },
}
// ------------------------------------------------------------ END CONFIG ----

const file = process.argv[2] || CONFIG.defaultFile
const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

let data
try {
  data = JSON.parse(readFileSync(file, 'utf-8'))
} catch (e) {
  console.error(`✗ Cannot read/parse ${file}: ${e.message}`)
  process.exit(1)
}

// Resolve the items array: honor CONFIG, else auto-detect a common name.
const ITEM_KEYS = ['stations', 'tiles', 'levels', 'items', 'cards', 'questions']
let items = data[CONFIG.itemsField]
if (!Array.isArray(items)) {
  const key = ITEM_KEYS.find((k) => Array.isArray(data[k]))
  items = key ? data[key] : null
}
if (!Array.isArray(items)) {
  err(`No items array found (looked for CONFIG.itemsField + ${ITEM_KEYS.join('/')}).`)
}

for (const k of CONFIG.topLevelRequired) {
  if (data[k] === undefined) err(`Top-level field "${k}" is missing.`)
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
const label = (it, i) => `item #${i + 1} (${it?.[CONFIG.idField] ?? 'no-id'})`

const seen = new Map()
;(items || []).forEach((it, i) => {
  if (it == null || typeof it !== 'object') {
    err(`${label(it, i)} is not an object.`)
    return
  }
  const id = it[CONFIG.idField]
  const type = it[CONFIG.typeField]

  // id present, string, unique
  if (id === undefined || id === '') err(`${label(it, i)} has no "${CONFIG.idField}".`)
  else if (typeof id !== 'string') err(`${label(it, i)} ${CONFIG.idField} must be a string.`)
  else if (seen.has(id)) err(`Duplicate ${CONFIG.idField} "${id}" (also ${label(items[seen.get(id)], seen.get(id))}).`)
  else seen.set(id, i)

  // type known
  if (type === undefined) err(`${label(it, i)} has no "${CONFIG.typeField}".`)
  else if (!(type in CONFIG.requiredByType)) warn(`${label(it, i)} has unknown type "${type}".`)

  // required fields per type
  for (const path of CONFIG.requiredByType[type] || []) {
    const v = get(it, path)
    if (v === undefined || v === null || v === '') err(`${label(it, i)} missing required "${path}".`)
  }

  // quiz-specific deep checks — run for ANY item carrying a quiz block, not
  // just type === 'quiz' (a quiz can ride on an event/story/end tile too).
  if (it.quiz) {
    const q = it.quiz
    if (Array.isArray(q.options)) {
      if (q.options.length < 2) err(`${label(it, i)} quiz needs ≥2 options.`)
      if (typeof q.answerIndex === 'number') {
        if (q.answerIndex < 0 || q.answerIndex >= q.options.length)
          err(`${label(it, i)} quiz answerIndex ${q.answerIndex} out of range [0, ${q.options.length - 1}].`)
      } else if (q.answerIndex !== undefined) {
        err(`${label(it, i)} quiz answerIndex must be a number.`)
      }
      const uniq = new Set(q.options.map((o) => String(o).trim()))
      if (uniq.size < q.options.length) warn(`${label(it, i)} quiz has duplicate options.`)
    } else if (q.options !== undefined) {
      err(`${label(it, i)} quiz.options must be an array.`)
    }
    if (q.explanation !== undefined && String(q.explanation).trim() === '')
      warn(`${label(it, i)} quiz.explanation is empty.`)
  }

  // effect vocabulary (item.effect and event.effect)
  const effects = [it.effect, it.event?.effect].filter((e) => e && typeof e === 'object')
  for (const eff of effects) {
    for (const [k, v] of Object.entries(eff)) {
      const expected = CONFIG.effectVocab[k]
      if (!expected) err(`${label(it, i)} unknown effect key "${k}" (typo? not in effectVocab).`)
      else if (typeof v !== expected) err(`${label(it, i)} effect "${k}" must be ${expected}, got ${typeof v}.`)
    }
  }

  // numeric ranges
  for (const [field, [min, max]] of Object.entries(CONFIG.ranges)) {
    const v = it[field]
    if (v === undefined) continue
    if (typeof v !== 'number') err(`${label(it, i)} "${field}" must be a number.`)
    else if (v < min || v > max) warn(`${label(it, i)} "${field}"=${v} outside [${min}, ${max}].`)
  }
})

// ----------------------------------------------------------------- report ---
console.log(`\nValidated ${file} — ${items?.length ?? 0} items.`)
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s):`)
  warnings.forEach((w) => console.log('   - ' + w))
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):`)
  errors.forEach((e) => console.log('   - ' + e))
  console.log('')
  process.exit(1)
}
console.log(warnings.length ? '\n✓ No errors (warnings above).\n' : '\n✓ All checks passed.\n')
