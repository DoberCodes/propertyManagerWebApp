const fs = require('fs');
const path = require('path');
const {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'maintley-rules-test';
const RULES_PATH = path.join(__dirname, '..', 'firestore.rules');

const accountId = 'account-owner';
const ownerUid = 'account-owner';
const legacyOwnerUid = 'legacy-account-owner';
const maintenanceLeadUid = 'maintenance-lead-user';
const maintenanceUid = 'maintenance-user';
const inactiveLeadUid = 'inactive-maintenance-lead-user';
const outsiderUid = 'outsider-user';

const membershipId = (uid) => `${accountId}_${uid}`;

const baseTask = {
	accountId,
	propertyId: 'property-1',
	title: 'Test smoke and carbon monoxide detectors',
	status: 'Open',
	priority: 'Urgent',
	createdAt: '2026-07-01T12:00:00.000Z',
	updatedAt: '2026-07-01T12:00:00.000Z',
};

const createTask = (overrides = {}) => ({
	...baseTask,
	...overrides,
});

const createNotification = (overrides = {}) => ({
	userId: ownerUid,
	type: 'task_updated',
	title: 'Task updated',
	message: 'A task was updated.',
	status: 'unread',
	createdAt: '2026-07-01T12:00:00.000Z',
	updatedAt: '2026-07-01T12:00:00.000Z',
	...overrides,
});

const createPropertyDocument = (overrides = {}) => ({
	id: 'property-document-owned',
	accountId,
	propertyId: 'property-1',
	name: 'HVAC invoice',
	fileName: 'hvac-invoice.pdf',
	fileUrl: 'https://example.com/hvac-invoice.pdf',
	fileType: 'application/pdf',
	category: 'invoice',
	uploadedAt: '2026-07-01T12:00:00.000Z',
	updatedAt: '2026-07-01T12:00:00.000Z',
	...overrides,
});

const createPropertyKnowledgeSuggestion = (overrides = {}) => ({
	id: 'property-suggestion-owned',
	accountId,
	propertyId: 'property-1',
	sourceDocumentId: 'property-document-owned',
	status: 'pending',
	confidence: 0.9,
	createdAt: '2026-07-01T12:00:00.000Z',
	updatedAt: '2026-07-01T12:00:00.000Z',
	suggestedData: {
		documents: [],
	},
	...overrides,
});

async function seedFirestore(env) {
	await env.withSecurityRulesDisabled(async (context) => {
		const db = context.firestore();

		await db.doc(`users/${ownerUid}`).set({
			id: ownerUid,
			accountId,
			role: 'admin',
			isAccountOwner: true,
			subscription: {
				status: 'active',
				plan: 'portfolio',
			},
		});

		await db.doc(`users/${maintenanceLeadUid}`).set({
			id: maintenanceLeadUid,
			accountId,
			role: 'maintenance_lead',
			isTeamMemberAccount: true,
		});

		await db.doc(`users/${legacyOwnerUid}`).set({
			id: legacyOwnerUid,
			accountId,
			role: 'admin',
			isAccountOwner: true,
		});

		await db.doc(`users/${maintenanceUid}`).set({
			id: maintenanceUid,
			accountId,
			role: 'maintenance',
			isTeamMemberAccount: true,
		});

		await db.doc(`users/${inactiveLeadUid}`).set({
			id: inactiveLeadUid,
			accountId,
			role: 'maintenance_lead',
			isTeamMemberAccount: true,
		});

		await db.doc(`users/${outsiderUid}`).set({
			id: outsiderUid,
			accountId: outsiderUid,
			role: 'admin',
			isAccountOwner: true,
		});

		await db.doc(`accountMemberships/${membershipId(ownerUid)}`).set({
			accountId,
			userId: ownerUid,
			roles: ['account_owner', 'admin', 'member'],
			status: 'active',
		});

		await db.doc(`accountMemberships/${membershipId(legacyOwnerUid)}`).set({
			accountId,
			userId: legacyOwnerUid,
			roles: ['account_owner', 'admin', 'member'],
		});

		await db.doc(`accountMemberships/${membershipId(maintenanceLeadUid)}`).set({
			accountId,
			userId: maintenanceLeadUid,
			roles: ['maintenance_lead', 'member'],
			status: 'active',
		});

		await db.doc(`accountMemberships/${membershipId(maintenanceUid)}`).set({
			accountId,
			userId: maintenanceUid,
			roles: ['maintenance', 'member'],
			status: 'active',
		});

		await db.doc(`accountMemberships/${membershipId(inactiveLeadUid)}`).set({
			accountId,
			userId: inactiveLeadUid,
			roles: ['maintenance_lead', 'member'],
			status: 'inactive',
		});

		await db.doc('familyAccounts/account-owner').set({
			ownerId: ownerUid,
			memberIds: [maintenanceLeadUid, maintenanceUid, inactiveLeadUid],
			propertyCount: 1,
			deviceCount: 0,
		});

		await db.doc('properties/property-1').set({
			accountId,
			userId: ownerUid,
			title: 'Sand Oak Drive',
			address: '123 Sand Oak Drive, Apt A',
		});

		await db.doc('propertyDocuments/property-document-owned').set(
			createPropertyDocument(),
		);

		await db.doc('propertyDocuments/property-document-outsider').set(
			createPropertyDocument({
				id: 'property-document-outsider',
				accountId: outsiderUid,
				propertyId: 'outsider-property',
			}),
		);

		await db.doc('propertyKnowledgeSuggestions/property-suggestion-owned').set(
			createPropertyKnowledgeSuggestion(),
		);

		await db.doc('propertyKnowledgeSuggestions/property-suggestion-outsider').set(
			createPropertyKnowledgeSuggestion({
				id: 'property-suggestion-outsider',
				accountId: outsiderUid,
				propertyId: 'outsider-property',
				sourceDocumentId: 'property-document-outsider',
			}),
		);

		await db.doc('tasks/task-existing').set(
			createTask({
				id: 'task-existing',
				title: 'Existing maintenance task',
			}),
		);

		await db.doc('tasks/task-legacy-user-id').set({
			userId: accountId,
			propertyId: 'property-1',
			title: 'Legacy account-scoped task',
			status: 'Open',
			priority: 'Normal',
			createdAt: '2026-07-01T12:00:00.000Z',
			updatedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('notifications/notification-owned').set(
			createNotification({
				id: 'notification-owned',
			}),
		);

		await db.doc('notifications/notification-outsider').set(
			createNotification({
				id: 'notification-outsider',
				userId: outsiderUid,
			}),
		);

		await db.doc('maintleyEvents/event-owned').set({
			id: 'event-owned',
			accountId,
			userId: ownerUid,
			recipientIds: [ownerUid],
			type: 'suggested_details_ready',
			workflowKey: 'property-knowledge-acquisition',
			entityKey: 'document:doc-1',
			title: 'Suggested details ready',
			message: 'Maintley found suggested details in this document.',
			status: 'ready',
			priority: 'normal',
			createdAt: '2026-07-01T12:00:00.000Z',
			updatedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('maintleyEvents/event-recipient').set({
			id: 'event-recipient',
			accountId,
			userId: ownerUid,
			recipientIds: [maintenanceLeadUid],
			type: 'ticket_in_progress',
			workflowKey: 'support-ticket',
			entityKey: 'ticket:feedback-owned',
			title: 'Ticket in progress',
			message: 'Maintley is investigating this ticket.',
			status: 'in_progress',
			priority: 'high',
			createdAt: '2026-07-01T12:00:00.000Z',
			updatedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('maintleyEvents/event-outsider').set({
			id: 'event-outsider',
			accountId: outsiderUid,
			userId: outsiderUid,
			recipientIds: [outsiderUid],
			type: 'quick_scan_completed',
			workflowKey: 'maintley-intelligence',
			entityKey: 'scan:outsider-scan',
			title: 'Quick Scan complete',
			message: 'Maintley found items to review.',
			status: 'completed',
			priority: 'normal',
			createdAt: '2026-07-01T12:00:00.000Z',
			updatedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('feedback/feedback-owned').set({
			accountId,
			userId: ownerUid,
			userEmail: 'owner@example.com',
			ticketNumber: 'MNT-000001',
			type: 'bug_report',
			status: 'in_progress',
			subject: 'Owned support request',
			message: 'Support request body',
			createdAt: '2026-07-01T12:00:00.000Z',
			updatedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('admin_users/admin-record').set({
			email: 'admin@example.com',
			role: 'support',
			status: 'active',
		});

		await db.doc('admin_sessions/session-record').set({
			adminUserId: 'admin-record',
			createdAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('admin_audit_logs/audit-record').set({
			action: 'ticket_status_changed',
			adminUserId: 'admin-record',
			createdAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('tenantProfiles/legacy-resident').set({
			accountId,
			propertyId: 'property-1',
			userId: 'legacy-resident',
			firstName: 'Legacy',
			lastName: 'Resident',
			email: 'legacy-resident@example.com',
			creditScore: 700,
		});

		await db.doc('maintenanceEvents/server-created-event').set({
			accountId,
			propertyId: 'property-1',
			title: 'Server-created event',
			eventType: 'maintenance_recorded',
			eventSource: 'manual_entry',
			recordedBy: { userId: ownerUid },
			recordedAt: '2026-07-01T12:00:00.000Z',
		});

		await db.doc('maintenanceEventRevisions/revision-existing').set({
			accountId,
			propertyId: 'property-1',
			eventId: 'server-created-event',
			action: 'created',
			actor: { userId: ownerUid },
			changedFields: ['title'],
			createdAt: '2026-07-01T12:00:00.000Z',
		});
	});
}

function authedDb(env, uid, email = `${uid}@example.com`) {
	return env.authenticatedContext(uid, { email }).firestore();
}

async function run() {
	const rules = fs.readFileSync(RULES_PATH, 'utf8');
	const env = await initializeTestEnvironment({
		projectId: PROJECT_ID,
		firestore: {
			rules,
		},
	});

	try {
		await seedFirestore(env);

		const ownerDb = authedDb(env, ownerUid);
		const legacyOwnerDb = authedDb(env, legacyOwnerUid);
		const maintenanceLeadDb = authedDb(env, maintenanceLeadUid);
		const maintenanceDb = authedDb(env, maintenanceUid);
		const inactiveLeadDb = authedDb(env, inactiveLeadUid);
		const outsiderDb = authedDb(env, outsiderUid);

		await assertSucceeds(
			maintenanceLeadDb.doc('tasks/task-existing').get(),
		);
		await assertFails(outsiderDb.doc('tasks/task-existing').get());

		await assertSucceeds(
			maintenanceLeadDb.doc('tasks/task-created-by-lead').set(
				createTask({
					id: 'task-created-by-lead',
					title: 'Created by maintenance lead',
				}),
			),
		);

		await assertSucceeds(
			maintenanceDb.doc('tasks/task-created-by-maintenance').set(
				createTask({
					id: 'task-created-by-maintenance',
					title: 'Created by maintenance role',
				}),
			),
		);

		await assertFails(
			inactiveLeadDb.doc('tasks/task-created-by-inactive-lead').set(
				createTask({
					id: 'task-created-by-inactive-lead',
					title: 'Created by inactive maintenance lead',
				}),
			),
		);

		await assertFails(
			outsiderDb.doc('tasks/task-created-by-outsider').set(
				createTask({
					id: 'task-created-by-outsider',
					title: 'Created by outsider',
				}),
			),
		);

		await assertSucceeds(
			maintenanceLeadDb.doc('tasks/task-existing').update({
				status: 'In Progress',
				updatedAt: '2026-07-01T13:00:00.000Z',
			}),
		);

		await assertSucceeds(
			maintenanceLeadDb.doc('tasks/task-legacy-user-id').update({
				accountId,
				status: 'In Progress',
				updatedAt: '2026-07-01T13:00:00.000Z',
			}),
		);

		await assertFails(
			maintenanceLeadDb.doc('tasks/task-existing').delete(),
		);
		await assertSucceeds(ownerDb.doc('tasks/task-existing').delete());

		await assertSucceeds(
			ownerDb.doc(`accountMemberships/${membershipId(maintenanceUid)}`).get(),
		);
		await assertSucceeds(
			maintenanceDb.doc(`accountMemberships/${membershipId(maintenanceUid)}`).get(),
		);
		await assertFails(
			outsiderDb.doc(`accountMemberships/${membershipId(maintenanceUid)}`).get(),
		);
		await assertFails(
			ownerDb.doc(`accountMemberships/${accountId}_new-member`).set({
				accountId,
				userId: 'new-member',
				roles: ['member'],
				status: 'active',
			}),
		);
		await assertFails(
			ownerDb.doc(`accountMemberships/${membershipId(maintenanceUid)}`).update({
				status: 'inactive',
			}),
		);
		await assertFails(
			ownerDb.doc(`accountMemberships/${membershipId(maintenanceUid)}`).delete(),
		);

		await assertSucceeds(ownerDb.doc('tenantProfiles/legacy-resident').get());
		await assertFails(outsiderDb.doc('tenantProfiles/legacy-resident').get());
		await assertFails(
			ownerDb.doc('tenantProfiles/new-resident-profile').set({
				accountId,
				propertyId: 'property-1',
				firstName: 'New',
				lastName: 'Resident',
				email: 'new-resident@example.com',
			}),
		);
		await assertFails(
			ownerDb.doc('tenantProfiles/legacy-resident').update({
				creditScore: 750,
			}),
		);
		await assertFails(
			ownerDb.doc('maintenanceEvents/client-created-event').set({
				accountId,
				propertyId: 'property-1',
				title: 'Client-created event',
				eventType: 'maintenance_recorded',
				eventSource: 'manual_entry',
			}),
		);
		await assertSucceeds(
			ownerDb.doc('maintenanceEventRevisions/revision-existing').get(),
		);
		await assertFails(
			outsiderDb.doc('maintenanceEventRevisions/revision-existing').get(),
		);
		await assertFails(
			ownerDb.doc('maintenanceEvents/server-created-event').update({ title: 'Forged correction' }),
		);
		await assertFails(ownerDb.doc('maintenanceEvents/server-created-event').delete());
		await assertFails(
			ownerDb.doc('maintenanceEventRevisions/client-revision').set({
				accountId,
				eventId: 'server-created-event',
				action: 'corrected',
			}),
		);
		await assertFails(
			ownerDb.doc('maintenanceEventRevisions/revision-existing').update({ action: 'deleted' }),
		);
		await assertFails(
			ownerDb.doc('maintenanceEventRevisions/revision-existing').delete(),
		);

		await assertFails(ownerDb.doc('admin_users/admin-record').get());
		await assertFails(ownerDb.doc('admin_sessions/session-record').get());
		await assertFails(ownerDb.doc('admin_audit_logs/audit-record').get());
		await assertFails(
			ownerDb.doc('admin_users/admin-record').update({
				status: 'inactive',
			}),
		);
		await assertFails(
			ownerDb.doc('admin_sessions/session-record').delete(),
		);
		await assertFails(
			ownerDb.doc('admin_audit_logs/audit-created-by-client').set({
				action: 'client_write_attempt',
				createdAt: '2026-07-01T12:00:00.000Z',
			}),
		);

		await assertFails(ownerDb.doc('feedback/feedback-owned').get());
		await assertFails(outsiderDb.doc('feedback/feedback-owned').get());
		await assertFails(
			ownerDb.doc('feedback/feedback-created-by-client').set({
				accountId,
				userId: ownerUid,
				type: 'bug_report',
				status: 'new',
				subject: 'Client-created support request',
			}),
		);
		await assertFails(
			ownerDb.doc('feedback/feedback-owned').update({
				status: 'closed',
			}),
		);
		await assertFails(ownerDb.doc('feedback/feedback-owned').delete());

		await assertSucceeds(ownerDb.doc('propertyDocuments/property-document-owned').get());
		await assertSucceeds(
			ownerDb
				.collection('propertyDocuments')
				.where('propertyId', '==', 'property-1')
				.where('accountId', '==', accountId)
				.get(),
		);
		await assertSucceeds(
			maintenanceLeadDb.doc('propertyDocuments/property-document-owned').get(),
		);
		await assertFails(
			outsiderDb.doc('propertyDocuments/property-document-owned').get(),
		);
		await assertFails(
			ownerDb.doc('propertyDocuments/property-document-outsider').get(),
		);
		await assertSucceeds(
			ownerDb.doc('propertyDocuments/property-document-created').set(
				createPropertyDocument({
					id: 'property-document-created',
					name: 'Water heater warranty',
				}),
			),
		);
		await assertSucceeds(
			legacyOwnerDb.doc('propertyDocuments/property-document-legacy-created').set(
				createPropertyDocument({
					id: 'property-document-legacy-created',
					name: 'Legacy owner upload',
				}),
			),
		);
		await assertFails(
			maintenanceLeadDb.doc('propertyDocuments/property-document-lead-created').set(
				createPropertyDocument({
					id: 'property-document-lead-created',
					name: 'Lead upload attempt',
				}),
			),
		);
		await assertFails(
			outsiderDb.doc('propertyDocuments/property-document-outsider-created').set(
				createPropertyDocument({
					id: 'property-document-outsider-created',
					name: 'Outsider upload attempt',
				}),
			),
		);
		await assertSucceeds(
			ownerDb.doc('propertyDocuments/property-document-owned').update({
				acquisitionStatus: 'reviewed',
				updatedAt: '2026-07-01T13:00:00.000Z',
			}),
		);
		await assertFails(
			ownerDb.doc('propertyDocuments/property-document-owned').update({
				accountId: outsiderUid,
				updatedAt: '2026-07-01T13:30:00.000Z',
			}),
		);
		await assertFails(
			maintenanceLeadDb.doc('propertyDocuments/property-document-owned').delete(),
		);
		await assertSucceeds(
			ownerDb.doc('propertyDocuments/property-document-created').delete(),
		);

		await assertSucceeds(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.get(),
		);
		await assertSucceeds(
			ownerDb
				.collection('propertyKnowledgeSuggestions')
				.where('propertyId', '==', 'property-1')
				.where('accountId', '==', accountId)
				.get(),
		);
		await assertSucceeds(
			maintenanceLeadDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.get(),
		);
		await assertFails(
			outsiderDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.get(),
		);
		await assertFails(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-outsider')
				.get(),
		);
		await assertSucceeds(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-created')
				.set(
					createPropertyKnowledgeSuggestion({
						id: 'property-suggestion-created',
						sourceDocumentId: 'property-document-owned',
					}),
				),
		);
		await assertFails(
			maintenanceLeadDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-lead-created')
				.set(
					createPropertyKnowledgeSuggestion({
						id: 'property-suggestion-lead-created',
						sourceDocumentId: 'property-document-owned',
					}),
				),
		);
		await assertSucceeds(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.update({
					status: 'accepted',
					updatedAt: '2026-07-01T13:00:00.000Z',
				}),
		);
		await assertFails(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.update({
					accountId: outsiderUid,
					updatedAt: '2026-07-01T13:30:00.000Z',
				}),
		);
		await assertFails(
			maintenanceLeadDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-owned')
				.delete(),
		);
		await assertSucceeds(
			ownerDb
				.doc('propertyKnowledgeSuggestions/property-suggestion-created')
				.delete(),
		);

		await assertSucceeds(ownerDb.doc('notifications/notification-owned').get());
		await assertFails(outsiderDb.doc('notifications/notification-owned').get());
		await assertFails(ownerDb.doc('notifications/notification-outsider').get());
		await assertSucceeds(
			ownerDb.doc('notifications/notification-created-by-owner').set(
				createNotification({
					id: 'notification-created-by-owner',
					title: 'Owner notification',
				}),
			),
		);
		await assertFails(
			ownerDb.doc('notifications/notification-spoofed-create').set(
				createNotification({
					id: 'notification-spoofed-create',
					userId: outsiderUid,
					title: 'Spoofed notification',
				}),
			),
		);
		await assertSucceeds(
			ownerDb.doc('notifications/notification-owned').update({
				status: 'read',
				updatedAt: '2026-07-01T13:00:00.000Z',
			}),
		);
		await assertFails(
			ownerDb.doc('notifications/notification-owned').update({
				userId: outsiderUid,
				updatedAt: '2026-07-01T13:30:00.000Z',
			}),
		);
		await assertFails(
			outsiderDb.doc('notifications/notification-owned').update({
				status: 'read',
				updatedAt: '2026-07-01T14:00:00.000Z',
			}),
		);
		await assertSucceeds(
			ownerDb.doc('notifications/notification-owned').delete(),
		);
		await assertFails(
			outsiderDb.doc('notifications/notification-created-by-owner').delete(),
		);

		await assertSucceeds(ownerDb.doc('maintleyEvents/event-owned').get());
		await assertSucceeds(
			maintenanceLeadDb.doc('maintleyEvents/event-recipient').get(),
		);
		await assertFails(outsiderDb.doc('maintleyEvents/event-owned').get());
		await assertFails(ownerDb.doc('maintleyEvents/event-outsider').get());
		await assertFails(
			ownerDb.doc('maintleyEvents/event-created-by-client').set({
				accountId,
				userId: ownerUid,
				recipientIds: [ownerUid],
				type: 'quick_scan_completed',
				workflowKey: 'maintley-intelligence',
				entityKey: 'scan:client-created',
				title: 'Quick Scan complete',
				message: 'Client write attempt.',
				status: 'completed',
				createdAt: '2026-07-01T12:00:00.000Z',
				updatedAt: '2026-07-01T12:00:00.000Z',
			}),
		);
		await assertFails(
			ownerDb.doc('maintleyEvents/event-owned').update({
				status: 'completed',
				updatedAt: '2026-07-01T15:00:00.000Z',
			}),
		);
		await assertFails(ownerDb.doc('maintleyEvents/event-owned').delete());

		console.log('Firestore rules permission boundary tests passed.');
	} finally {
		await env.cleanup();
	}
}

run().catch((error) => {
	console.error('Firestore rules permission boundary tests failed.');
	console.error(error);
	process.exit(1);
});
