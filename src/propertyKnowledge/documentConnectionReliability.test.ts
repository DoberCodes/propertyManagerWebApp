import {
	getDocumentConnectionFailureMessage,
	getDocumentEditFailureMessage,
	saveDocumentConnections,
	type DocumentConnectionRequest,
} from './documentConnectionReliability';

const request = (
	documentId: string,
	overrides: Partial<DocumentConnectionRequest> = {},
): DocumentConnectionRequest => ({
	propertyId: 'property-1',
	documentId,
	equipmentIds: [],
	spaceIds: [],
	taskIds: [],
	supplyIds: [],
	...overrides,
});

describe('document connection reliability', () => {
	it('only calls the Function for documents with selected connections', async () => {
		const saveConnection = jest.fn().mockResolvedValue({ success: true });

		const result = await saveDocumentConnections(
			[
				request('document-empty'),
				request('document-linked', { spaceIds: ['space-1'] }),
			],
			saveConnection,
		);

		expect(saveConnection).toHaveBeenCalledTimes(1);
		expect(saveConnection).toHaveBeenCalledWith(
			expect.objectContaining({ documentId: 'document-linked' }),
		);
		expect(result).toEqual({ attemptedCount: 1, failedDocumentIds: [] });
	});

	it('reports the exact documents whose connection save failed', async () => {
		const saveConnection = jest.fn(
			(candidate: DocumentConnectionRequest) =>
				candidate.documentId === 'document-2'
					? Promise.reject(new Error('permission denied'))
					: Promise.resolve({ success: true }),
		);

		const result = await saveDocumentConnections(
			[
				request('document-1', { equipmentIds: ['equipment-1'] }),
				request('document-2', { taskIds: ['task-1'] }),
			],
			saveConnection,
		);

		expect(result).toEqual({
			attemptedCount: 2,
			failedDocumentIds: ['document-2'],
		});
	});

	it('provides retry guidance only when a connection save failed', () => {
		expect(getDocumentConnectionFailureMessage(0)).toBeNull();
		expect(getDocumentConnectionFailureMessage(1)).toContain(
			'Open the document and try saving the connections again.',
		);
		expect(getDocumentConnectionFailureMessage(2)).toContain(
			'connections for 2 documents',
		);
	});

	it('distinguishes a failed edit from a partial connection save', () => {
		expect(getDocumentEditFailureMessage(false)).toBe(
			'Could not update document. Please try again.',
		);
		expect(getDocumentEditFailureMessage(true)).toContain(
			'Document details were saved',
		);
		expect(getDocumentEditFailureMessage(true)).toContain(
			'try saving again',
		);
	});
});
