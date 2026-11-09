// Copies HabitBeast app art into the site and pre-rolls the D20's showcase
// monsters. Run it from this repo after the app's art changes:
//
//   npm run sync:art                      (expects the app at ../habitBeast)
//   HABITBEAST_DIR=/path/to/app npm run sync:art
//
// GitHub Pages builds only this repo, so the copies and the monster manifest
// (all in public/lab/, showcase.json included) are committed like any other
// file. Hand-written shared files live in public/theme/, which this leaves
// alone.
//
// The monsters come from the app's own wardrobe tables: this loads the app's
// clothing.ts / monsters.ts / classBundles.ts with an asset shim (every
// require('@assets/x.webp') becomes the string 'x.webp'), rolls outfits the
// way the login-screen parade does, and resolves each one to its stacked
// half-size layers. The site never needs a copy of the clothing logic.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const app = path.resolve(root, process.env.HABITBEAST_DIR ?? '../habitBeast')
const assets = path.join(app, 'src', 'assets')
const out = path.join(root, 'public', 'lab')

if (!existsSync(path.join(assets, 'backgrounds'))) {
  throw new Error(`sync-app-art: no HabitBeast app at ${app} (set HABITBEAST_DIR)`)
}

const LABS = ['steam', 'chem', 'bio']
const LAB_ART = { steam: 'Steam', chem: 'Chem', bio: 'Bio' }

function copy(from, to) {
  mkdirSync(path.dirname(to), { recursive: true })
  cpSync(from, to)
}

// ── Lab backgrounds, D20 faces, panel skins ────────────────────────────────
rmSync(out, { recursive: true, force: true })
for (const lab of LABS) {
  copy(path.join(assets, 'backgrounds', `${LAB_ART[lab]}Lab.webp`), path.join(out, 'bg', `${lab}.webp`))
  for (const tone of ['Mid', 'Light', 'Shadow']) {
    copy(path.join(assets, 'dice', `d20${LAB_ART[lab]}${tone}.webp`), path.join(out, 'dice', `${lab}-${tone.toLowerCase()}.webp`))
  }
  for (let n = 1; n <= 8; n++) {
    copy(path.join(assets, 'panels', `${lab}${n}.webp`), path.join(out, 'panels', `${lab}${n}.webp`))
  }
}

// ── Chains and steam, re-cut for the web with the app's own sharp ──────────
const sharp = createRequire(path.join(app, 'package.json'))('sharp')

