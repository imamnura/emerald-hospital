import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Postgres connection string',
		schema: (value) => value || 'postgresql://postgres:postgres@localhost:5432/emerald_hospital'
	},

	// Google OAuth (optional — enables "Continue with Google")
	GOOGLE_CLIENT_ID: { schema: optional },
	GOOGLE_CLIENT_SECRET: { schema: optional },

	// SMTP (optional — without it, reset links are logged to the server console)
	SMTP_HOST: { schema: optional },
	SMTP_PORT: {
		schema: (value) => {
			const port = Number(value || 587);
			if (!Number.isInteger(port)) throw new Error('SMTP_PORT must be an integer');
			return port;
		}
	},
	SMTP_SECURE: { schema: (value) => value === 'true' },
	SMTP_USER: { schema: optional },
	SMTP_PASS: { schema: optional },
	SMTP_FROM: { schema: optional }
});
