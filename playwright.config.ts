/// <reference types="node" />
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// Allow running API-only tests by setting API_ONLY=true in your environment.
// If you prefer browser tests, set BROWSER=chromium|firefox|webkit to run a single browser project.
const apiOnly = true;
const browserProjects = {
  chromium: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  firefox: [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }],
  webkit: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }],
};
type BrowserName = keyof typeof browserProjects;
const browserEnv = process.env.BROWSER as BrowserName | undefined;

const projects = apiOnly
  ? [{ name: 'api', use: {} }]
  : browserEnv && browserProjects[browserEnv]
  ? browserProjects[browserEnv]
  : [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://pederorxai.zendesk.com/login',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects,
});