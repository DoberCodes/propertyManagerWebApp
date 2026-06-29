import { useEffect } from 'react';
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

	useEffect(() => {
		dispatch(
			showAppLoading({
				key: loadingKey,
				title,
				message,
				steps,
			}),
		);

		return () => {
			dispatch(hideAppLoading(loadingKey));
		};
	}, [dispatch, loadingKey, message, steps, title]);

	return null;
};
