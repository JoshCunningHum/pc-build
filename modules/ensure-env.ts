// oxlint-disable no-console

import type { ZodAny, ZodSafeParseResult } from 'zod';
import { styleText } from 'node:util';
import { createResolver, defineNuxtModule } from '@nuxt/kit';
import z, { ZodError } from 'zod';

export interface EnsureEnvOptions {
	envPath: string;
}

export default defineNuxtModule<EnsureEnvOptions>({
	meta: {
		name: 'ensure-env',
		configKey: 'ensureEnv',
	},
	defaults: {
		envPath: './app/env',
	},
	async setup(options) {
		const resolver = createResolver(import.meta.url);
		const envPath = resolver.resolve('../', options.envPath);

		try {
			const env = (await import(envPath)) as ZodSafeParseResult<ZodAny>;

			console.info(`LOADING ENV..`);
			console.info(`${Object.keys(env).length} keys loaded.`);
		} catch (e) {
			if (e instanceof ZodError) {
				const { fieldErrors } = z.flattenError(e);

				console.error(styleText(['bold', 'redBright'], 'ENV Failure'));
				for (const entry of Object.entries(fieldErrors)) {
					const [key, errors] = entry as [string, string[]];
					console.log(`- ${styleText(['bold', 'yellow'], key)}: ${errors}`);
				}
				console.log('\n');

				process.exit(1);
			}

			if (e instanceof Error) {
				const msg = e.message;

				if (msg.includes('Cannot find module')) {
					throw new Error(`EnvEnsure: passed 'envPath' doesn't exist`, { cause: e });
				}
			}

			throw e;
		}
	},
});
