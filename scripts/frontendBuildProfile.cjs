const resolveFrontendBuildProfile = (argumentsList = []) => {
	const android = argumentsList.includes('--android');
	return {
		name: android ? 'android' : 'web',
		publicUrl: android ? '.' : '/',
		routerMode: android ? 'hash' : 'browser',
	};
};

module.exports = { resolveFrontendBuildProfile };
