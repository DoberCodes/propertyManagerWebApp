import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { hideAppLoading, showAppLoading } from '../../Redux/Slices/appSlice';
import type { AppDispatch } from '../../Redux/store/store';

interface LoadingStateProps {
	loadingKey?: string;
	title?: string;
	message?: string;
	steps?: string[];
}

export const LoadingState = ({
	loadingKey = 'global',
	title = 'Getting Maintley ready',
	message = 'Checking your account and preparing your workspace.',
	steps,
}: LoadingStateProps) => {
	const dispatch = useDispatch<AppDispatch>();
	const stepsKey = steps?.join('\u001f') || '';
	const stepsKeyRef = useRef<string>();
	const stepsRef = useRef<string[] | undefined>(steps);

	if (stepsKeyRef.current !== stepsKey) {
		stepsKeyRef.current = stepsKey;
		stepsRef.current = steps;
	}

	useEffect(() => {
		dispatch(
			showAppLoading({
				key: loadingKey,
				title,
				message,
				steps: stepsRef.current,
			}),
		);

		return () => {
			dispatch(hideAppLoading(loadingKey));
		};
		// Depend on step content, not array identity. Some callers pass inline
		// arrays while rendering loading states.
	}, [dispatch, loadingKey, message, stepsKey, title]);

	return null;
};
