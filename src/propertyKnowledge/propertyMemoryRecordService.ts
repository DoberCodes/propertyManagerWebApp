import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	query,
	setDoc,
	where,
	type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Property, PropertyDocument } from '../types/Property.types';
import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';

export const PROPERTY_DOCUMENTS_COLLECTION = 'propertyDocuments';
export const PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION =
	'propertyKnowledgeSuggestions';

type PropertyMemoryRecordSource = 'embedded' | 'collection';

export type PropertyDocumentWithSource = PropertyDocument & {
	recordSource?: PropertyMemoryRecordSource;
};

export type PropertyKnowledgeSuggestionWithSource =
	PropertyKnowledgeSuggestion & {
		recordSource?: PropertyMemoryRecordSource;
	};

export type PropertyMemoryRecords = {
	documents: PropertyDocumentWithSource[];
	knowledgeSuggestions: PropertyKnowledgeSuggestionWithSource[];
};

const stripUndefinedDeep = <T,>(value: T): T => {
	if (value === undefined) return value;
	if (value === null) return value;
	if (value instanceof Date) return value;

	if (Array.isArray(value)) {
		return value
			.map((item) => stripUndefinedDeep(item))
			.filter((item) => item !== undefined) as T;
	}

	if (typeof value === 'object') {
		const prototype = Object.getPrototypeOf(value);
		if (prototype && prototype !== Object.prototype) {
			return value;
		}

		const cleanedEntries = Object.entries(value as Record<string, unknown>)
			.filter(([, fieldValue]) => fieldValue !== undefined)
			.map(([key, fieldValue]) => [
				key,
				stripUndefinedDeep(fieldValue),
			])
			.filter(([, fieldValue]) => fieldValue !== undefined);

		return Object.fromEntries(cleanedEntries) as T;
	}

	return value;
};

export const getPropertyAccountId = (property?: Partial<Property> | null) =>
	String(property?.accountId || property?.userId || '').trim();

const buildPropertyScopedQuery = (
	collectionName: string,
	property: Partial<Property>,
) => {
	const constraints = [where('propertyId', '==', property.id)];
	const accountId = getPropertyAccountId(property);
	if (accountId) {
		constraints.push(where('accountId', '==', accountId));
	}

	return query(collection(db, collectionName), ...constraints);
};

const sortDocuments = (documents: PropertyDocumentWithSource[]) =>
	[...documents].sort((a, b) => {
		const aTime = new Date(a.uploadedAt || a.updatedAt || 0).getTime() || 0;
		const bTime = new Date(b.uploadedAt || b.updatedAt || 0).getTime() || 0;
		return bTime - aTime;
	});

const sortSuggestions = (
	suggestions: PropertyKnowledgeSuggestionWithSource[],
) =>
	[...suggestions].sort((a, b) => {
		const statusWeight = (status: string) =>
			status === 'pending' ? 0 : status === 'accepted' ? 1 : 2;
		const weightDelta = statusWeight(a.status) - statusWeight(b.status);
		if (weightDelta !== 0) return weightDelta;
		return (
			(new Date(b.createdAt || b.updatedAt || 0).getTime() || 0) -
			(new Date(a.createdAt || a.updatedAt || 0).getTime() || 0)
		);
	});

export const getEmbeddedPropertyDocuments = (
	property?: Partial<Property> | null,
): PropertyDocumentWithSource[] =>
	(Array.isArray(property?.documents) ? property.documents : []).map(
		(document) => ({
			...document,
			accountId: document.accountId || getPropertyAccountId(property),
			propertyId: document.propertyId || property?.id,
			recordSource: 'embedded',
		}),
	);

export const getEmbeddedPropertyKnowledgeSuggestions = (
	property?: Partial<Property> | null,
): PropertyKnowledgeSuggestionWithSource[] =>
	(Array.isArray(property?.knowledgeSuggestions)
		? property.knowledgeSuggestions
		: []
	).map((suggestion) => ({
		...suggestion,
		accountId: suggestion.accountId || getPropertyAccountId(property),
		propertyId: suggestion.propertyId || property?.id || '',
		recordSource: 'embedded',
	}));

