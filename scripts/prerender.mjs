// Injects the server-rendered App into dist/index.html after `vite build`.
// Runs as the last step of `npm run build` (see package.json).
import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = path.join(root, 'dist', 'index.html')
const serverEntry = path.join(root, 'dist-server', 'entry-server.js')

const { render } = await import(pathToFileURL(serverEntry).href)
const template = await readFile(indexPath, 'utf8')

const marker = '<!--app-html-->'
if (!template.includes(marker)) {
  throw new Error(`prerender: ${marker} not found in dist/index.html`)
}

await writeFile(indexPath, template.replace(marker, render()))
await rm(path.join(root, 'dist-server'), { recursive: true, force: true })
console.log('prerender: dist/index.html filled with static markup')
