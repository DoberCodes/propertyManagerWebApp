import { Navigate, useLocation } from 'react-router-dom';

export interface ProtectedRoutesProps {
	isLoggedIn: boolean;
	children: any;
}

export const ProtectedRoutes = (props: ProtectedRoutesProps) => {
	const location = useLocation();
	if (!props.isLoggedIn) {
		return <Navigate to='/' replace={true} state={{ from: location }} />;
	} else {
		return props.children;
	}
};
