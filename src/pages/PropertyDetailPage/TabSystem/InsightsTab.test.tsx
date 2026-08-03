import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../../../Redux/store/store';
import { AppFeedbackProvider } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
import { InsightsTab } from './InsightsTab';
import {
	useGetLatestPropertyIntelligenceSnapshotQuery,
	useGetLatestPropertyScanSnapshotQuery,
	useGetPropertyScanSnapshotsQuery,
	useSavePropertyAuditSnapshotMutation,
	useSavePropertyScanSnapshotMutation,
} from '../../../Redux/API/propertyIntelligenceSlice';

jest.mock('../../../Redux/API/propertyIntelligenceSlice', () => ({
	useGetLatestPropertyIntelligenceSnapshotQuery: jest.fn(),
	useGetLatestPropertyScanSnapshotQuery: jest.fn(),
	useGetPropertyScanSnapshotsQuery: jest.fn(),
	useSavePropertyAuditSnapshotMutation: jest.fn(),
	useSavePropertyScanSnapshotMutation: jest.fn(),
}));

jest.mock('../../../propertyKnowledge/usePropertyMemoryRecords', () => {
	const memoryRecords = jest.requireActual(
		'../../../propertyKnowledge/propertyMemoryRecordService',
	);
	return {
		usePropertyMemoryRecords: (property: unknown) => ({
			documents: memoryRecords.getEmbeddedPropertyDocuments(property),
			knowledgeSuggestions:
				memoryRecords.getEmbeddedPropertyKnowledgeSuggestions(property),
		}),
	};
});

jest.mock('../../../Redux/API/propertyKnowledgeLinkSlice', () => ({
	...jest.requireActual('../../../Redux/API/propertyKnowledgeLinkSlice'),
	useGetPropertyKnowledgeLinksQuery: () => ({ data: [] }),
}));

jest.mock('../../../Redux/API/spaceSlice', () => ({
	...jest.requireActual('../../../Redux/API/spaceSlice'),
	useGetPropertySpacesQuery: () => ({ data: [] }),
}));

