import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '../../../Redux/store/store';
import { InsightsTab } from './InsightsTab';
import {
	useGetLatestPropertyScanSnapshotQuery,
	useGetPropertyScanSnapshotsQuery,
	useSavePropertyScanSnapshotMutation,
} from '../../../Redux/API/propertyIntelligenceSlice';

jest.mock('../../../Redux/API/propertyIntelligenceSlice', () => ({
	useGetLatestPropertyScanSnapshotQuery: jest.fn(),
	useGetPropertyScanSnapshotsQuery: jest.fn(),
	useSavePropertyScanSnapshotMutation: jest.fn(),
}));

const latestSnapshot = {
	id: 'latest-scan',
	accountId: 'acct-1',
	propertyId: 'property-1',
	scanType: 'quick_property_scan_v1',
	schemaVersion: 2,
	planId: 'homeowner',
	createdAt: '2026-06-01T12:00:00.000Z',
	updatedAt: '2026-06-01T12:00:00.000Z',
	systemsReviewed: 4,
	summary: {
		recommendations: 1,
		overdue: 0,
		high: 0,
		medium: 1,
		low: 0,
	},
	recommendations: [
		{
			id: 'rec-latest',
			ruleId: 'major-systems-missing-install-dates',
			propertyId: 'property-1',
			relatedSystemIds: ['system-1'],
			category: 'Missing Information',
			severity: 'medium',
			priority: 'medium',
			source: 'property_memory',
			title: 'No install date has been recorded for several major systems.',
			description:
				'Install dates make warranty tracking, service planning, and future replacements easier.',
			reason: 'Maintley found systems without recorded install dates.',
			suggestedActionLabel: 'Review Systems',
			suggestedActionType: 'open_systems',
			createdAt: '2026-06-01T12:00:00.000Z',
			status: 'active',
		},
	],
};

const historicalSnapshots = [
	{
		...latestSnapshot,
		id: 'history-scan',
		createdAt: '2026-05-15T10:00:00.000Z',
		updatedAt: '2026-05-15T10:00:00.000Z',
		systemsReviewed: 7,
		summary: {
			recommendations: 2,
			overdue: 1,
			high: 1,
			medium: 1,
			low: 0,
		},
		recommendations: [
			{
				...latestSnapshot.recommendations[0],
				id: 'history-rec-1',
				title: 'Maintley has recorded maintenance tasks that are now overdue.',
				description:
					'Reviewing these recorded tasks helps keep maintenance visible.',
				reason:
					'Maintley found recorded maintenance tasks with due dates that have passed.',
				category: 'Overdue Work',
				severity: 'high',
				source: 'property_memory',
				relatedTaskIds: ['task-1'],
				relatedSystemIds: [],
				suggestedActionType: 'open_task',
			},
			{
				...latestSnapshot.recommendations[0],
				id: 'history-rec-2',
				title:
					'Maintley does not currently have recurring maintenance recorded for several systems.',
				description:
					'Recurring schedules help keep service intervals visible over time.',
				reason:
					'Maintley found systems without linked recurring maintenance tasks.',
				category: 'Maintenance Opportunities',
				source: 'knowledge_pack',
			},
		],
	},
];

const defaultProps = {
	property: {
		id: 'property-1',
		userId: 'user-1',
		title: 'Main Street',
		slug: 'main-street',
	},
	propertyDevices: [],
	tasks: [],
	maintenanceHistoryRecords: [],
	canRunScan: true,
	accountId: 'acct-1',
	subscription: {
		status: 'active' as const,
		plan: 'homeowner',
		currentPeriodStart: 0,
		currentPeriodEnd: 0,
	},
	onRecommendationAction: jest.fn(),
};

const renderInsights = (props: Partial<typeof defaultProps> = {}) =>
	render(
		<Provider store={store}>
			<InsightsTab {...defaultProps} {...props} />
		</Provider>,
	);

describe('InsightsTab', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		window.localStorage.setItem(
			'maintley:property-scan-v1:education-seen:user-1',
			'true',
		);
		(useGetLatestPropertyScanSnapshotQuery as jest.Mock).mockReturnValue({
			data: latestSnapshot,
			isLoading: false,
		});
		(useSavePropertyScanSnapshotMutation as jest.Mock).mockReturnValue([
			jest.fn(),
		]);
		(useGetPropertyScanSnapshotsQuery as jest.Mock).mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
		});
	});

	test('shows the current scan experience on Overview', () => {
		renderInsights();

		expect(
			screen.getByRole('tab', { name: /overview/i }),
		).toHaveAttribute('aria-selected', 'true');
		expect(
			screen.getByRole('tab', { name: /history/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('region', { name: /property quick scan/i }),
		).toBeInTheDocument();
		expect(screen.getByText('What Maintley Found')).toBeInTheDocument();
	});

	test('shows the Intelligence history empty state', async () => {
		const user = userEvent.setup();
		renderInsights();

		await user.click(screen.getByRole('tab', { name: /history/i }));

		expect(
			screen.getByText(
				"Run a Quick Scan to begin building this property's Intelligence history.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole('region', { name: /property quick scan/i }),
		).not.toBeInTheDocument();
	});

	test('renders saved scan snapshots in History', async () => {
		const user = userEvent.setup();
		(useGetPropertyScanSnapshotsQuery as jest.Mock).mockReturnValue({
			data: historicalSnapshots,
			isLoading: false,
			isError: false,
		});

		renderInsights();
		await user.click(screen.getByRole('tab', { name: /history/i }));

		expect(
			screen.getByRole('heading', { name: /intelligence history/i }),
		).toBeInTheDocument();
		expect(screen.getByText('Quick Scan')).toBeInTheDocument();
		expect(screen.getByText('2 recommendations')).toBeInTheDocument();
		expect(screen.queryByText('systems analyzed')).not.toBeInTheDocument();
	});

	test('opens a read-only historical scan detail view', async () => {
		const user = userEvent.setup();
		(useGetPropertyScanSnapshotsQuery as jest.Mock).mockReturnValue({
			data: historicalSnapshots,
			isLoading: false,
			isError: false,
		});

		renderInsights();
		await user.click(screen.getByRole('tab', { name: /history/i }));
		await user.click(screen.getByRole('button', { name: /^view$/i }));

		const dialog = screen.getByRole('heading', {
			name: /quick scan snapshot/i,
		}).closest('div');

		expect(screen.getByText(/read-only record/i)).toBeInTheDocument();
		expect(
			screen.getByText(
				'Maintley has recorded maintenance tasks that are now overdue.',
			),
		).toBeInTheDocument();
		expect(screen.getByText('Overdue Work')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /review tasks/i }),
		).not.toBeInTheDocument();
		expect(dialog ? within(dialog).queryByText(/delete/i) : null).not.toBeInTheDocument();
	});
});
