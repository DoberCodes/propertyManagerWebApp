import packageJson from '../../package.json';

export const CURRENT_APP_VERSION = packageJson.version;
export const CURRENT_BUILD_VERSION =
	process.env.REACT_APP_BUILD_VERSION?.trim() || `v${CURRENT_APP_VERSION}`;
