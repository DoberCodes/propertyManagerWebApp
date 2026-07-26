import { USER_ROLES } from '../constants/roles';

export const getFallbackRoute = (role?: string): '/dashboard' | '/tenant-profile' =>
	role === USER_ROLES.TENANT ? '/tenant-profile' : '/dashboard';
