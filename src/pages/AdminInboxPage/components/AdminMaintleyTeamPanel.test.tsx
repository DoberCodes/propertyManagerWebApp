import { render, screen } from '@testing-library/react';
import { adminPortalListMaintleyTeam } from '../../../services/adminPortalService';
import { AdminMaintleyTeamPanel } from './AdminMaintleyTeamPanel';

jest.mock('../../../services/adminPortalService', () => ({
	adminPortalListMaintleyTeam: jest.fn(),
	adminPortalMutateMaintleyTeam: jest.fn(),
}));

describe('AdminMaintleyTeamPanel', () => {
	test('distinguishes Maintley employment authority from customer ownership', async () => {
		(adminPortalListMaintleyTeam as jest.Mock).mockResolvedValue({
			members: [{
				id: 'staff-1',
				email: 'admin@maintleyapp.com',
				displayName: 'Maintley Admin',
				maintleyRole: 'admin',
				permissions: [],
			}],
			actorRole: 'owner',
			canAssignElevatedRoles: true,
		});

		render(<AdminMaintleyTeamPanel sessionToken='session' />);

		expect(screen.getByText(/separate from homeowner and property-account ownership/i)).toBeInTheDocument();
		expect(await screen.findByText('Maintley Admin')).toBeInTheDocument();
		expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
	});
});
