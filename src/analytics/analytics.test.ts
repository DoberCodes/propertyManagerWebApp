import {
	getAnalyticsErrorCode,
	sanitizeAnalyticsEventParams,
	sanitizeAnalyticsParams,
} from './analytics';
import { ANALYTICS_EVENT_PARAM_ALLOWLIST } from './analyticsContract';

describe('analytics helpers', () => {
	it('removes empty values and keeps simple GA-safe values', () => {
		expect(
			sanitizeAnalyticsParams({
				empty: '',
				missing: undefined,
				nothing: null,
				route_name: 'dashboard',
				is_team_member: false,
				count: 3,
				bad_number: Number.NaN,
			}),
		).toEqual({
			route_name: 'dashboard',
			is_team_member: false,
			count: 3,
		});
	});

	it('trims and caps string params', () => {
		const longValue = ' a'.repeat(80);

		expect(sanitizeAnalyticsParams({ value: ` ${longValue} ` }).value).toHaveLength(100);
	});

	it('allows only documented parameters for each event', () => {
		expect(
			sanitizeAnalyticsEventParams('document_uploaded', {
				document_count: 2,
				document_category: 'invoice',
				document_name: 'Private invoice.pdf',
				property_address: '123 Private Street',
			}),
		).toEqual({
			app_area: 'maintley',
			document_count: 2,
			document_category: 'invoice',
		});
	});

	it('drops invalid action source values', () => {
		expect(
			sanitizeAnalyticsEventParams('task_created', {
				action_source: 'clicked from a private note',
				task_status: 'Initiated',
			}),
		).toEqual({
			app_area: 'maintley',
			task_status: 'Initiated',
		});
	});

	it('keeps controlled setup path analytics without customer record details', () => {
		expect(
			sanitizeAnalyticsEventParams('property_setup_path_selected', {
				setup_path: 'essentials',
				reviewed_count: 0,
				total_count: 9,
				property_id: 'private-property-id',
			}),
		).toEqual({
			app_area: 'maintley',
			setup_path: 'essentials',
			reviewed_count: 0,
			total_count: 9,
		});
	});

	it('keeps a controlled setup exit reason', () => {
		expect(
			sanitizeAnalyticsEventParams('property_setup_path_exited', {
				setup_path: 'room_by_room',
				exit_reason: 'user_closed',
				property_name: 'Private home name',
			}),
		).toEqual({
			app_area: 'maintley',
			setup_path: 'room_by_room',
			exit_reason: 'user_closed',
		});
	});

	it('keeps direct identifiers and customer content out of the event contract', () => {
		const allowedKeys = Object.values(ANALYTICS_EVENT_PARAM_ALLOWLIST).flat();
		const forbiddenKeys = [
			'email',
			'name',
			'address',
			'notes',
			'description',
			'filename',
			'document_id',
			'property_id',
			'task_id',
			'user_id',
			'url',
		];

		forbiddenKeys.forEach((key) => expect(allowedKeys).not.toContain(key));
	});

	it('reduces raw failures to controlled error categories', () => {
		expect(getAnalyticsErrorCode({ code: 'permission-denied' })).toBe(
			'permission_denied',
		);
		expect(getAnalyticsErrorCode(new Error('Failed to fetch: network offline'))).toBe(
			'network_unavailable',
		);
		expect(getAnalyticsErrorCode(new Error('Customer content'))).toBe(
			'unexpected_error',
		);
	});
});
