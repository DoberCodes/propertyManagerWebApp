export const PROPERTY_IMAGE_PLACEHOLDER =
	'/house.jpg';

const normalizeImagePath = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\/[^/]+/i, '')
		.split('?')[0]
		.split('#')[0];

export const getPropertyImageSrc = (image?: string | null) =>
	String(image || '').trim() || PROPERTY_IMAGE_PLACEHOLDER;

export const isPropertyImageFallback = (image?: string | null) => {
	const normalizedImage = normalizeImagePath(String(image || ''));
	const normalizedFallback = normalizeImagePath(PROPERTY_IMAGE_PLACEHOLDER);
	return normalizedImage.length === 0 || normalizedImage === normalizedFallback;
};