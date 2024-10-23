import type { RsbuildInstance } from '@rsbuild/core';
import type { BuildOptions } from './cli/commands';
import { initRsbuild } from './config';
import type { RslibConfig } from './types/config';

export async function build(
  config: RslibConfig,
  options?: BuildOptions,
): Promise<RsbuildInstance> {
  const rsbuildInstance = await initRsbuild(config);

  console.log(options);
  await rsbuildInstance.startDevServer();
  // await rsbuildInstance.build({
  //   watch: options?.watch,
  // });

  return rsbuildInstance;
}
