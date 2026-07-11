import { getRouteAnalyticsDefinition } from './routeAnalytics';

describe('route analytics', () => {
	it('maps dynamic customer routes to non-identifying route patterns', () => {
		expect(getRouteAnalyticsDefinition('/property/casa-de-dober')).toEqual({
			pattern: '/property/:slug',
			routeName: 'property_detail',
			area: 'properties',
		});

		expect(
			getRouteAnalyticsDefinition('/property/casa-de-dober/device/lennox-hvac'),
		).toEqual({
			pattern: '/property/:slug/device/:deviceSlug',
			routeName: 'equipment_detail',
			area: 'equipment',
		});
	});
});
