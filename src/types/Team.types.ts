/**
 * Team-related types for the application
 * Centralized domain-specific type definitions
 */

export interface TeamMember {
	id: string;
	groupId?: string;
	userId: string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{
		name: string;
		url?: string;
		size?: number;
		type?: string;
		id?: string;
	}>;
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamGroup {
	id: string;
	userId: string;
	name: string;
	isEditingName?: boolean;
	linkedProperties: string[];
	members?: TeamMember[];
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamMemberInvitationCode {
	id: string;
	code: string;
	codeLower: string;
	status: 'active' | 'redeemed' | 'revoked';
	createdByUserId: string;
	createdByEmail?: string;
	teamMemberEmail?: string;
	teamMemberId?: string; // ID of the associated team member
	redeemedByUserId?: string;
	redeemedByEmail?: string;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string; // Expiration date for the invitation code (only for unclaimed codes)
	redeemedAt?: string;
	revokedAt?: string;
}
