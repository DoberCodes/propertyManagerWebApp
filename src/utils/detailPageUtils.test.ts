import {
	getDeviceName,
	getFieldValue,
	createMaintenanceRequest,
} from './detailPageUtils';

describe('detailPageUtils', () => {
	describe('getDeviceName', () => {
		const mockEntity = {
			devices: [
				{ id: '1', type: 'HVAC', brand: 'Carrier' },
				{ id: '2', type: 'Water Heater', brand: 'Rheem' },
				{ id: 3, type: 'Furnace', brand: 'Trane' },
			],
		};

		it('should return device name for valid string ID', () => {
			const result = getDeviceName('1', mockEntity);
			expect(result).toBe('HVAC - Carrier');
		});

		it('should return device name for valid number ID', () => {
			const result = getDeviceName(3, mockEntity);
			expect(result).toBe('Furnace - Trane');
		});

		it('should return "-" for non-existent device ID', () => {
			const result = getDeviceName('999', mockEntity);
			expect(result).toBe('-');
		});

		it('should return "-" for undefined deviceId', () => {
			const result = getDeviceName(undefined, mockEntity);
			expect(result).toBe('-');
		});

		it('should return "-" for null entity', () => {
			const result = getDeviceName('1', null);
			expect(result).toBe('-');
		});

		it('should return "-" for entity without devices', () => {
			const result = getDeviceName('1', {});
			expect(result).toBe('-');
		});

		it('should return "-" when both deviceId and entity are invalid', () => {
			const result = getDeviceName(undefined, null);
			expect(result).toBe('-');
		});
	});

	describe('getFieldValue', () => {
		const mockEntity = {
			name: 'Original Name',
			address: '123 Main St',
			city: 'New York',
		};

		const mockEditedEntity = {
			name: 'Edited Name',
			address: '456 Oak Ave',
		};

		it('should return edited value when in edit mode and field exists', () => {
			const result = getFieldValue('name', mockEntity, mockEditedEntity, true);
			expect(result).toBe('Edited Name');
		});

		it('should return original value when in edit mode but field not in edited', () => {
			const result = getFieldValue('city', mockEntity, mockEditedEntity, true);
			expect(result).toBe('New York');
		});

		it('should return original value when not in edit mode', () => {
			const result = getFieldValue('name', mockEntity, mockEditedEntity, false);
			expect(result).toBe('Original Name');
		});

		it('should return empty string for non-existent field', () => {
			const result = getFieldValue(
				'nonexistent',
				mockEntity,
				mockEditedEntity,
				false,
			);
			expect(result).toBe('');
		});

		it('should return empty string for undefined entity', () => {
			const result = getFieldValue('name', undefined, mockEditedEntity, false);
			expect(result).toBe('');
		});

		it('should handle empty edited entity in edit mode', () => {
			const result = getFieldValue('name', mockEntity, {}, true);
			expect(result).toBe('Original Name');
		});
	});

	describe('createMaintenanceRequest', () => {
		const mockRequest = {
			title: 'Leaky Faucet',
			description: 'Kitchen faucet is dripping',
			priority: 'High',
			category: 'Plumbing',
		};

		const mockProperty = {
			id: 'prop-123',
			title: 'Main Street Property',
			slug: 'main-street-property',
		};

		const mockUser = {
			id: 'user-456',
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
		};

		it('should create maintenance request without entity type', () => {
			const result = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
			);

			expect(result).toMatchObject({
				title: 'Leaky Faucet',
				description: 'Kitchen faucet is dripping',
				priority: 'High',
				category: 'Plumbing',
				propertyId: 'prop-123',
				propertyTitle: 'Main Street Property',
				status: 'Pending',
				requestedBy: 'user-456',
				submittedByName: 'John Doe',
				requestedByEmail: 'john@example.com',
				submittedBy: 'user-456',
			});
			expect(result.id).toMatch(/^req-\d+$/);
			expect(result.requestedDate).toBeDefined();
			expect(result.submittedAt).toBeDefined();
		});

		it('should create maintenance request with unit entity type', () => {
			const result = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
				'unit',
				'Unit 101',
			);

			expect(result.unit).toBe('Unit 101');
		});

		it('should create maintenance request with suite entity type', () => {
			const result = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
				'suite',
				'Suite A',
			);

			expect(result.suite).toBe('Suite A');
		});

		it('should generate unique IDs', async () => {
			const req1 = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
			);
			// Wait 1ms to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 1));
			const req2 = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
			);

			expect(req1.id).not.toBe(req2.id);
		});

		it('should have timestamp fields', () => {
			const result = createMaintenanceRequest(
				mockRequest,
				mockProperty as any,
				mockUser,
			);

			expect(result.requestedDate).toBeDefined();
			expect(typeof result.requestedDate).toBe('string');
			expect(result.submittedAt).toBeDefined();
			expect(typeof result.submittedAt).toBe('string');
		});
	});
});
