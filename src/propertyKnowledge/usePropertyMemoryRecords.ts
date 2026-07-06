import { useEffect, useMemo, useState } from 'react';
import type { Property } from '../types/Property.types';
import {
	getEmbeddedPropertyDocuments,
	getEmbeddedPropertyKnowledgeSuggestions,
	subscribeToPropertyMemoryRecords,
	type PropertyMemoryRecords,
} from './propertyMemoryRecordService';

export const usePropertyMemoryRecords = (
	property?: Partial<Property> | null,
) => {
	const embeddedRecords = useMemo<PropertyMemoryRecords>(
		() => ({
			documents: getEmbeddedPropertyDocuments(property),
			knowledgeSuggestions: getEmbeddedPropertyKnowledgeSuggestions(property),
		}),
		[property],
	);
	const [records, setRecords] = useState<PropertyMemoryRecords>(embeddedRecords);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		setRecords(embeddedRecords);
		if (!property?.id) return undefined;

		return subscribeToPropertyMemoryRecords({
			property,
			onChange: setRecords,
			onError: setError,
		});
	}, [embeddedRecords, property]);

	return {
		...records,
		error,
	};
};

