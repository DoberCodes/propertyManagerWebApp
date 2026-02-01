import maintenanceRequestsReducer, {
	addMaintenanceRequest,
	updateMaintenanceRequest,
	deleteMaintenanceRequest,
	convertRequestToTask,
	setMaintenanceRequests,
} from './maintenanceRequestsSlice';
import { MaintenanceRequestItem } from '../../types/MaintenanceRequest.types';

describe('maintenanceRequestsSlice', () => {
	const initialState = {
		requests: [],
	};

	const mockRequest: MaintenanceRequestItem = {
		id: 'req-1',
		title: 'Leaky Faucet',
		description: 'Kitchen faucet is dripping',
		priority: 'High',
		category: 'Plumbing',
		status: 'pending',
		propertyId: 'prop-1',
		propertyTitle: 'Main Street Property',
		requestedBy: 'user-1',
		requestedByName: 'John Doe',
		createdAt: '2026-01-15T10:00:00Z',
	};

	describe('reducers', () => {
		it('should return initial state', () => {
			expect(
				maintenanceRequestsReducer(undefined, { type: 'unknown' }),
			).toEqual(initialState);
		});

		describe('addMaintenanceRequest', () => {
			it('should add a new maintenance request', () => {
				const actual = maintenanceRequestsReducer(
					initialState,
					addMaintenanceRequest(mockRequest),
				);

				expect(actual.requests).toHaveLength(1);
				expect(actual.requests[0]).toEqual(mockRequest);
			});

			it('should add request to existing requests', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const newRequest = {
					...mockRequest,
					id: 'req-2',
					title: 'Broken Window',
				};
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					addMaintenanceRequest(newRequest),
				);

				expect(actual.requests).toHaveLength(2);
				expect(actual.requests[1].id).toBe('req-2');
			});

			it('should preserve order of requests', () => {
				let state = initialState;

				state = maintenanceRequestsReducer(
					state,
					addMaintenanceRequest({ ...mockRequest, id: 'req-1' }),
				);
				state = maintenanceRequestsReducer(
					state,
					addMaintenanceRequest({ ...mockRequest, id: 'req-2' }),
				);
				state = maintenanceRequestsReducer(
					state,
					addMaintenanceRequest({ ...mockRequest, id: 'req-3' }),
				);

				expect(state.requests.map((r) => r.id)).toEqual([
					'req-1',
					'req-2',
					'req-3',
				]);
			});
		});

		describe('updateMaintenanceRequest', () => {
			it('should update existing maintenance request', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const updatedRequest = {
					...mockRequest,
					title: 'Updated Title',
					priority: 'Low',
				};
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					updateMaintenanceRequest(updatedRequest as any),
				);

				expect(actual.requests[0].title).toBe('Updated Title');
				expect(actual.requests[0].priority).toBe('Low');
			});

			it('should not modify other requests', () => {
				const request2 = {
					...mockRequest,
					id: 'req-2',
					title: 'Other Request',
				};
				const stateWithRequests = { requests: [mockRequest, request2] };
				const updatedRequest = { ...mockRequest, title: 'Updated Title' };
				const actual = maintenanceRequestsReducer(
					stateWithRequests,
					updateMaintenanceRequest(updatedRequest),
				);

				expect(actual.requests[0].title).toBe('Updated Title');
				expect(actual.requests[1].title).toBe('Other Request');
			});

			it('should not add request if id does not exist', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const nonExistentRequest = { ...mockRequest, id: 'req-999' };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					updateMaintenanceRequest(nonExistentRequest),
				);

				expect(actual.requests).toHaveLength(1);
				expect(actual.requests[0].id).toBe('req-1');
			});

			it('should handle updating status', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const updatedRequest = { ...mockRequest, status: 'in-progress' };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					updateMaintenanceRequest(updatedRequest as any),
				);

				expect(actual.requests[0].status).toBe('in-progress');
			});
		});

		describe('deleteMaintenanceRequest', () => {
			it('should delete maintenance request by id', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					deleteMaintenanceRequest('req-1'),
				);

				expect(actual.requests).toHaveLength(0);
			});

			it('should delete correct request from multiple requests', () => {
				const request2 = { ...mockRequest, id: 'req-2' };
				const request3 = { ...mockRequest, id: 'req-3' };
				const stateWithRequests = {
					requests: [mockRequest, request2, request3],
				};
				const actual = maintenanceRequestsReducer(
					stateWithRequests,
					deleteMaintenanceRequest('req-2'),
				);

				expect(actual.requests).toHaveLength(2);
				expect(actual.requests.map((r) => r.id)).toEqual(['req-1', 'req-3']);
			});

			it('should not affect state if request not found', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					deleteMaintenanceRequest('req-999'),
				);

				expect(actual.requests).toHaveLength(1);
			});
		});

		describe('convertRequestToTask', () => {
			it('should mark request as completed when converted', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					convertRequestToTask('req-1'),
				);

				expect(actual.requests[0].status).toBe('Completed');
			});

			it('should not affect other requests', () => {
				const request2 = {
					...mockRequest,
					id: 'req-2',
					status: 'pending',
				};
				const stateWithRequests = { requests: [mockRequest, request2] };
				const actual = maintenanceRequestsReducer(
					stateWithRequests,
					convertRequestToTask('req-1'),
				);

				expect(actual.requests[0].status).toBe('Completed');
				expect(actual.requests[1].status).toBe('pending');
			});

			it('should not error if request not found', () => {
				const stateWithRequest = { requests: [mockRequest] };
				const actual = maintenanceRequestsReducer(
					stateWithRequest,
					convertRequestToTask('req-999'),
				);

				expect(actual.requests[0].status).toBe('pending');
			});
		});

		describe('setMaintenanceRequests', () => {
			it('should set all maintenance requests', () => {
				const requests = [
					mockRequest,
					{ ...mockRequest, id: 'req-2' },
					{ ...mockRequest, id: 'req-3' },
				];
				const actual = maintenanceRequestsReducer(
					initialState,
					setMaintenanceRequests(requests),
				);

				expect(actual.requests).toHaveLength(3);
				expect(actual.requests).toEqual(requests);
			});

			it('should replace existing requests', () => {
				const stateWithRequests = {
					requests: [mockRequest, { ...mockRequest, id: 'req-2' }],
				};
				const newRequests = [{ ...mockRequest, id: 'req-3' }];
				const actual = maintenanceRequestsReducer(
					stateWithRequests,
					setMaintenanceRequests(newRequests),
				);

				expect(actual.requests).toHaveLength(1);
				expect(actual.requests[0].id).toBe('req-3');
			});

			it('should handle empty array', () => {
				const stateWithRequests = { requests: [mockRequest] };
				const actual = maintenanceRequestsReducer(
					stateWithRequests,
					setMaintenanceRequests([]),
				);

				expect(actual.requests).toEqual([]);
			});
		});

		describe('complex scenarios', () => {
			it('should handle full workflow: add, update, convert, delete', () => {
				let state = initialState;

				// Add request
				state = maintenanceRequestsReducer(
					state,
					addMaintenanceRequest(mockRequest),
				);
				expect(state.requests).toHaveLength(1);
				expect(state.requests[0].status).toBe('pending');

				// Update request
				const updatedRequest = { ...mockRequest, priority: 'Low' };
				state = maintenanceRequestsReducer(
					state,
					updateMaintenanceRequest(updatedRequest as any),
				);
				expect(state.requests[0].priority).toBe('Low');

				// Convert to task
				state = maintenanceRequestsReducer(
					state,
					convertRequestToTask('req-1'),
				);
				expect(state.requests[0].status).toBe('Completed');

				// Delete request
				state = maintenanceRequestsReducer(
					state,
					deleteMaintenanceRequest('req-1'),
				);
				expect(state.requests).toHaveLength(0);
			});

			it('should handle batch operations', () => {
				// Set multiple requests at once
				const requests = [
					{ ...mockRequest, id: 'req-1' },
					{ ...mockRequest, id: 'req-2' },
					{ ...mockRequest, id: 'req-3' },
				];
				let state = maintenanceRequestsReducer(
					initialState,
					setMaintenanceRequests(requests),
				);
				expect(state.requests).toHaveLength(3);

				// Update multiple requests
				state = maintenanceRequestsReducer(
					state,
					updateMaintenanceRequest({ ...requests[0], priority: 'High' } as any),
				);
				state = maintenanceRequestsReducer(
					state,
					updateMaintenanceRequest({
						...requests[1],
						priority: 'Medium',
					} as any),
				);
				expect(state.requests[0].priority).toBe('High');
				expect(state.requests[1].priority).toBe('Medium');

				// Delete one request
				state = maintenanceRequestsReducer(
					state,
					deleteMaintenanceRequest('req-2'),
				);
				expect(state.requests).toHaveLength(2);
				expect(state.requests.map((r) => r.id)).toEqual(['req-1', 'req-3']);
			});
		});
	});
});
