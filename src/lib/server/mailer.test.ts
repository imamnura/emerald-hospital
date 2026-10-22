import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setEnv } from '../../test/mocks/env-private.ts';
import * as m from './mailer.ts';

const { sendMailMock, createTransport } = vi.hoisted(() => {
	const sendMailMock = vi.fn(async (_opts: unknown) => ({ messageId: 'id' }));
	const createTransport = vi.fn((_opts: unknown) => ({ sendMail: sendMailMock }));
	return { sendMailMock, createTransport };
});

vi.mock('nodemailer', () => ({ default: { createTransport } }));

// NOTE: mailer.ts caches its transporter at module level, so the tests below rely on
// file order: nothing creates a transporter before the "cached SMTP transporter" test.

const mail = { to: 'a@b.com', subject: 'Hi', text: 'plain body', html: '<p>html</p>' };

beforeEach(() => {
	sendMailMock.mockClear();
	createTransport.mockClear();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('getConfig / isConfigured', () => {
	it('is null unless host, user and pass are all set', async () => {
		expect(m.getConfig()).toBeNull();
		expect(m.isConfigured()).toBe(false);
		setEnv({ SMTP_HOST: 'smtp.x', SMTP_USER: 'u' });
		expect(m.getConfig()).toBeNull();
		setEnv({ SMTP_HOST: undefined, SMTP_PASS: 'p' });
		expect(m.getConfig()).toBeNull();
		setEnv({ SMTP_HOST: 'smtp.x', SMTP_USER: undefined });
		expect(m.getConfig()).toBeNull();
	});

	it('defaults from to the user and honours explicit values', async () => {
		setEnv({ SMTP_HOST: 'smtp.x', SMTP_USER: 'u@x', SMTP_PASS: 'p' });
		expect(m.getConfig()).toEqual({
			host: 'smtp.x',
			port: 587,
			secure: false,
			user: 'u@x',
			pass: 'p',
			from: 'u@x'
		});
		expect(m.isConfigured()).toBe(true);
		setEnv({ SMTP_FROM: 'Clinic <no-reply@x>', SMTP_PORT: 465, SMTP_SECURE: true });
		expect(m.getConfig()).toMatchObject({ from: 'Clinic <no-reply@x>', port: 465, secure: true });
	});
});

describe('sendMail', () => {
	it('logs instead of sending when SMTP is not configured', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		await m.sendMail(mail);
		expect(createTransport).not.toHaveBeenCalled();
		expect(sendMailMock).not.toHaveBeenCalled();
		expect(log).toHaveBeenCalledTimes(1);
		const msg = String(log.mock.calls[0][0]);
		expect(msg).toContain('SMTP not configured');
		expect(msg).toContain('To: a@b.com');
		expect(msg).toContain('Subject: Hi');
		expect(msg).toContain('plain body');
	});

	it('sends through a cached SMTP transporter when configured', async () => {
		setEnv({ SMTP_HOST: 'smtp.x', SMTP_PORT: 465, SMTP_SECURE: true, SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'f@x' });
		await m.sendMail(mail);
		await m.sendMail({ ...mail, to: 'c@d.com' });

		expect(createTransport).toHaveBeenCalledTimes(1);
		expect(createTransport).toHaveBeenCalledWith({
			host: 'smtp.x',
			port: 465,
			secure: true,
			auth: { user: 'u', pass: 'p' }
		});
		expect(sendMailMock).toHaveBeenCalledTimes(2);
		expect(sendMailMock).toHaveBeenNthCalledWith(1, {
			from: 'f@x',
			to: 'a@b.com',
			subject: 'Hi',
			text: 'plain body',
			html: '<p>html</p>'
		});
		expect(sendMailMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: 'c@d.com' }));
	});

	it('propagates transport errors', async () => {
		setEnv({ SMTP_HOST: 'smtp.x', SMTP_USER: 'u', SMTP_PASS: 'p' });
		sendMailMock.mockRejectedValueOnce(new Error('boom'));
		await expect(m.sendMail(mail)).rejects.toThrow('boom');
	});
});
