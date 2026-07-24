import {
	clearPropertySetupDraft,
	getPropertySetupDraftStorageKey,
	readPropertySetupDraft,
	writePropertySetupDraft,
} from './propertySetupDraft';

class MemoryStorage {
	private values = new Map<string, string>();

	getItem(key: string) {
		return this.values.get(key) || null;
	}

	setItem(key: string, value: string) {
		this.values.set(key, value);
	}

	removeItem(key: string) {
		this.values.delete(key);
	}
}

const scope = { userId: 'user-1', propertyId: 'property-1' };
const savedAt = new Date('2026-07-24T16:00:00.000Z');

describe('property setup draft recovery', () => {
	it('round trips an unfinished property-scoped draft', () => {
		const storage = new MemoryStorage();
		writePropertySetupDraft(storage, {
			...scope,
			baseUpdatedAt: '2026-07-24T15:00:00.000Z',
			selectedAreaId: 'laundry',
			items: { washer: { status: 'present' } },
			now: savedAt,
		});

		expect(
			readPropertySetupDraft(storage, {
				...scope,
				serverUpdatedAt: '2026-07-24T15:00:00.000Z',
				nowMs: savedAt.getTime() + 1000,
			}),
		).toMatchObject({
			selectedAreaId: 'laundry',
			items: { washer: { status: 'present' } },
		});
	});

	it('removes a draft after newer server progress is saved', () => {
		const storage = new MemoryStorage();
		writePropertySetupDraft(storage, {
			...scope,
			selectedAreaId: 'kitchen',
			items: { dishwasher: { status: 'not_present' } },
			now: savedAt,
		});

		expect(
			readPropertySetupDraft(storage, {
				...scope,
				serverUpdatedAt: '2026-07-24T16:01:00.000Z',
				nowMs: savedAt.getTime() + 120000,
			}),
		).toBeNull();
		expect(storage.getItem(getPropertySetupDraftStorageKey(scope))).toBeNull();
	});

	it('removes drafts older than 30 days and malformed values', () => {
		const storage = new MemoryStorage();
		writePropertySetupDraft(storage, {
			...scope,
			selectedAreaId: 'safety',
			items: { 'smoke-detectors': { status: 'present' } },
			now: savedAt,
		});

		expect(
			readPropertySetupDraft(storage, {
				...scope,
				nowMs: savedAt.getTime() + 31 * 24 * 60 * 60 * 1000,
			}),
		).toBeNull();

		storage.setItem(getPropertySetupDraftStorageKey(scope), '{broken');
		expect(readPropertySetupDraft(storage, scope)).toBeNull();
	});

	it('clears a discarded draft', () => {
		const storage = new MemoryStorage();
		writePropertySetupDraft(storage, {
			...scope,
			selectedAreaId: 'garage',
			items: { generator: { status: 'unknown' } },
		});

		clearPropertySetupDraft(storage, scope);

		expect(storage.getItem(getPropertySetupDraftStorageKey(scope))).toBeNull();
	});
});
