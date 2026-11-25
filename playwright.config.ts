import { defineConfig, devices } from '@playwright/test';

const base = process.env.VITE_BASE_PATH || '/';
const baseURL = new URL(base, 'http://127.0.0.1:4173').href;

export default defineConfig({
  testDir: './tests/e2e',
  // Both viewport projects render with software WebGL in headless CI.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL, trace: 'retain-on-failure' },
  projects: ['1280x720', '1920x1080'].map((resolution) => {
    const [width, height] = resolution.split('x').map(Number);
    return {
      name: 'chromium-' + resolution,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: width!, height: height! },
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          args: ['--enable-unsafe-swiftshader'],
        },
      },
    };
  }),
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
