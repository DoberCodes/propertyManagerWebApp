import { auth } from '../../config/firebase';
import {
	filterRecordsByAccessProperties,
	getTeamMemberForAccountUser,
	resolveAccessibleAccountIds,
	resolveAccountAccessContext,
	resolveTargetUserId,
} from './accountContext';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';

jest.mock('../../config/firebase', () => ({
	auth: {
		currentUser: null,
	},
	db: {},
}));

jest.mock('firebase/firestore', () => ({
	collection: jest.fn((_db, name) => ({ name })),
	doc: jest.fn((_db, collectionName, id) => ({ collectionName, id })),
	getDoc: jest.fn(),
	getDocs: jest.fn(),
	limit: jest.fn((count) => ({ type: 'limit', count })),
	query: jest.fn((...parts) => ({ parts })),
	updateDoc: jest.fn(),
	where: jest.fn((field, operator, value) => ({ field, operator, value })),
}));

const mockAuth = auth as unknown as {
	currentUser: { uid: string; email?: string | null } | null;
};
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockLimit = limit as jest.Mock;
const mockQuery = query as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockWhere = where as jest.Mock;

const userSnapshot = (data: Record<string, unknown>, exists = true) => ({
	exists: () => exists,
	data: () => data,
});

const querySnapshot = (docs: Array<Record<string, unknown>>) => ({
	empty: docs.length === 0,
	docs: docs.map((data, index) => ({
		id: `doc-${index}`,
		data: () => data,
	})),
});

