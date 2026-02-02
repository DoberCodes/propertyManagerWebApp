import React from 'react';
import {
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogForm,
	DialogButtonGroup,
	DialogCancelButton,
	DialogSubmitButton,
	ModalFormContent,
	CloseModalButton,
} from './ModalStyles';

interface GenericModalProps {
	isOpen: boolean;
	title: string;
	onClose: () => void;
	primaryButtonLabel?: string;
	primaryButtonAction?: () => void | Promise<void>;
	secondaryButtonLabel?: string;
	secondaryButtonAction?: () => void | Promise<void>;
	children: React.ReactNode;
	primaryButtonDisabled?: boolean;
	isLoading?: boolean;
	onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export const GenericModal: React.FC<GenericModalProps> = ({
	isOpen,
	title,
	onClose,
	primaryButtonLabel = 'Submit',
	primaryButtonAction,
	secondaryButtonLabel = 'Cancel',
	secondaryButtonAction,
	children,
	primaryButtonDisabled = false,
	isLoading = false,
	onSubmit,
}) => {
	if (!isOpen) return null;

	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (onSubmit) {
			await onSubmit(e);
		} else if (primaryButtonAction) {
			await primaryButtonAction();
		}
	};

	const handleSecondaryAction = async () => {
		if (secondaryButtonAction) {
			await secondaryButtonAction();
		} else {
			onClose();
		}
	};

	return (
		<DialogOverlay
			onClick={(e: React.MouseEvent<HTMLDivElement>) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<h3>{title}</h3>
					<CloseModalButton onClick={onClose} title='Close modal'>
						×
					</CloseModalButton>
				</DialogHeader>
				<ModalFormContent>
					<DialogForm onSubmit={handleFormSubmit}>
						{children}
						<DialogButtonGroup>
							<DialogCancelButton
								type='button'
								onClick={handleSecondaryAction}
								disabled={isLoading}>
								{secondaryButtonLabel}
							</DialogCancelButton>
							<DialogSubmitButton
								type='submit'
								disabled={primaryButtonDisabled || isLoading}>
								{primaryButtonLabel}
							</DialogSubmitButton>
						</DialogButtonGroup>
					</DialogForm>
				</ModalFormContent>
			</DialogContent>
		</DialogOverlay>
	);
};

export default GenericModal;
