/**
 * Attachment Utilities
 * Handles normalization and validation of feedback ticket attachments
 */

export interface NormalizedAttachment {
	name: string;
	url?: string;
}

const toHttpsFromGs = (value: string): string | undefined => {
	const raw = String(value || '').trim();
	if (!raw.toLowerCase().startsWith('gs://')) return undefined;
	const withoutPrefix = raw.slice(5);
	const slashIndex = withoutPrefix.indexOf('/');
	if (slashIndex <= 0 || slashIndex >= withoutPrefix.length - 1) return undefined;
	const bucket = withoutPrefix.slice(0, slashIndex);
	const objectPath = withoutPrefix.slice(slashIndex + 1);
	return `https://storage.googleapis.com/${bucket}/${encodeURI(objectPath)}`;
};

/**
 * Normalize attachment data from various sources into a consistent format
 * Handles strings (URLs or filenames) and objects with various property names
 *
 * @param rawAttachment - Raw attachment data from API or state
 * @param index - Index of attachment in array (used for default naming)
 * @returns Normalized attachment object with name and optional URL
 */
export const normalizeAttachment = (
	rawAttachment: unknown,
	index: number,
): NormalizedAttachment => {
	// Handle string attachments (either URLs or filenames)
	if (typeof rawAttachment === 'string') {
		const value = rawAttachment.trim();
		// If string is a URL, use it as URL and generate name
		if (/^https?:\/\//i.test(value)) {
			return { name: `attachment-${index + 1}`, url: value };
		}
		if (/^gs:\/\//i.test(value)) {
			return { name: `attachment-${index + 1}`, url: toHttpsFromGs(value) };
		}
		// Otherwise treat as filename
		return { name: value || `attachment-${index + 1}` };
	}

	// Handle object attachments (may have various property names)
	const attachment =
		typeof rawAttachment === 'object' && rawAttachment
			? (rawAttachment as Record<string, unknown>)
			: {};

	// Extract filename from common property names
	const name = String(attachment.filename || attachment.name || `attachment-${index + 1}`);

	// Extract URL from common property names
	const rawUrl = String(
		attachment.attachmentUrl ||
			attachment.url ||
			attachment.downloadUrl ||
			attachment.downloadURL ||
			attachment.fileUrl ||
			'',
	).trim();
	const rawPath = String(attachment.path || attachment.storagePath || '').trim();

	// Only include URL if it's a valid HTTP(S) URL
	let url = /^https?:\/\//i.test(rawUrl) ? rawUrl : undefined;
	if (!url && /^gs:\/\//i.test(rawUrl)) {
		url = toHttpsFromGs(rawUrl);
	}
	if (!url && /^gs:\/\//i.test(rawPath)) {
		url = toHttpsFromGs(rawPath);
	}

	return { name, ...(url ? { url } : {}) };
};
