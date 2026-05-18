export const APP_VERSION = '1.2.0';

export const contactOptions = [
	{
		title: 'FAQs',
		description: 'Browse common questions.',
		action: 'scroll-faqs' as const
	},
	{
		title: 'Live Chat',
		description: 'Speak with a rep (24/7).',
		action: 'chat' as const
	},
	{
		title: 'Call Center',
		description: 'Speak with our team.',
		action: 'call' as const
	},
	{
		title: 'Email Us',
		description: 'Send detailed inquiry.',
		action: 'email' as const
	}
] as const;

export const popularFaqs = [
	'How do I reschedule an appointment?',
	'What insurance plans are accepted?',
	'How do I access my medical records?',
	'Can I pay my bills online?'
] as const;

export const SUPPORT_PHONE = '+62211234567';
export const SUPPORT_EMAIL = 'support@emerald-hospital.com';
