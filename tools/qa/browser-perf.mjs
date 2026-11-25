import { chromium } from 'playwright';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import { performance } from 'node:perf_hooks';

/* global window, requestAnimationFrame, document */
const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173/kitchen-chaos-3d/';
const captures = process.env.QA_CAPTURE_DIR ?? '/tmp';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--enable-unsafe-swiftshader'] });
for (const [width,height] of [[1280,720],[1920,1080]]) {
  for (const low of [false,true]) {
    const page = await browser.newPage({ viewport: { width,height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const start = performance.now();
    await page.goto(new URL('?render-stats', base).href);
    await page.getByRole('button',{name:'Start shift'}).waitFor();
    const startupMs = Math.round(performance.now()-start);
    if (low) {
      await page.getByText('Settings',{exact:true}).click();
      await page.getByLabel('Low graphics').check();
    }
    await page.getByRole('button',{name:'Career',exact:true}).click();
    await page.getByRole('button',{name:'Start shift'}).click();
    await page.keyboard.down('w');
    const captured = await page.evaluate(async () => {
      const deltas = [];
      const started = window.performance.now();
      await new Promise((done) => {
        let previous;
        const frame = (time) => {
          if (previous !== undefined) deltas.push(time - previous);
          previous = time;
          if (window.performance.now() - started < 2200) requestAnimationFrame(frame);
          else done();
        };
        requestAnimationFrame(frame);
      });
      const total = deltas.reduce((sum, item) => sum + item, 0);
      deltas.sort((a,b) => a-b);
      const stage = document.getElementById('stage');
      const renderer = document.querySelector('canvas').getContext('webgl2');
      const extension = renderer?.getExtension('WEBGL_debug_renderer_info');
      return {
        frames: deltas.length, fps: Math.round(1000 * deltas.length / total),
        p95ms: Number(deltas[Math.floor(deltas.length*.95)]?.toFixed(1)),
        drawCalls: Number(stage.dataset.drawCalls), triangles: Number(stage.dataset.triangles),
        heapMB: window.performance.memory ? Math.round(window.performance.memory.usedJSHeapSize / 1048576) : null,
        renderer: extension ? renderer.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null,
      };
    });
    await page.keyboard.up('w');
    await page.screenshot({path:`${captures}/burger-${width}-${low ? 'low' : 'standard'}.png`});
    console.log(JSON.stringify({browser:browser.version(),width,height,low,startupMs,...captured,errors}));
    await page.close();
  }
}
await browser.close();
