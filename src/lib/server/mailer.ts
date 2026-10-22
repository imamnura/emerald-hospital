import nodemailer from 'nodemailer';
import * as env from '$app/env/private';

export type MailConfig = {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	from: string;
};

export function getConfig(): MailConfig | null {
	const host = env.SMTP_HOST;
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;
	if (!host || !user || !pass) return null;

	return {
		host,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		user,
		pass,
		from: env.SMTP_FROM || user
	};
}

export function isConfigured(): boolean {
	return getConfig() !== null;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter(config: MailConfig) {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: { user: config.user, pass: config.pass }
		});
	}
	return transporter;
}

export type SendMailArgs = {
	to: string;
	subject: string;
	html: string;
	text: string;
};

/**
 * Sends via SMTP when configured. Otherwise falls back to logging the
 * message so the forgot-password flow stays usable in local/demo setups
 * that haven't set SMTP_* env vars yet.
 */
export async function sendMail(args: SendMailArgs): Promise<void> {
	const config = getConfig();
	if (!config) {
		console.log(`[mailer] SMTP not configured — logging email instead of sending.
To: ${args.to}
Subject: ${args.subject}
${args.text}`);
		return;
	}

	await getTransporter(config).sendMail({
		from: config.from,
		to: args.to,
		subject: args.subject,
		text: args.text,
		html: args.html
	});
}
