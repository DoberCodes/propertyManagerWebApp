export interface RentalHistory {
	propertyAddress: string;
	landlordName: string;
	landlordPhone: string;
	landlordEmail: string;
	moveInDate: string;
	moveOutDate: string;
	monthlyRent: number;
	reasonForLeaving: string;
}

export interface Reference {
	name: string;
	relationship: string;
	phone: string;
	email: string;
	yearsKnown: number;
}

export interface Employment {
	employerName: string;
	position: string;
	startDate: string;
	endDate?: string;
	monthlyIncome: number;
	supervisorName: string;
	supervisorPhone: string;
	isCurrent: boolean;
}

export interface Pet {
	type: string;
	breed: string;
	name: string;
	age: number;
	weight: number;
	isServiceAnimal: boolean;
}

export interface EmergencyContact {
	name: string;
	relationship: string;
	phone: string;
	email: string;
	address: string;
}

export interface TenantProfile {
	id: string;
	userId: string; // Link to User
	createdAt: string;
	updatedAt: string;

	// Personal Information
	dateOfBirth?: string;
	socialSecurityNumber?: string; // Encrypted in production
	driversLicenseNumber?: string;
	driversLicenseState?: string;

	// Current Status
	currentAddress: string;
	moveInDatePreference?: string;
	desiredLeaseLength?: string; // "6 months", "1 year", etc.

	// Financial Information
	creditScore?: number;
	monthlyIncome: number;
	additionalIncome?: number;
	additionalIncomeSource?: string;
	hasBankruptcy: boolean;
	bankruptcyDetails?: string;
	hasEviction: boolean;
	evictionDetails?: string;

	// Employment History
	employmentHistory: Employment[];

	// Rental History
	rentalHistory: RentalHistory[];

	// References
	references: Reference[];

	// Emergency Contacts
	emergencyContacts: EmergencyContact[];

	// Pets
	pets: Pet[];
	hasPets: boolean;

	// Additional Information
	smokingStatus: 'non-smoker' | 'smoker' | 'occasional';
	numberOfOccupants: number;
	vehicleInformation?: string;
	specialRequests?: string;
	reasonForMoving?: string;

	// Background Check
	backgroundCheckStatus?: 'pending' | 'approved' | 'denied' | 'not-requested';
	backgroundCheckDate?: string;
	backgroundCheckNotes?: string;

	// Documents
	documents?: {
		id: string;
		name: string;
		type: 'id' | 'paystub' | 'bank-statement' | 'reference-letter' | 'other';
		url: string;
		uploadedAt: string;
	}[];

	// Profile Visibility
	isPublic: boolean; // Whether landlords can view this profile
	profileCompleteness: number; // Percentage of fields completed
}
