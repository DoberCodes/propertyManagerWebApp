import React from 'react';
import { GenericModal } from './GenericModal';
import { WarningMessage } from './ModalStyles';

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	itemName: string;
	itemType?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
}

/**
 * DeleteConfirmationModal
 * Reusable modal for confirming deletion of items
 * Shows the name of the item being deleted and asks for confirmation
 */
export const DeleteConfirmationModal: React.FC<
	DeleteConfirmationModalProps
> = ({
	isOpen,
	itemName,
	itemType = 'item',
	onConfirm,
	onCancel,
	isLoading = false,
}) => {
	return (
		<GenericModal
			isOpen={isOpen}
			title='Confirm Deletion'
			onClose={onCancel}
			primaryButtonLabel='Delete'
			primaryButtonAction={onConfirm}
			secondaryButtonLabel='Cancel'
			secondaryButtonAction={onCancel}
			isLoading={isLoading}
			primaryButtonDisabled={isLoading}>
			<WarningMessage>
				<p>
					Are you sure you want to delete this {itemType}? This action cannot be
					undone.
				</p>
				<p
					style={{
						fontWeight: 600,
						marginTop: '16px',
						wordBreak: 'break-word',
					}}>
					{itemName}
				</p>
			</WarningMessage>
		</GenericModal>
	);
};
