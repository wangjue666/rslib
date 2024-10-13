import { describe, expect, test } from 'vitest';
import {
  transformSyntaxToBrowserslist,
  transformSyntaxToRspackTarget,
} from '../src/utils/syntax';

describe('transformSyntaxToBrowserslist', () => {
  test('esX', () => {
    expect(transformSyntaxToBrowserslist('es6')).toMatchInlineSnapshot(`
      [
        "chrome >= 51",
        "opera >= 38",
        "edge >= 79",
        "firefox >= 53",
        "safari >= 16.3",
        "node >= 6.5",
        "deno >= 1",
        "ios >= 16.3",
        "samsung >= 5",
        "opera_mobile >= 41",
        "electron >= 1.2",
      ]
    `);

    expect(transformSyntaxToBrowserslist('es2018')).toMatchInlineSnapshot(`
      [
        "chrome >= 60",
        "opera >= 47",
        "edge >= 79",
        "firefox >= 55",
        "safari >= 16.3",
        "node >= 8.3",
        "deno >= 1",
        "ios >= 16.3",
        "samsung >= 8",
        "opera_mobile >= 44",
        "electron >= 2.0",
      ]
    `);

    const web = transformSyntaxToBrowserslist('esnext', 'web');
    const webWorker = transformSyntaxToBrowserslist('esnext', 'web-worker');
    expect(web).toStrictEqual(webWorker);
    expect(web).toMatchInlineSnapshot(`
      [
        "last 1 Chrome versions",
        "last 1 Firefox versions",
        "last 1 Edge versions",
        "last 1 Safari versions",
        "last 1 ios_saf versions",
        "not dead",
      ]
    `);

    expect(
      transformSyntaxToBrowserslist('esnext', 'node'),
    ).toMatchInlineSnapshot(`
      [
        "last 1 node versions",
      ]
    `);
    expect(transformSyntaxToBrowserslist('esnext', 'node')).toStrictEqual(
      transformSyntaxToBrowserslist('es2024', 'node'),
    );
  });

  test('browserslist', () => {
    expect(
      transformSyntaxToBrowserslist(['fully supports es6-module']),
    ).toMatchInlineSnapshot(`
        [
          "fully supports es6-module",
        ]
      `);

    expect(
      transformSyntaxToBrowserslist(['node 14', 'Chrome 103']),
    ).toMatchInlineSnapshot(`
      [
        "node 14",
        "Chrome 103",
      ]
    `);
  });

  test('combined', () => {
    expect(
      transformSyntaxToBrowserslist(['Chrome 123', 'es5']),
    ).toMatchInlineSnapshot(`
      [
        "Chrome 123",
        "Chrome >= 5.0.0",
        "Edge >= 12.0.0",
        "Firefox >= 2.0.0",
        "ie >= 9.0.0",
        "iOS >= 6.0.0",
        "Node >= 0.4.0",
        "Opera >= 10.10.0",
        "Safari >= 3.1.0",
      ]
    `);

    expect(transformSyntaxToBrowserslist(['es5'])).toEqual(
      transformSyntaxToBrowserslist('es5'),
    );
  });
});

describe('transformSyntaxToRspackTarget', () => {
  test('esX', () => {
    const es2023 = transformSyntaxToRspackTarget('es2023');
    const es2024 = transformSyntaxToRspackTarget('es2024');
    const esnext = transformSyntaxToRspackTarget('esnext');

    expect(es2023).toEqual(es2024);
    expect(es2023).toEqual(esnext);

    expect(es2023).toMatchInlineSnapshot(
      `
      [
        "es2022",
      ]
    `,
    );

    expect(transformSyntaxToRspackTarget('es2015')).toMatchInlineSnapshot(
      `
      [
        "es2015",
      ]
    `,
    );
  });

  test('combined', () => {
    expect(
      transformSyntaxToRspackTarget(['Chrome 123', 'es2023']),
    ).toMatchInlineSnapshot(`
      [
        "browserslist:Chrome 123",
        "es2022",
      ]
    `);
  });
});
