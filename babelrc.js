module.exports = () => {
	api.cache.forever();
	return {
		plugins: ['macros'],
	};
};
