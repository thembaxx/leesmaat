import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
