import { execSync } from 'node:child_process';
import path from 'node:path';
import fse from 'fs-extra';
import { globContentJSON } from 'test-helper';
import { describe, expect, test } from 'vitest';

describe('build command', async () => {
  test('basic', async () => {
    await fse.remove(path.join(__dirname, 'dist'));
    execSync('npx rslib build', {
      cwd: __dirname,
    });

    const files = await globContentJSON(path.join(__dirname, 'dist'));
    const fileNames = Object.keys(files).sort();
    expect(fileNames).toMatchInlineSnapshot(`
      [
        "<ROOT>/tests/integration/cli/dist/cjs/index.cjs",
        "<ROOT>/tests/integration/cli/dist/esm/index.js",
      ]
    `);
  });

  test('--lib', async () => {
    await fse.remove(path.join(__dirname, 'dist'));
    execSync('npx rslib build --lib esm', {
      cwd: __dirname,
    });

    const files = await globContentJSON(path.join(__dirname, 'dist'));
    const fileNames = Object.keys(files).sort();
    expect(fileNames).toMatchInlineSnapshot(`
      [
        "<ROOT>/tests/integration/cli/dist/esm/index.js",
      ]
    `);
  });

  test('--lib multiple', async () => {
    await fse.remove(path.join(__dirname, 'dist'));
    execSync('npx rslib build --lib esm --lib cjs', {
      cwd: __dirname,
    });

    const files = await globContentJSON(path.join(__dirname, 'dist'));
    const fileNames = Object.keys(files).sort();
    expect(fileNames).toMatchInlineSnapshot(`
      [
        "<ROOT>/tests/integration/cli/dist/cjs/index.cjs",
        "<ROOT>/tests/integration/cli/dist/esm/index.js",
      ]
    `);
  });
});