describe('accountContext', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCollection.mockImplementation((_db, name) => ({ name }));
		mockDoc.mockImplementation((_db, collectionName, id) => ({
			collectionName,
			id,
		}));
		mockLimit.mockImplementation((count) => ({ type: 'limit', count }));
		mockQuery.mockImplementation((...parts) => ({ parts }));
		mockWhere.mockImplementation((field, operator, value) => ({
			field,
			operator,
			value,
		}));
		mockAuth.currentUser = { uid: 'user-1', email: 'user@example.com' };
	});

	describe('resolveTargetUserId', () => {
		it('throws when there is no authenticated user', async () => {
			mockAuth.currentUser = null;

			await expect(resolveTargetUserId()).rejects.toThrow(
				'User not authenticated',
			);
		});

		it('uses the account id for account owners', async () => {
			mockGetDoc.mockResolvedValue(
				userSnapshot({
					accountId: 'owner-account',
					isAccountOwner: true,
				}),
			);

			await expect(resolveTargetUserId()).resolves.toBe('owner-account');
		});

		it('uses a non-team member account id directly', async () => {
			mockGetDoc.mockResolvedValue(
				userSnapshot({
					accountId: 'family-owner-account',
					isAccountOwner: false,
					isTeamMemberAccount: false,
				}),
			);

			await expect(resolveTargetUserId()).resolves.toBe('family-owner-account');
			expect(mockGetDocs).not.toHaveBeenCalled();
		});

		it('resolves team member access from an active invitation and backfills the user profile', async () => {
			mockGetDoc.mockResolvedValue(
				userSnapshot({
					email: 'lead@example.com',
					isAccountOwner: false,
					isTeamMemberAccount: true,
					subscription: { promoCode: 'TEAM-1234' },
				}),
			);
			mockGetDocs.mockResolvedValue(
				querySnapshot([
					{
						status: 'active',
						accountId: 'portfolio-account',
						teamMemberId: 'team-member-1',
					},
				]),
			);

			await expect(resolveTargetUserId()).resolves.toBe('portfolio-account');
			expect(mockWhere).toHaveBeenCalledWith(
				'teamMemberEmail',
				'==',
				'lead@example.com',
			);
			expect(mockWhere).toHaveBeenCalledWith(
				'codeLower',
				'==',
				'team-1234',
			);
			expect(mockUpdateDoc).toHaveBeenCalledWith(
				expect.objectContaining({ collectionName: 'users', id: 'user-1' }),
				expect.objectContaining({
					accountId: 'portfolio-account',
					isAccountOwner: false,
					isTeamMemberAccount: true,
					teamMemberId: 'team-member-1',
					updatedAt: expect.any(String),
				}),
			);
		});

		it('falls back to family account ownership when no account id or team invite is available', async () => {
			mockGetDoc.mockResolvedValue(userSnapshot({ email: 'family@example.com' }));
			mockGetDocs
				.mockResolvedValueOnce(querySnapshot([]))
				.mockResolvedValueOnce(querySnapshot([{ ownerId: 'family-owner' }]));

			await expect(resolveTargetUserId()).resolves.toBe('family-owner');
			expect(mockUpdateDoc).toHaveBeenCalledWith(
				expect.objectContaining({ collectionName: 'users', id: 'user-1' }),
				expect.objectContaining({
					accountId: 'family-owner',
					isAccountOwner: false,
					updatedAt: expect.any(String),
				}),
			);
		});
	});

	describe('resolveAccessibleAccountIds', () => {
		it('combines active account memberships with the resolved primary account', async () => {
			mockGetDocs.mockResolvedValueOnce(
				querySnapshot([
					{ accountId: 'portfolio-account', status: 'active' },
					{ accountId: 'disabled-account', status: 'disabled' },
					{ accountId: 'shared-account', status: 'active' },
				]),
			);
			mockGetDoc.mockResolvedValue(
				userSnapshot({
					accountId: 'portfolio-account',
					isAccountOwner: false,
				}),
			);

			await expect(resolveAccessibleAccountIds()).resolves.toEqual([
				'portfolio-account',
				'shared-account',
			]);
		});

		it('falls back to the authenticated user id when no memberships or profile account are found', async () => {
			mockGetDocs
				.mockResolvedValueOnce(querySnapshot([]))
				.mockResolvedValueOnce(querySnapshot([]))
				.mockResolvedValueOnce(querySnapshot([]));
			mockGetDoc.mockResolvedValue(userSnapshot({}));

			await expect(resolveAccessibleAccountIds()).resolves.toEqual(['user-1']);
		});
	});

	describe('getTeamMemberForAccountUser', () => {
		it('resolves a linked team member by profile teamMemberId', async () => {
			mockGetDoc.mockResolvedValue(
				userSnapshot({
					accountId: 'portfolio-account',
					email: 'lead@example.com',
					role: 'maintenance_lead',
					linkedProperties: ['property-1'],
				}),
			);

			await expect(
				getTeamMemberForAccountUser(
					['portfolio-account'],
					{ teamMemberId: 'team-member-1' },
					'user-1',
					'lead@example.com',
				),
			).resolves.toMatchObject({
				accountId: 'portfolio-account',
				role: 'maintenance_lead',
				linkedProperties: ['property-1'],
			});
		});
	});

	describe('resolveAccountAccessContext', () => {
		it('keeps account owners unscoped with full management capabilities', async () => {
			mockGetDoc.mockImplementation((_ref: any) =>
				Promise.resolve(
					_ref.collectionName === 'users'
						? userSnapshot({
								accountId: 'owner-account',
								isAccountOwner: true,
						  })
						: userSnapshot({}, false),
				),
			);
			mockGetDocs.mockResolvedValue(querySnapshot([]));

			await expect(resolveAccountAccessContext()).resolves.toMatchObject({
				accountIds: ['owner-account'],
				activeAccountId: 'owner-account',
				isScopedTeamMember: false,
				allowedPropertyIds: [],
				canManageTasks: true,
				canManageProperties: true,
				canManageDocuments: true,
				canManageMaintenance: true,
				canManageTeam: true,
			});
		});

		it('keeps ordinary family account members unscoped without inventing management capabilities', async () => {
			mockGetDoc.mockImplementation((_ref: any) =>
				Promise.resolve(
					_ref.collectionName === 'users'
						? userSnapshot({
								accountId: 'family-account',
								isAccountOwner: false,
								isTeamMemberAccount: false,
						  })
						: userSnapshot({}, false),
				),
			);
			mockGetDocs.mockResolvedValue(querySnapshot([]));

			await expect(resolveAccountAccessContext()).resolves.toMatchObject({
				accountIds: ['family-account'],
				isScopedTeamMember: false,
				allowedPropertyIds: [],
				canManageTasks: false,
				canManageProperties: false,
				canManageDocuments: false,
				canManageMaintenance: false,
				canManageTeam: false,
			});
		});

		it('normalizes scoped team member property access and capabilities', async () => {
			mockGetDoc.mockImplementation((_ref: any) => {
				if (_ref.collectionName === 'users') {
					return Promise.resolve(
						userSnapshot({
							accountId: 'portfolio-account',
							email: 'lead@example.com',
							isTeamMemberAccount: true,
							role: 'maintenance_lead',
							teamMemberId: 'team-member-1',
						}),
					);
				}

				if (_ref.collectionName === 'teamMembers') {
					return Promise.resolve(
						userSnapshot({
							accountId: 'portfolio-account',
							email: 'lead@example.com',
							role: 'maintenance_lead',
							linkedProperties: ['property-1', 'property-2'],
						}),
					);
				}

				return Promise.resolve(userSnapshot({}));
			});
			mockGetDocs
				.mockResolvedValueOnce(
					querySnapshot([{ accountId: 'portfolio-account', status: 'active' }]),
				)
				.mockResolvedValueOnce(querySnapshot([]));

			await expect(resolveAccountAccessContext()).resolves.toMatchObject({
				userId: 'user-1',
				accountIds: ['portfolio-account'],
				activeAccountId: 'portfolio-account',
				userRole: 'maintenance_lead',
				isScopedTeamMember: true,
				allowedPropertyIds: ['property-1', 'property-2'],
				canManageTasks: true,
				canManageMaintenance: true,
				canManageProperties: false,
			});
		});
	});

	describe('filterRecordsByAccessProperties', () => {
		it('filters records to scoped team member property ids', () => {
			const records = [
				{ id: 'task-1', propertyId: 'property-1' },
				{ id: 'task-2', propertyId: 'property-2' },
			];

			expect(
				filterRecordsByAccessProperties(
					records,
					{
						isScopedTeamMember: true,
						allowedPropertyIds: ['property-2'],
					},
					(record) => record.propertyId,
				),
			).toEqual([{ id: 'task-2', propertyId: 'property-2' }]);
		});

		it('leaves records unchanged for unscoped users', () => {
			const records = [{ id: 'task-1', propertyId: 'property-1' }];

			expect(
				filterRecordsByAccessProperties(
					records,
					{
						isScopedTeamMember: false,
						allowedPropertyIds: [],
					},
					(record) => record.propertyId,
				),
			).toBe(records);
		});

		it('returns no records when a scoped team member has no assignments', () => {
			const records = [{ id: 'task-1', propertyId: 'property-1' }];

			expect(
				filterRecordsByAccessProperties(
					records,
					{
						isScopedTeamMember: true,
						allowedPropertyIds: [],
					},
					(record) => record.propertyId,
				),
			).toEqual([]);
		});
	});

	it('reads the user profile from the authenticated user document', async () => {
		mockGetDoc.mockResolvedValue(
			userSnapshot({
				accountId: 'owner-account',
				isAccountOwner: true,
			}),
		);

		await resolveTargetUserId();

		expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1');
	});
});
