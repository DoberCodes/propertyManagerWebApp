import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000; /* Increased from 1000 to be above modals */
	padding: 1rem;

	@media (max-width: 480px) {
		padding-top: max(0.75rem, env(safe-area-inset-top));
		padding-right: max(0.75rem, env(safe-area-inset-right));
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
		padding-left: max(0.75rem, env(safe-area-inset-left));
	}
`;

const Dialog = styled.div`
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
	padding: 32px 24px;
	min-width: min(320px, calc(100vw - 2rem));
	max-width: 90vw;

	@media (max-width: 480px) {
		width: 100%;
		max-width: calc(100vw - 1.5rem);
		padding: 24px 16px;
	}
`;

const Title = styled.h2`
	margin-top: 0;
	margin-bottom: 16px;
	font-size: 1.25rem;
`;

const Message = styled.div`
	margin-bottom: 24px;
	font-size: 1rem;
`;

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
`;

const Button = styled.button`
	padding: 8px 20px;
	border-radius: 4px;
	border: none;
	font-size: 1rem;
	cursor: pointer;
	background: #eee;
	&:hover {
		background: #ddd;
	}
`;

const ConfirmButton = styled(Button)`
	background: #e53935;
	color: #fff;
	&:hover {
		background: #c62828;
	}
`;

export interface WarningDialogProps {
	open: boolean;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const WarningDialog: React.FC<WarningDialogProps> = ({
	open,
	title = 'Warning',
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
}) => {
	if (!open) return null;
	return (
		<Overlay onClick={onCancel}>
			<Dialog onClick={(e) => e.stopPropagation()}>
				<Title>{title}</Title>
				<Message>{message}</Message>
				<Actions>
					<Button onClick={onCancel}>{cancelText}</Button>
					<ConfirmButton onClick={onConfirm}>{confirmText}</ConfirmButton>
				</Actions>
			</Dialog>
		</Overlay>
	);
};
