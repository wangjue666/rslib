import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const ecmaVersionFeaturesAdded: Record<string, string[]> = {
  es2022: [
    'transform-class-static-block',
    'transform-class-properties',
    'transform-private-property-in-object',
  ],
  es2021: ['proposal-logical-assignment-operators'],
  es2020: [
    'transform-export-namespace-from',
    'transform-nullish-coalescing-operator',
    'transform-optional-chaining',
  ],
  es2019: ['transform-optional-catch-binding'],
  es2018: ['transform-object-rest-spread'],
  es2017: ['transform-async-to-generator'],
  es2016: ['transform-exponentiation-operator'],
  es2015: [
    'transform-block-scoped-functions',
    'transform-template-literals',
    'transform-classes',
    'transform-spread',
    'transform-object-super',
    'transform-function-name',
    'transform-shorthand-properties',
    'transform-parameters',
    'transform-arrow-functions',
    'transform-duplicate-keys',
    'transform-sticky-regex',
    'transform-typeof-symbol',
    'transform-for-of',
    'transform-computed-properties',
    'transform-destructuring',
    'transform-block-scoping',
    'transform-regenerator',
    'transform-new-target',
  ],
};

export const reduceEcmaVersionFeatures: () => Record<string, string[]> = () => {
  const sortedEcmaVersionFeatures = Object.keys(ecmaVersionFeaturesAdded).sort(
    (a, b) => Number(a.replace('es', '')) - Number(b.replace('es', '')),
  );

  const result: Record<string, string[]> = {};
  for (let i = 0; i < sortedEcmaVersionFeatures.length; i++) {
    const currentVersion = sortedEcmaVersionFeatures[i];
    const previousVersions = sortedEcmaVersionFeatures.slice(0, i + 1);
    result[currentVersion!] = previousVersions.reduce<string[]>(
      (acc, version) => {
        return acc.concat(ecmaVersionFeaturesAdded[version]!);
      },
      [],
    );
  }

  return result;
};

const ecmaVersionFeatures = reduceEcmaVersionFeatures();
const allBrowsers = [
  'chrome',
  'opera',
  'edge',
  'firefox',
  'safari',
  'node',
  // 'deno',
  'ie',
  'ios',
  'samsung',
  // 'opera_mobile',
  'electron',
];

function main() {
  const featuresTable: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'plugins.json'), 'utf8'),
  );

  const ecmaToBrowserslist: Record<string, Record<string, string>> = {};

  for (const version in ecmaVersionFeatures) {
    const features = ecmaVersionFeatures[version]!;
    const result: Record<string, string> = {};
    for (const feature of features) {
      const featureToBrowsers = featuresTable[feature];
      if (!featureToBrowsers) {
        throw new Error(`Feature ${feature} not found in plugins.json`);
      }

      for (const browser of allBrowsers) {
        const f = featureToBrowsers[browser];
        if (result[browser]) {
          if (f) {
            if (Number(result[browser]) < Number(f)) {
              result[browser] = f!;
            }
          } else {
            // if the feature is not listed, remove that browser from result
            delete result[browser];
            break;
          }
        } else {
          if (f) {
            result[browser] = f;
          }
        }
      }
    }

    ecmaToBrowserslist[version] = result;
  }

  fs.writeFileSync(
    // Use json when https://github.com/web-infra-dev/rspack/pull/8126 released.
    path.resolve(__dirname, '../../src/utils/ecmaVersionBrowserslist.ts'),
    `export default ${JSON.stringify(ecmaToBrowserslist, null, 2)}`,
  );
}

main();
