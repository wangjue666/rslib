import fs from 'node:fs';
import { join } from 'node:path';
import {
  type InspectConfigResult,
  mergeRsbuildConfig as mergeConfig,
} from '@rsbuild/core';
import type { Format, LibConfig, RslibConfig } from '@rslib/core';
import { build, loadConfig } from '@rslib/core';
import { globContentJSON } from './helper';

export function generateBundleEsmConfig(config: LibConfig = {}): LibConfig {
  const esmBasicConfig: LibConfig = {
    format: 'esm',
    output: {
      distPath: {
        root: './dist/esm',
      },
    },
  };

  return mergeConfig(esmBasicConfig, config)!;
}

export function generateBundleCjsConfig(config: LibConfig = {}): LibConfig {
  const cjsBasicConfig: LibConfig = {
    format: 'cjs',
    output: {
      distPath: {
        root: './dist/cjs',
      },
    },
  };

  return mergeConfig(cjsBasicConfig, config)!;
}

type FormatType = Format | `${Format}${number}`;
type FilePath = string;

type BuildResult = {
  files: Record<FormatType, FilePath[]>;
  contents: Record<FormatType, Record<FilePath, string>>;
  entries: Record<FormatType, string>;
  entryFiles: Record<FormatType, FilePath>;

  rspackConfig: InspectConfigResult['origin']['bundlerConfigs'];
  rsbuildConfig: InspectConfigResult['origin']['rsbuildConfig'];
  isSuccess: boolean;
};

export async function getResults(
  rslibConfig: RslibConfig,
  type: 'js' | 'dts',
): Promise<Omit<BuildResult, 'rspackConfig' | 'rsbuildConfig' | 'isSuccess'>> {
  const files: Record<string, string[]> = {};
  const contents: Record<string, Record<string, string>> = {};
  const entries: Record<string, string> = {};
  const entryFiles: Record<string, string> = {};
  const formatIndex: Record<Format, number> = {
    esm: 0,
    cjs: 0,
    umd: 0,
  };
  let key = '';

  const formatCount: Record<Format, number> = rslibConfig.lib.reduce(
    (acc, { format }) => {
      acc[format!] = (acc[format!] ?? 0) + 1;
      return acc;
    },
    {} as Record<Format, number>,
  );

  for (const libConfig of rslibConfig.lib) {
    const { format } = libConfig;
    const currentFormatCount = formatCount[format!];
    const currentFormatIndex = formatIndex[format!]++;

    key = currentFormatCount === 1 ? format! : `${format}${currentFormatIndex}`;

    let globFolder = '';
    if (type === 'js') {
      globFolder = libConfig?.output?.distPath?.root!;
    } else if (type === 'dts' && libConfig.dts !== false) {
      globFolder =
        libConfig.dts?.distPath! ?? libConfig?.output?.distPath?.root!;
    }

    if (!globFolder) continue;

    const regex = type === 'dts' ? /\.d.(ts|cts|mts)$/ : /\.(js|cjs|mjs)$/;

    const content: Record<string, string> = await globContentJSON(globFolder, {
      absolute: true,
      ignore: ['**/*.map'],
    });

    const fileSet = Object.keys(content)
      .filter((file) => regex.test(file))
      .sort();
    const filterContent: Record<string, string> = {};
    for (const key of fileSet) {
      if (content[key]) {
        filterContent[key] = content[key];
      }
    }

    if (fileSet.length) {
      files[key] = fileSet;
      contents[key] = filterContent;
    }

    // Only applied in bundle mode, a shortcut to get single entry result
    if (libConfig.bundle !== false && fileSet.length === 1) {
      entries[key] = content[fileSet[0]!]!;
      entryFiles[key] = fileSet[0]!;
    }
  }

  return {
    files,
    contents,
    entries,
    entryFiles,
  };
}

export async function buildAndGetResults(
  fixturePath: string,
  type: 'all',
): Promise<{
  js: BuildResult;
  dts: BuildResult;
}>;
export async function buildAndGetResults(
  fixturePath: string,
  type?: 'js' | 'dts',
): Promise<BuildResult>;
export async function buildAndGetResults(
  fixturePath: string,
  type: 'js' | 'dts' | 'all' = 'js',
) {
  const rslibConfig = await loadConfig({
    cwd: fixturePath,
  });
  process.chdir(fixturePath);
  const rsbuildInstance = await build(rslibConfig);
  const {
    origin: { bundlerConfigs, rsbuildConfig },
  } = await rsbuildInstance.inspectConfig({ verbose: true });
  if (type === 'all') {
    const jsResults = await getResults(rslibConfig, 'js');
    const dtsResults = await getResults(rslibConfig, 'dts');
    return {
      js: {
        contents: jsResults.contents,
        files: jsResults.files,
        entries: jsResults.entries,
        entryFiles: jsResults.entryFiles,
        rspackConfig: bundlerConfigs,
        rsbuildConfig: rsbuildConfig,
        isSuccess: Boolean(rsbuildInstance),
      },
      dts: {
        contents: dtsResults.contents,
        files: dtsResults.files,
        entries: dtsResults.entries,
        entryFiles: dtsResults.entryFiles,
        rspackConfig: bundlerConfigs,
        rsbuildConfig: rsbuildConfig,
        isSuccess: Boolean(rsbuildInstance),
      },
    };
  }

  const results = await getResults(rslibConfig, type);
  return {
    contents: results.contents,
    files: results.files,
    entries: results.entries,
    entryFiles: results.entryFiles,
    rspackConfig: bundlerConfigs,
    rsbuildConfig: rsbuildConfig,
    isSuccess: Boolean(rsbuildInstance),
  };
}

interface FileTree {
  [key: string]: string | FileTree;
}

export function generateFileTree(dir: string) {
  const files = fs.readdirSync(dir);
  const fileTree: FileTree = {};

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      fileTree[file] = generateFileTree(filePath);
    } else {
      fileTree[file] = filePath;
    }
  }

  return fileTree;
}