export const mergePropertyDocuments = (
	embeddedDocuments: PropertyDocument[] = [],
	collectionDocuments: PropertyDocument[] = [],
	property?: Partial<Property> | null,
): PropertyDocumentWithSource[] => {
	const byId = new Map<string, PropertyDocumentWithSource>();
	getEmbeddedPropertyDocuments({
		...(property || {}),
		documents: embeddedDocuments,
	} as Partial<Property>).forEach((document) => {
		byId.set(document.id, document);
	});
	collectionDocuments.forEach((document) => {
		byId.set(document.id, {
			...byId.get(document.id),
			...document,
			accountId: document.accountId || getPropertyAccountId(property),
			propertyId: document.propertyId || property?.id,
			recordSource: 'collection',
		});
	});

	return sortDocuments(Array.from(byId.values()));
};

export const mergePropertyKnowledgeSuggestions = (
	embeddedSuggestions: PropertyKnowledgeSuggestion[] = [],
	collectionSuggestions: PropertyKnowledgeSuggestion[] = [],
	property?: Partial<Property> | null,
): PropertyKnowledgeSuggestionWithSource[] => {
	const byId = new Map<string, PropertyKnowledgeSuggestionWithSource>();
	getEmbeddedPropertyKnowledgeSuggestions({
		...(property || {}),
		knowledgeSuggestions: embeddedSuggestions,
	} as Partial<Property>).forEach((suggestion) => {
		byId.set(suggestion.id, suggestion);
	});
	collectionSuggestions.forEach((suggestion) => {
		byId.set(suggestion.id, {
			...byId.get(suggestion.id),
			...suggestion,
			accountId: suggestion.accountId || getPropertyAccountId(property),
			propertyId: suggestion.propertyId || property?.id || '',
			recordSource: 'collection',
		});
	});

	return sortSuggestions(Array.from(byId.values()));
};

const withDocumentCollectionMetadata = (
	property: Partial<Property>,
	document: PropertyDocument,
	nowIso = new Date().toISOString(),
): PropertyDocument => ({
	...document,
	accountId: document.accountId || getPropertyAccountId(property),
	propertyId: document.propertyId || property.id,
	updatedAt: nowIso,
});

const withSuggestionCollectionMetadata = (
	property: Partial<Property>,
	suggestion: PropertyKnowledgeSuggestion,
	nowIso = new Date().toISOString(),
): PropertyKnowledgeSuggestion => ({
	...suggestion,
	accountId: suggestion.accountId || getPropertyAccountId(property),
	propertyId: suggestion.propertyId || property.id || '',
	updatedAt: nowIso,
});

export const savePropertyDocumentsToCollection = async (
	property: Partial<Property>,
	documents: PropertyDocument[],
) => {
	if (!property.id || documents.length === 0) return;
	const nowIso = new Date().toISOString();
	await Promise.all(
		documents.map((documentRecord) =>
			setDoc(
				doc(db, PROPERTY_DOCUMENTS_COLLECTION, documentRecord.id),
				stripUndefinedDeep(
					withDocumentCollectionMetadata(property, documentRecord, nowIso),
				),
				{ merge: true },
			),
		),
	);
};

export const savePropertyKnowledgeSuggestionsToCollection = async (
	property: Partial<Property>,
	suggestions: PropertyKnowledgeSuggestion[],
) => {
	if (!property.id || suggestions.length === 0) return;
	const nowIso = new Date().toISOString();
	await Promise.all(
		suggestions.map((suggestion) =>
			setDoc(
				doc(db, PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION, suggestion.id),
				stripUndefinedDeep(
					withSuggestionCollectionMetadata(property, suggestion, nowIso),
				),
				{ merge: true },
			),
		),
	);
};

export const savePropertyMemoryRecordsToCollections = async ({
	property,
	documents = [],
	knowledgeSuggestions = [],
}: {
	property: Partial<Property>;
	documents?: PropertyDocument[];
	knowledgeSuggestions?: PropertyKnowledgeSuggestion[];
}) => {
	await Promise.all([
		savePropertyDocumentsToCollection(property, documents),
		savePropertyKnowledgeSuggestionsToCollection(property, knowledgeSuggestions),
	]);
};

export const updatePropertyDocumentInCollection = async (
	property: Partial<Property>,
	documentId: string,
	updates: Partial<PropertyDocument>,
) => {
	if (!property.id || !documentId) return;
	await setDoc(
		doc(db, PROPERTY_DOCUMENTS_COLLECTION, documentId),
		stripUndefinedDeep({
			...updates,
			id: documentId,
			accountId: updates.accountId || getPropertyAccountId(property),
			propertyId: updates.propertyId || property.id,
			updatedAt: new Date().toISOString(),
		}),
		{ merge: true },
	);
};

