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
	z-index: 1000;
`;

const Dialog = styled.div`
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
	padding: 32px 24px;
	min-width: 320px;
	max-width: 90vw;
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
