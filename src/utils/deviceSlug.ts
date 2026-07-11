import { Device } from '../types/Property.types';

const slugify = (value: string): string => {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
};

const getBaseSlug = (device: Pick<Device, 'type' | 'brand' | 'model'>): string => {
	const base = [device.type, device.brand, device.model].filter(Boolean).join('-');
	return slugify(base || 'device') || 'device';
};

export const getDeviceSlugBase = (
	device: Pick<Device, 'type' | 'brand' | 'model'>,
): string => getBaseSlug(device);

export const buildDeviceSlug = (
	device: Pick<Device, 'id' | 'type' | 'brand' | 'model'>,
): string => {
	const normalizedBase = getBaseSlug(device);
	return `${normalizedBase}--${device.id}`;
};

export const getDeviceIdFromSlug = (
	deviceSlug: string | undefined,
): string | null => {
	if (!deviceSlug) return null;
	const decoded = decodeURIComponent(deviceSlug);
	const delimiterIndex = decoded.lastIndexOf('--');

	if (delimiterIndex === -1) {
		// New format: <pretty-slug>-<deviceId>
		const parts = decoded.split('-').filter(Boolean);
		if (parts.length > 1) {
			return parts[parts.length - 1];
		}

		// Backward compatibility if route ever used raw IDs.
		return decoded;
	}

	const id = decoded.slice(delimiterIndex + 2).trim();
	return id || null;
};
