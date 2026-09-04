import {
	readCollapsedGroupPreference,
	writeCollapsedGroupPreference,
} from './listViewPreferences';

class MemoryStorage {
	private values = new Map<string, string>();

	getItem(key: string) {
		return this.values.get(key) || null;
	}

	setItem(key: string, value: string) {
		this.values.set(key, value);
	}
}

describe('list view preferences', () => {
	it('uses decision-focused defaults when no preference exists', () => {
		const result = readCollapsedGroupPreference(new MemoryStorage(), 'tasks', {
			overdue: false,
			upcoming: true,
		});

		expect(result).toEqual({
			value: { overdue: false, upcoming: true },
			wasSaved: false,
		});
	});

	it('preserves saved choices and fills newly introduced groups', () => {
		const storage = new MemoryStorage();
		storage.setItem('tasks', JSON.stringify({ overdue: true }));

		expect(
			readCollapsedGroupPreference(storage, 'tasks', {
				overdue: false,
				upcoming: true,
			}),
		).toEqual({
			value: { overdue: true, upcoming: true },
			wasSaved: true,
		});
	});

	it('writes a compact JSON preference without throwing', () => {
		const storage = new MemoryStorage();
		writeCollapsedGroupPreference(storage, 'equipment', {
			comfort: false,
			safety: true,
		});

		expect(storage.getItem('equipment')).toBe(
			JSON.stringify({ comfort: false, safety: true }),
		);
	});
});
