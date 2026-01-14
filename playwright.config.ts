import { defineConfig } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

/**
 * 🔐 LOAD .env BEFORE ANY TESTS OR IMPORTS
 */
dotenv.config({
  path: path.resolve(__dirname, '.env'),
  override: true,
});

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  },
});
