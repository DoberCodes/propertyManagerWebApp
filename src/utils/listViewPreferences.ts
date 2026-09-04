export const readCollapsedGroupPreference = <T extends string>(
	storage: Pick<Storage, 'getItem'> | null | undefined,
	key: string,
	defaults: Record<T, boolean>,
): { value: Record<T, boolean>; wasSaved: boolean } => {
	if (!storage) return { value: defaults, wasSaved: false };
	try {
		const raw = storage.getItem(key);
		if (!raw) return { value: defaults, wasSaved: false };
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const value = Object.keys(defaults).reduce<Record<T, boolean>>(
			(result, groupId) => {
				result[groupId as T] =
					typeof parsed[groupId] === 'boolean'
						? Boolean(parsed[groupId])
						: defaults[groupId as T];
				return result;
			},
			{ ...defaults },
		);
		return { value, wasSaved: true };
	} catch {
		return { value: defaults, wasSaved: false };
	}
};

export const writeCollapsedGroupPreference = <T extends string>(
	storage: Pick<Storage, 'setItem'> | null | undefined,
	key: string,
	value: Record<T, boolean>,
) => {
	if (!storage) return;
	try {
		storage.setItem(key, JSON.stringify(value));
	} catch {
		// The preference is optional; storage restrictions must not block the list.
	}
};
