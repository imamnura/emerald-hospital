/**
 * Test stand-in for `$app/env/private`. Values are live bindings, so modules that
 * read `env.X` at call time see changes made through `setEnv()`.
 */
export let DATABASE_URL: string = 'postgresql://test:test@localhost:5432/test';
export let GOOGLE_CLIENT_ID: string | undefined = undefined;
export let GOOGLE_CLIENT_SECRET: string | undefined = undefined;
export let SMTP_HOST: string | undefined = undefined;
export let SMTP_PORT: number = 587;
export let SMTP_SECURE: boolean = false;
export let SMTP_USER: string | undefined = undefined;
export let SMTP_PASS: string | undefined = undefined;
export let SMTP_FROM: string | undefined = undefined;

export type TestEnv = {
	DATABASE_URL?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	SMTP_HOST?: string;
	SMTP_PORT?: number;
	SMTP_SECURE?: boolean;
	SMTP_USER?: string;
	SMTP_PASS?: string;
	SMTP_FROM?: string;
};

export function setEnv(values: TestEnv): void {
	if ('DATABASE_URL' in values) DATABASE_URL = values.DATABASE_URL!;
	if ('GOOGLE_CLIENT_ID' in values) GOOGLE_CLIENT_ID = values.GOOGLE_CLIENT_ID;
	if ('GOOGLE_CLIENT_SECRET' in values) GOOGLE_CLIENT_SECRET = values.GOOGLE_CLIENT_SECRET;
	if ('SMTP_HOST' in values) SMTP_HOST = values.SMTP_HOST;
	if ('SMTP_PORT' in values) SMTP_PORT = values.SMTP_PORT!;
	if ('SMTP_SECURE' in values) SMTP_SECURE = values.SMTP_SECURE!;
	if ('SMTP_USER' in values) SMTP_USER = values.SMTP_USER;
	if ('SMTP_PASS' in values) SMTP_PASS = values.SMTP_PASS;
	if ('SMTP_FROM' in values) SMTP_FROM = values.SMTP_FROM;
}

export function resetEnv(): void {
	DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
	GOOGLE_CLIENT_ID = undefined;
	GOOGLE_CLIENT_SECRET = undefined;
	SMTP_HOST = undefined;
	SMTP_PORT = 587;
	SMTP_SECURE = false;
	SMTP_USER = undefined;
	SMTP_PASS = undefined;
	SMTP_FROM = undefined;
}
