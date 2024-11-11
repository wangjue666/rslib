import { createRsbuild, mergeRsbuildConfig } from '@rsbuild/core';
import { composeRsbuildEnvironments, pruneEnvironments } from './config';

import type { RsbuildConfig, RsbuildInstance } from '@rsbuild/core';
import type { CommonOptions } from './cli/commands';
import type { RslibConfig } from './types';

export async function startMFDevServer(
  rslibConfig: RslibConfig,
  options?: CommonOptions,
): Promise<RsbuildInstance | undefined> {
  const { environments, environmentWithInfos } =
    await composeRsbuildEnvironments(rslibConfig);
  const selectedEnvironmentNames = environmentWithInfos
    .filter((env) => {
      const isMf = env.format === 'mf';

      if (!options?.lib) {
        return isMf;
      }

      return options.lib.includes(env.name);
    })
    .map((env) => env.name);
  const selectedEnvironments = pruneEnvironments(
    environments,
    selectedEnvironmentNames,
  );

  if (!selectedEnvironmentNames.length) {
    // no mf format, return.
    return;
  }

  for (const env of Object.keys(selectedEnvironments)) {
    selectedEnvironments[env] = changeModeToDevelopment(
      selectedEnvironments[env]!,
    );
  }

  const rsbuildInstance = await createRsbuild({
    rsbuildConfig: {
      environments: selectedEnvironments,
    },
  });
  await rsbuildInstance.startDevServer();
  return rsbuildInstance;
}

function changeModeToDevelopment(rsbuildConfig: RsbuildConfig) {
  return mergeRsbuildConfig(rsbuildConfig, {
    mode: 'development',
    dev: {
      writeToDisk: true,
    },
    tools: {
      rspack: {
        optimization: {
          nodeEnv: 'development',
        },
      },
    },
  });
}