jest.mock('../../../Redux/API/supplySlice', () => ({
	...jest.requireActual('../../../Redux/API/supplySlice'),
	useGetPropertySuppliesQuery: () => ({ data: [] }),
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
		plan: 'homeowner_plus',
		currentPeriodStart: 0,
		currentPeriodEnd: 0,
	},
	onRecommendationAction: jest.fn(),
};

const renderInsights = (props: Partial<typeof defaultProps> = {}) =>
	render(
		<MemoryRouter
			future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<Provider store={store}>
				<AppFeedbackProvider>
					<InsightsTab {...defaultProps} {...props} />
				</AppFeedbackProvider>
			</Provider>
		</MemoryRouter>,
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
		(useGetLatestPropertyIntelligenceSnapshotQuery as jest.Mock).mockReturnValue({
			data: null,
			isLoading: false,
		});
		(useSavePropertyAuditSnapshotMutation as jest.Mock).mockReturnValue([
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
			screen.getByRole('tab', { name: /suggested details/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('region', { name: /property quick scan/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('region', { name: /property review/i }),
		).toBeInTheDocument();
		expect(screen.queryByText('What Maintley Found')).not.toBeInTheDocument();
	});

	test('shows suggested details inside the Insights workspace', async () => {
		const user = userEvent.setup();
		renderInsights({
			propertyDevices: [
				{
					id: 'system-1',
					type: 'HVAC',
					assetType: 'HVAC',
				},
			] as any,
			property: {
				...defaultProps.property,
				knowledgeSuggestions: [
					{
						id: 'knowledge-1',
						sourceDocumentId: 'doc-1',
						sourceDocumentName: 'HVAC Invoice.png',
						propertyId: 'property-1',
						relatedSystemId: 'system-1',
						documentType: 'invoice',
						extractionMethod: 'image_ocr',
						extractedFields: [
							{
								id: 'field-1',
								fieldKey: 'model',
								label: 'Model',
								value: '4TTR4036L1000A',
								confidence: 0.82,
								targetEntity: 'system',
								targetField: 'model',
							},
						],
						suggestedParts: [],
						status: 'pending',
						createdAt: '2026-06-26T12:00:00.000Z',
					},
				],
			} as any,
		});

		await user.click(screen.getByRole('tab', { name: /suggested details/i }));

		expect(
			screen.getByRole('heading', { name: /suggested details/i }),
		).toBeInTheDocument();
		expect(screen.getAllByText('HVAC Invoice.png')).toHaveLength(2);
		expect(screen.getByText('Matched Asset')).toBeInTheDocument();
		expect(screen.getByText('HVAC')).toBeInTheDocument();
		expect(screen.getAllByText('General').length).toBeGreaterThan(0);
		expect(screen.getByText('1 of 1 accepted')).toBeInTheDocument();
		expect(screen.queryByText('Current')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /expand details/i }));

		expect(screen.getByText('Current')).toBeInTheDocument();
		expect(screen.getByText('Proposed')).toBeInTheDocument();
		expect(screen.getByText('Will add')).toBeInTheDocument();
		expect(screen.getByDisplayValue('4TTR4036L1000A')).toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	test('shows a matched maintenance event target before creating a new event', async () => {
		const user = userEvent.setup();
		renderInsights({
			property: {
				...defaultProps.property,
				documents: [
					{
						id: 'doc-1',
						fileName: 'Carolina Comfort Invoice.png',
						uploadedAt: '2026-06-26T12:00:00.000Z',
					},
				],
				knowledgeSuggestions: [
					{
						id: 'knowledge-1',
						sourceDocumentId: 'doc-1',
						sourceDocumentName: 'Carolina Comfort Invoice.png',
						propertyId: 'property-1',
						relatedSystemId: 'system-1',
						documentType: 'invoice',
						extractionMethod: 'image_ocr',
						extractedFields: [
							{
								id: 'field-invoice',
								fieldKey: 'invoiceNumber',
								label: 'Invoice number',
								value: 'INV-2025-04158',
								targetEntity: 'maintenanceHistory',
								targetField: 'invoiceNumber',
							},
							{
								id: 'field-total',
								fieldKey: 'totalCost',
								label: 'Total cost',
								value: '$7,325.18',
								targetEntity: 'maintenanceHistory',
								targetField: 'totalCost',
							},
						],
						suggestedParts: [],
						status: 'pending',
						createdAt: '2026-06-26T12:00:00.000Z',
					},
				],
			} as any,
			propertyDevices: [
				{
					id: 'system-1',
					userId: 'user-1',
					type: 'HVAC',
					assetType: 'HVAC',
					location: {
						propertyId: 'property-1',
					},
				},
			] as any,
			maintenanceHistoryRecords: [
				{
					id: 'event-1',
					title: 'HVAC installation',
					completionDate: '2025-06-14',
					completionNotes: 'Invoice number: INV-2025-04158',
					deviceIds: ['system-1'],
					financials: {
						currency: 'USD',
						actual: {
							contractorCost: 7325.18,
						},
					},
				},
			] as any,
		});

		await user.click(screen.getByRole('tab', { name: /suggested details/i }));

		expect(
			screen.getByText(
				'Maintley found an existing Maintenance Event that may match this document.',
			),
		).toBeInTheDocument();
		expect(screen.getAllByText(/HVAC installation/).length).toBeGreaterThan(0);
		expect(
			screen.getByRole('button', { name: /update existing/i }),
		).toHaveAttribute('aria-pressed', 'true');

		await user.click(screen.getByRole('button', { name: /not the same/i }));

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /not the same/i }),
			).toHaveAttribute('aria-pressed', 'true');
		});
		expect(screen.getByText('New record')).toBeInTheDocument();
	});

	test('shows the Intelligence history empty state', async () => {
		const user = userEvent.setup();
		renderInsights();

		await user.click(screen.getByRole('tab', { name: /history/i }));

		expect(
			screen.getByText(
				"Run a Quick Scan or review suggested document details to begin building this property's Intelligence history.",
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

		expect(
			screen.getByRole('heading', { name: /quick scan snapshot/i }),
		).toBeInTheDocument();

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
		expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
	});

	test('hides reviewed suggestions from the active Suggested Details queue', async () => {
		const user = userEvent.setup();
		renderInsights({
			property: {
				...defaultProps.property,
				knowledgeSuggestions: [
					{
						id: 'knowledge-applied',
						sourceDocumentId: 'doc-1',
						sourceDocumentName: 'HVAC Invoice.png',
						propertyId: 'property-1',
						documentType: 'invoice',
						extractionMethod: 'image_ocr',
						extractedFields: [
							{
								id: 'field-1',
								fieldKey: 'brand',
								label: 'Brand',
								value: 'Trane',
								targetEntity: 'system',
								targetField: 'brand',
							},
						],
						suggestedParts: [],
						status: 'applied',
						createdAt: '2026-06-26T12:00:00.000Z',
						reviewedAt: '2026-06-26T12:10:00.000Z',
						appliedAt: '2026-06-26T12:10:00.000Z',
					},
				],
			} as any,
		});

		await user.click(screen.getByRole('tab', { name: /suggested details/i }));

		expect(
			screen.getByText('Turn property documents into useful records.'),
		).toBeInTheDocument();
		expect(screen.queryByText('HVAC Invoice.png')).not.toBeInTheDocument();
		expect(screen.queryByDisplayValue('Trane')).not.toBeInTheDocument();
	});

	test('shows applied knowledge as a read-only Intelligence history event', async () => {
		const user = userEvent.setup();
		renderInsights({
			property: {
				...defaultProps.property,
				knowledgeSuggestions: [
					{
						id: 'knowledge-applied',
						sourceDocumentId: 'doc-1',
						sourceDocumentName: 'HVAC Invoice.png',
						propertyId: 'property-1',
						documentType: 'invoice',
						extractionMethod: 'image_ocr',
						extractedFields: [
							{
								id: 'field-1',
								fieldKey: 'brand',
								label: 'Brand',
								value: 'Trane',
								targetEntity: 'system',
								targetField: 'brand',
							},
						],
						suggestedParts: [
							{
								id: 'part-1',
								partKnowledgeId: 'thermostat',
								label: 'Thermostat',
								name: 'Honeywell T6 Pro Smart Thermostat',
								category: 'accessory',
								relatedAssetTypes: ['HVAC'],
								targetEntity: 'part',
								sourceText: 'Honeywell T6 Pro Smart Thermostat',
							},
						],
						status: 'applied',
						createdAt: '2026-06-26T12:00:00.000Z',
						reviewedAt: '2026-06-26T12:10:00.000Z',
						appliedAt: '2026-06-26T12:10:00.000Z',
					},
				],
			} as any,
		});

		await user.click(screen.getByRole('tab', { name: /history/i }));

		expect(screen.getByText('Knowledge added')).toBeInTheDocument();
		expect(
			screen.getByText('2 details added from HVAC Invoice.png'),
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /^view$/i }));

		expect(screen.getByText(/read-only summary/i)).toBeInTheDocument();
		expect(screen.getByText('Brand: Trane')).toBeInTheDocument();
		expect(
			screen.getByText('Honeywell T6 Pro Smart Thermostat'),
		).toBeInTheDocument();
		expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
	});
});
