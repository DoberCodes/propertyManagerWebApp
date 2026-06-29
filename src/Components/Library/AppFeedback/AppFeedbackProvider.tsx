import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

type FeedbackTone = 'success' | 'error' | 'info';

type FeedbackItem = {
	id: string;
	message: string;
	tone: FeedbackTone;
};

type AppFeedbackContextValue = {
	notify: (message: string, tone?: FeedbackTone) => void;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

const ToastViewport = styled.div`
	position: fixed;
	right: 18px;
	bottom: 18px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	z-index: 11000;
	pointer-events: none;

	@media (max-width: 640px) {
		right: 12px;
		left: 12px;
		bottom: 12px;
	}
`;

const ToastCard = styled.div<{ $tone: FeedbackTone }>`
	background: #ffffff;
	border: 1px solid
		${(props) =>
			props.$tone === 'success'
				? COLORS.primaryLight
				: props.$tone === 'error'
					? '#fca5a5'
					: '#cbd5e1'};
	border-left: 4px solid
		${(props) =>
			props.$tone === 'success'
				? COLORS.primary
				: props.$tone === 'error'
					? '#dc2626'
					: COLORS.primaryDark};
	border-radius: 10px;
	padding: 10px 12px;
	min-width: 280px;
	max-width: 440px;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
	font-size: 14px;
	font-weight: 600;
	line-height: 1.45;
	color: #0f172a;
	white-space: pre-line;
	pointer-events: auto;
	animation: slideIn 140ms ease-out;

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		min-width: 0;
		max-width: 100%;
	}
`;

const getToneFromMessage = (rawMessage: string): FeedbackTone => {
	const msg = rawMessage.toLowerCase();
	if (
		msg.includes('failed') ||
		msg.includes('error') ||
		msg.includes('unable') ||
		msg.includes('cannot')
	) {
		return 'error';
	}
	if (
		msg.includes('success') ||
		msg.includes('completed') ||
		msg.includes('created') ||
		msg.includes('added') ||
		msg.includes('saved') ||
		msg.includes('great work')
	) {
		return 'success';
	}
	return 'info';
};

export const AppFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [items, setItems] = useState<FeedbackItem[]>([]);

	const notify = useCallback((message: string, tone?: FeedbackTone) => {
		const trimmed = String(message || '').trim();
		if (!trimmed) return;

		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const finalTone = tone || getToneFromMessage(trimmed);

		setItems((prev) => [...prev, { id, message: trimmed, tone: finalTone }]);

		window.setTimeout(() => {
			setItems((prev) => prev.filter((item) => item.id !== id));
		}, 4200);
	}, []);

	const value = useMemo(() => ({ notify }), [notify]);

	return (
		<AppFeedbackContext.Provider value={value}>
			{children}
			<ToastViewport>
				{items.map((item) => (
					<ToastCard key={item.id} $tone={item.tone}>
						{item.message}
					</ToastCard>
				))}
			</ToastViewport>
		</AppFeedbackContext.Provider>
	);
};

export const useAppFeedback = (): AppFeedbackContextValue => {
	const context = useContext(AppFeedbackContext);
	if (!context) {
		throw new Error('useAppFeedback must be used within AppFeedbackProvider');
	}
	return context;
};