// One repeat of each lab's chain as a single vertical strip, so CSS can tile
// and scroll it. Mirrors ChainOverlay in the app: rope for Steam, chain for
// Chem, vine for Bio, links in the order 1, 4, 3, 2.
const CHAIN_ART = { steam: 'rope', chem: 'chain', bio: 'vine' }
const LINK_PX = 64
mkdirSync(path.join(out, 'chains'), { recursive: true })
for (const lab of LABS) {
  const links = await Promise.all(
    [1, 4, 3, 2].map((n) =>
      sharp(path.join(assets, 'chains', `${CHAIN_ART[lab]}${n}.webp`)).resize(LINK_PX, LINK_PX).toBuffer(),
    ),
  )
  await sharp({ create: { width: LINK_PX, height: LINK_PX * 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(links.map((input, i) => ({ input, top: i * LINK_PX, left: 0 })))
    .webp({ quality: 90 })
    .toFile(path.join(out, 'chains', `${lab}.webp`))
}

// The 8-frame steam puff as one sprite sheet, side by side at half size.
const STEAM_W = 300
const STEAM_H = 400
const puffs = await Promise.all(
  Array.from({ length: 8 }, (_, i) =>
    sharp(path.join(assets, 'steam', `steam${i + 1}.webp`)).resize(STEAM_W, STEAM_H).toBuffer(),
  ),
)
await sharp({ create: { width: STEAM_W * 8, height: STEAM_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(puffs.map((input, i) => ({ input, top: 0, left: i * STEAM_W })))
  .webp({ quality: 80 })
  .toFile(path.join(out, 'steam.webp'))

// ── App modules, loaded with an asset shim ─────────────────────────────────
const cache = new Map()

function loadModule(file) {
  if (cache.has(file)) return cache.get(file).exports
  const source = readFileSync(file, 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: file,
  }).outputText
  const module = { exports: {} }
  cache.set(file, module)
  new Function('require', 'module', 'exports', js)((id) => requireFrom(id, path.dirname(file)), module, module.exports)
  return module.exports
}

function requireFrom(id, dir) {
  if (id.startsWith('@assets/')) return id.slice('@assets/'.length)
  if (id === 'react-native' || id === '@types') return {}
  if (id.startsWith('@constants/')) return loadModule(path.join(app, 'src', 'constants', `${id.slice('@constants/'.length)}.ts`))
  if (id.startsWith('./')) return loadModule(path.join(dir, `${id}.ts`))
  throw new Error(`sync-app-art: the asset shim can't load '${id}'`)
}

const constants = path.join(app, 'src', 'constants')
const clothing = loadModule(path.join(constants, 'clothing.ts'))
const monsters = loadModule(path.join(constants, 'monsters.ts'))
const { CLASS_BUNDLES } = loadModule(path.join(constants, 'classBundles.ts'))

// ── Showcase outfits ───────────────────────────────────────────────────────
// Mirrors showcaseMonsterSpec and its pools in the app's
// src/components/common/ClothingOverlay.tsx; keep in sync. A fixed seed keeps
// reruns stable, so a sync only changes files when the app's art changed.
let seed = 0x5eed2026
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
}
const pick = (pool) => pool[Math.floor(rand() * pool.length)]

const GARMENT_SLOTS = new Set(['hat', 'body', 'pants', 'shoes', 'bottom', 'cape', 'wig', 'rollerblade', 'mainHand'])
const SHOWCASE_BASES = clothing.CLOTHING_CATALOG.filter((c) => c.slot === 'base').map((c) => c.id)
const SHOWCASE_GARMENTS_BY_SLOT = {}
const addShowcase = (slot, id) => {
  if (!GARMENT_SLOTS.has(slot)) return
  const list = (SHOWCASE_GARMENTS_BY_SLOT[slot] ??= [])
  if (!list.includes(id)) list.push(id)
}
clothing.CLOTHING_CATALOG.forEach((c) => addShowcase(c.slot, c.id))
CLASS_BUNDLES.forEach((b) => addShowcase(b.closetSlot, b.closetItemId))
clothing.MAIN_HAND_CATALOG.forEach((it) => addShowcase('mainHand', it.id))
clothing.SPEC_CLOTHING_CATALOG.forEach((it) => {
  if (it.tier === 2) addShowcase(it.slot, it.id)
})
clothing.BATTLE_REWARD_CATALOG.forEach((it) => addShowcase(it.slot, it.id))
clothing.DIG_REWARD_CATALOG.forEach((it) => addShowcase(it.slot, it.id))
clothing.SPEC_CLOTHING_CATALOG.forEach((it) => addShowcase(it.slot, it.id))
const SHOWCASE_FACE = {
  mouth: clothing.CLOTHING_CATALOG.filter((c) => c.slot === 'mouth').map((c) => c.id),
  mustache: clothing.CLOTHING_CATALOG.filter((c) => c.slot === 'mustache').map((c) => c.id),
  beard: clothing.CLOTHING_CATALOG.filter((c) => c.slot === 'beard').map((c) => c.id),
}
const JIMOTHY_EXCLUDED = new Set(['tan', 'pretty', 'hairy'])

function showcaseMonsterSpec(monsterId) {
  const allowed = (id) => monsterId !== monsters.JIMOTHY_ID || !JIMOTHY_EXCLUDED.has(id)
  const pickAllowed = (pool) => {
    const options = (pool ?? []).filter(allowed)
    return options.length > 0 ? pick(options) : undefined
  }
  const parts = {}
  const set = (slot, id) => {
    if (id) parts[slot] = id
  }
  if (rand() < 0.85) set('base', pickAllowed(SHOWCASE_BASES))
  if (rand() < 0.15) {
    set('rollerblade', pickAllowed(SHOWCASE_GARMENTS_BY_SLOT.rollerblade))
  } else {
    if (rand() < 0.55) set('shoes', pickAllowed(SHOWCASE_GARMENTS_BY_SLOT.shoes))
    if (rand() < 0.25) set('bottom', pickAllowed(SHOWCASE_GARMENTS_BY_SLOT.bottom))
  }
  for (const slot of Object.keys(SHOWCASE_GARMENTS_BY_SLOT)) {
    if (slot === 'rollerblade' || slot === 'shoes' || slot === 'bottom') continue
    if (rand() < 0.55) set(slot, pickAllowed(SHOWCASE_GARMENTS_BY_SLOT[slot]))
  }
  if (rand() < 0.3) set('mouth', pickAllowed(SHOWCASE_FACE.mouth))
  const facialHair = rand()
  if (facialHair < 0.25) set('mustache', pickAllowed(SHOWCASE_FACE.mustache))
  else if (facialHair < 0.45) set('beard', pickAllowed(SHOWCASE_FACE.beard))
  return { monsterId, parts, mouthExpression: rand() < 0.5 ? 'happy' : 'excited' }
}

// ── Layers ─────────────────────────────────────────────────────────────────
// Mirrors StaticMonsterAvatar's stacking order in the app's
// src/components/monster/MonsterAvatar.tsx; keep in sync. Eyes are left out
// of `layers`: the site swaps them to blink and look around.
const TIER = 'half'
const EYE_STATES = ['open', 'partial', 'partialLeft', 'partialRight', 'closed']
const used = new Set()
const url = (asset) => {
  used.add(asset)
  return asset
}

function layersFor({ monsterId, parts, mouthExpression }) {
  const c = clothing
  const m = monsters
  const layers = []
  const add = (asset) => {
    if (asset) layers.push(url(asset))
  }
  const armsId = c.getBodySwapSourceId(monsterId, parts.arms)
  if (parts.bottom) add(c.getClothingImage(monsterId, parts.bottom, 'bottom', TIER))
  if (parts.wig) add(c.getClassPairedBottomImage(monsterId, parts.wig, TIER))
  if (parts.cape) add(c.getClassPairedBottomImage(monsterId, parts.cape, TIER))
  if (parts.mainHand) add(c.getClothingImage(monsterId, parts.mainHand, 'mainHand', TIER))
  add(m.getOffArmImage(armsId, 'rest', TIER))
  add(m.getMainArmImage(armsId, parts.mainHand ? 'fist' : 'rest', TIER))
  add(m.getMonsterImage(monsterId, TIER))
  for (const slot of c.CLOTHING_SLOT_ORDER) {
    if (parts[slot]) add(c.getClothingImage(monsterId, parts[slot], slot, TIER))
  }
  if (parts.beard) add(c.getClothingImage(monsterId, parts.beard, 'beard', TIER))
  add(m.getMouthImage(monsterId, mouthExpression, parts.mouth ?? 'default', TIER))
  if (parts.mustache) add(m.getMustacheImage(monsterId, mouthExpression, parts.mustache, TIER))
  const eyesId = c.getBodySwapSourceId(monsterId, parts.eyes)
  const eyes = Object.fromEntries(EYE_STATES.map((state) => [state, url(m.getEyeImage(eyesId, state, TIER))]))
  return { layers, eyes }
}

// Five outfits per monster, so every species turns up about as often.
const OUTFITS_PER_MONSTER = 5
const showcase = []
for (const { id, name } of monsters.MONSTERS) {
  for (let i = 0; i < OUTFITS_PER_MONSTER; i++) {
    const spec = showcaseMonsterSpec(id)
    const wearing = Object.entries(spec.parts)
      .filter(([slot]) => slot !== 'base' && slot !== 'mouth')
      .map(([, itemId]) => clothing.getClothingItemName(itemId))
    showcase.push({ species: name, wearing, ...layersFor(spec) })
  }
}

// The Closet's backgrounds, for the card's specimen box: drawn behind the
// monster and cropped to cover, like the app's background slot.
const backgrounds = clothing.BACKGROUND_CATALOG.map((item) => ({
  name: item.name,
  image: url(clothing.getClothingImage('1', item.id, 'background', TIER)),
}))

for (const asset of used) {
  copy(path.join(assets, asset), path.join(out, 'a', asset))
}

let commit = 'unknown'
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: app }).toString().trim()
} catch {
  // Not a git checkout; the manifest just says so.
}
writeFileSync(
  path.join(out, 'showcase.json'),
  `${JSON.stringify({ generatedFrom: `habitBeast@${commit}`, monsters: showcase, backgrounds }, null, 1)}\n`,
)
console.log(
  `sync-app-art: ${showcase.length} showcase monsters, ${backgrounds.length} backgrounds, ${used.size} image files, labs ${LABS.join('/')}`,
)