export const deletePropertyDocumentFromCollection = async (documentId: string) => {
	if (!documentId) return;
	await deleteDoc(doc(db, PROPERTY_DOCUMENTS_COLLECTION, documentId));
};

export const updatePropertyKnowledgeSuggestionInCollection = async (
	property: Partial<Property>,
	suggestion: PropertyKnowledgeSuggestion,
) => {
	if (!property.id || !suggestion.id) return;
	await setDoc(
		doc(db, PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION, suggestion.id),
		stripUndefinedDeep(
			withSuggestionCollectionMetadata(property, suggestion),
		),
		{ merge: true },
	);
};

export const fetchPropertyMemoryRecords = async (
	property: Partial<Property>,
): Promise<PropertyMemoryRecords> => {
	if (!property.id) {
		return {
			documents: getEmbeddedPropertyDocuments(property),
			knowledgeSuggestions: getEmbeddedPropertyKnowledgeSuggestions(property),
		};
	}

	const [documentSnapshot, suggestionSnapshot] = await Promise.all([
		getDocs(buildPropertyScopedQuery(PROPERTY_DOCUMENTS_COLLECTION, property)),
		getDocs(
			buildPropertyScopedQuery(
				PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION,
				property,
			),
		),
	]);

	return {
		documents: mergePropertyDocuments(
			property.documents || [],
			documentSnapshot.docs.map((record) => ({
				id: record.id,
				...(record.data() as Omit<PropertyDocument, 'id'>),
			})),
			property,
		),
		knowledgeSuggestions: mergePropertyKnowledgeSuggestions(
			property.knowledgeSuggestions || [],
			suggestionSnapshot.docs.map((record) => ({
				id: record.id,
				...(record.data() as Omit<PropertyKnowledgeSuggestion, 'id'>),
			})),
			property,
		),
	};
};

export const subscribeToPropertyMemoryRecords = ({
	property,
	onChange,
	onError,
}: {
	property: Partial<Property>;
	onChange: (records: PropertyMemoryRecords) => void;
	onError?: (error: unknown) => void;
}): Unsubscribe => {
	if (!property.id) {
		onChange({
			documents: getEmbeddedPropertyDocuments(property),
			knowledgeSuggestions: getEmbeddedPropertyKnowledgeSuggestions(property),
		});
		return () => undefined;
	}

	let collectionDocuments: PropertyDocument[] = [];
	let collectionSuggestions: PropertyKnowledgeSuggestion[] = [];
	let hasDocumentSnapshot = false;
	let hasSuggestionSnapshot = false;

	const emit = () => {
		onChange({
			documents: mergePropertyDocuments(
				property.documents || [],
				collectionDocuments,
				property,
			),
			knowledgeSuggestions: mergePropertyKnowledgeSuggestions(
				property.knowledgeSuggestions || [],
				collectionSuggestions,
				property,
			),
		});
	};

	const documentsUnsubscribe = onSnapshot(
		buildPropertyScopedQuery(PROPERTY_DOCUMENTS_COLLECTION, property),
		(snapshot) => {
			hasDocumentSnapshot = true;
			collectionDocuments = snapshot.docs.map((record) => ({
				id: record.id,
				...(record.data() as Omit<PropertyDocument, 'id'>),
			}));
			emit();
		},
		(error) => {
			onError?.(error);
			if (!hasDocumentSnapshot) emit();
		},
	);

	const suggestionsUnsubscribe = onSnapshot(
		buildPropertyScopedQuery(PROPERTY_KNOWLEDGE_SUGGESTIONS_COLLECTION, property),
		(snapshot) => {
			hasSuggestionSnapshot = true;
			collectionSuggestions = snapshot.docs.map((record) => ({
				id: record.id,
				...(record.data() as Omit<PropertyKnowledgeSuggestion, 'id'>),
			}));
			emit();
		},
		(error) => {
			onError?.(error);
			if (!hasSuggestionSnapshot) emit();
		},
	);

	emit();

	return () => {
		documentsUnsubscribe();
		suggestionsUnsubscribe();
	};
};
