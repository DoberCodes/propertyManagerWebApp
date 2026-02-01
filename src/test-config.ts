/**
 * Test configuration and setup file
 * Run tests with: npm test -- --coverage
 * Generate coverage report: npm test -- --coverage --watchAll=false
 */

// Coverage thresholds for the project
const coverageThresholds = {
	global: {
		statements: 70,
		branches: 60,
		functions: 65,
		lines: 70,
	},
};

export default coverageThresholds;
