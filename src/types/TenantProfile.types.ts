/** Minimal resident relationship for property access and maintenance requests. */
export interface TenantRelationship {
	id: string;
	accountId?: string;
	propertyId: string;
	userId?: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	leaseEnd?: string;
	status?: 'invited' | 'active' | 'inactive';
	createdAt: string;
	updatedAt?: string;
}

/** @deprecated Use TenantRelationship. Retained while legacy reads are removed. */
export type TenantProfile = TenantRelationship;

export interface TenantInvitationCode {
	id: string;
	code: string;
	codeLower: string;
	status: 'active' | 'redeemed' | 'revoked';
	createdByUserId: string;
	createdByEmail?: string;
	accountId?: string;
	propertyId?: string;
	tenantEmail?: string;
	redeemedByUserId?: string;
	redeemedByEmail?: string;
	createdAt: string;
	updatedAt: string;
	redeemedAt?: string;
	revokedAt?: string;
}
