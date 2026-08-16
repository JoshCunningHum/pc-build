import z from 'zod';

const EnvSchema = z.object({
	VITE_APP_NAME: z.string('Nothing found'),
});

export const env = EnvSchema.parse(import.meta.env);
