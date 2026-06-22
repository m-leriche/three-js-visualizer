// Screenshot helper: loads the dev server, isolates one ring, snaps a PNG.
// Usage: node shot.mjs <outfile> [hashParams]
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const out = process.argv[2] || 'shot.png'
const url = process.argv[3] || 'http://localhost:5173/'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
await page.setViewport({ width: 960, height: 720, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle0' })
// Let the scene render a few frames (longer if physics needs to settle).
const waitMs = Number(process.argv[4]) || 2500
await new Promise((r) => setTimeout(r, waitMs))
await page.screenshot({ path: out })
await browser.close()
console.log('wrote', out)
