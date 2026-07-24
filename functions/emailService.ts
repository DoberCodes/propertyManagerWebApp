import { Resend } from 'resend';

export interface EmailSendRequest {
	to: string | string[];
	subject: string;
	html: string;
	from?: string;
	replyTo?: string;
	idempotencyKey?: string;
	attachments?: Array<{
		filename: string;
		content: string;
		type?: string;
	}>;
}

export const getResendClient = (apiKey?: string | null): Resend | null => {
	if (!apiKey) return null;
	return new Resend(apiKey);
};

export const getDefaultFromAddress = (
	fallback: string = 'Maintley <noreply@maintleyapp.com>',
): string => process.env.RESEND_FROM_EMAIL || fallback;

export const getFeedbackFromAddress = (): string =>
	process.env.RESEND_FEEDBACK_FROM_EMAIL ||
	'Maintley Feedback <feedback@maintleyapp.com>';

export const sendMaintleyEmail = async (
	client: Resend | null,
	request: EmailSendRequest,
) => {
	if (!client) {
		throw new Error('Resend client is not configured');
	}

	const response = await client.emails.send({
		to: request.to,
		from: request.from || getDefaultFromAddress(),
		subject: request.subject,
		html: request.html,
		...(request.replyTo && { replyTo: request.replyTo }),
		...(request.attachments && { attachments: request.attachments }),
	}, request.idempotencyKey
		? { idempotencyKey: request.idempotencyKey }
		: undefined);

	if (response.error) {
		throw new Error(response.error.message || 'Email provider rejected the message.');
	}

	return response;
};

export const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
