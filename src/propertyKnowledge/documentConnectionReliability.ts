export type DocumentConnectionRequest = {
	propertyId: string;
	documentId: string;
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
	supplyIds: string[];
};

type SaveDocumentConnection = (
	request: DocumentConnectionRequest,
) => Promise<unknown>;

export type DocumentConnectionSaveResult = {
	attemptedCount: number;
	failedDocumentIds: string[];
};

export const saveDocumentConnections = async (
	requests: DocumentConnectionRequest[],
	saveConnection: SaveDocumentConnection,
): Promise<DocumentConnectionSaveResult> => {
	const actionableRequests = requests.filter(
		(request) =>
			request.equipmentIds.length > 0 ||
			request.spaceIds.length > 0 ||
			request.taskIds.length > 0 ||
			request.supplyIds.length > 0,
	);
	const results = await Promise.allSettled(
		actionableRequests.map((request) => saveConnection(request)),
	);

	return {
		attemptedCount: actionableRequests.length,
		failedDocumentIds: results.flatMap((result, index) =>
			result.status === 'rejected'
				? [actionableRequests[index].documentId]
				: [],
		),
	};
};

export const getDocumentConnectionFailureMessage = (
	failedDocumentCount: number,
): string | null => {
	if (failedDocumentCount <= 0) return null;
	return `${failedDocumentCount === 1 ? 'The document was' : 'The documents were'} uploaded, but Maintley could not save ${failedDocumentCount === 1 ? 'its connections' : `connections for ${failedDocumentCount} documents`}. Open ${failedDocumentCount === 1 ? 'the document' : 'each document'} and try saving the connections again.`;
};

export const getDocumentEditFailureMessage = (
	documentDetailsSaved: boolean,
): string =>
	documentDetailsSaved
		? 'Document details were saved, but Maintley could not update its connections. Review the selections and try saving again.'
		: 'Could not update document. Please try again.';
