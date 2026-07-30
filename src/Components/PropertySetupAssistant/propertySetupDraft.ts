import type { PropertySetupAssistantState } from '../../types/Property.types';
import {
	PROPERTY_SETUP_AREAS,
	type PropertySetupAreaId,
} from '../../utils/propertySetupAssistant';

const DRAFT_VERSION = 1;
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type SetupItems = NonNullable<PropertySetupAssistantState['items']>;

interface DraftStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

interface StoredPropertySetupDraft {
	version: typeof DRAFT_VERSION;
	savedAt: string;
	baseUpdatedAt?: string;
	selectedAreaId: PropertySetupAreaId;
	items: SetupItems;
}

interface PropertySetupDraftScope {
	userId: string;
	propertyId: string;
}

interface ReadPropertySetupDraftOptions extends PropertySetupDraftScope {
	serverUpdatedAt?: string;
	nowMs?: number;
}

interface WritePropertySetupDraftOptions extends PropertySetupDraftScope {
	baseUpdatedAt?: string;
	selectedAreaId: PropertySetupAreaId;
	items: SetupItems;
	now?: Date;
}

const validAreaIds = new Set<PropertySetupAreaId>(
	PROPERTY_SETUP_AREAS.map((area) => area.id),
);

const parseTimestamp = (value?: string) => {
	if (!value) return null;
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? timestamp : null;
};

export const getPropertySetupDraftStorageKey = ({
	userId,
	propertyId,
}: PropertySetupDraftScope) =>
	`maintley:property-setup-draft:v${DRAFT_VERSION}:${encodeURIComponent(
		userId,
	)}:${encodeURIComponent(propertyId)}`;

const isStoredPropertySetupDraft = (
	value: unknown,
): value is StoredPropertySetupDraft => {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<StoredPropertySetupDraft>;
	return (
		candidate.version === DRAFT_VERSION &&
		typeof candidate.savedAt === 'string' &&
		parseTimestamp(candidate.savedAt) !== null &&
		typeof candidate.selectedAreaId === 'string' &&
		validAreaIds.has(candidate.selectedAreaId as PropertySetupAreaId) &&
		Boolean(candidate.items) &&
		typeof candidate.items === 'object' &&
		!Array.isArray(candidate.items)
	);
};

export const readPropertySetupDraft = (
	storage: DraftStorage,
	options: ReadPropertySetupDraftOptions,
): StoredPropertySetupDraft | null => {
	const key = getPropertySetupDraftStorageKey(options);
	try {
		const rawValue = storage.getItem(key);
		if (!rawValue) return null;

		const parsedValue: unknown = JSON.parse(rawValue);
		if (!isStoredPropertySetupDraft(parsedValue)) {
			storage.removeItem(key);
			return null;
		}

		const savedAtMs = parseTimestamp(parsedValue.savedAt) as number;
		const nowMs = options.nowMs ?? Date.now();
		const serverUpdatedAtMs = parseTimestamp(options.serverUpdatedAt);
		if (
			nowMs - savedAtMs > DRAFT_MAX_AGE_MS ||
			(serverUpdatedAtMs !== null && serverUpdatedAtMs >= savedAtMs)
		) {
			storage.removeItem(key);
			return null;
		}

		return parsedValue;
	} catch {
		storage.removeItem(key);
		return null;
	}
};

export const writePropertySetupDraft = (
	storage: DraftStorage,
	options: WritePropertySetupDraftOptions,
) => {
	const value: StoredPropertySetupDraft = {
		version: DRAFT_VERSION,
		savedAt: (options.now || new Date()).toISOString(),
		...(options.baseUpdatedAt
			? { baseUpdatedAt: options.baseUpdatedAt }
			: {}),
		selectedAreaId: options.selectedAreaId,
		items: options.items,
	};
	try {
		storage.setItem(
			getPropertySetupDraftStorageKey(options),
			JSON.stringify(value),
		);
	} catch {
		// Draft recovery is best-effort and must never block setup.
	}
};

export const clearPropertySetupDraft = (
	storage: DraftStorage,
	scope: PropertySetupDraftScope,
) => {
	try {
		storage.removeItem(getPropertySetupDraftStorageKey(scope));
	} catch {
		// Draft cleanup is best-effort and must never block setup.
	}
};
