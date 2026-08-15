import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
	EquipmentSuppliesReview,
	type PendingEquipmentSupplyDraft,
} from './EquipmentSuppliesReview';

jest.mock('../Library/BarcodeScanner/BarcodeScannerModal', () => ({
	BarcodeScannerModal: () => null,
}));

const ReviewHarness = () => {
	const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>([]);
	const [pendingSupplies, setPendingSupplies] = useState<
		PendingEquipmentSupplyDraft[]
	>([]);

	return (
		<EquipmentSuppliesReview
			supplies={[]}
			selectedSupplyIds={selectedSupplyIds}
			onSelectedSupplyIdsChange={setSelectedSupplyIds}
			pendingSupplies={pendingSupplies}
			onPendingSuppliesChange={setPendingSupplies}
		/>
	);
};

describe('EquipmentSuppliesReview', () => {
	it('stages a new property Supply in review before Equipment save', async () => {
		const user = userEvent.setup();
		render(<ReviewHarness />);

		expect(screen.getByText('Review Equipment Supplies')).toBeInTheDocument();
		expect(screen.getByText(/create 0 new property Supply/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Create New Supply' }));
		await user.type(screen.getByLabelText('Supply name *'), 'HVAC Filter');
		await user.click(
			screen.getByRole('button', { name: 'Add to Equipment Review' }),
		);

		expect(screen.getByText('HVAC Filter')).toBeInTheDocument();
		expect(screen.getByText(/create 1 new property Supply/)).toBeInTheDocument();
	});
});
