import React from 'react';
import { SuitesTabProps } from '../../../types/PropertyDetailPage.types';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RootState } from '../../../Redux/store/store';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import {
	DesktopTableWrapper,
	DeviceCard,
	EmptyState,
	MobileActionButton,
	MobileFeedLine,
	MobileFeedLineMuted,
	MobileFeedMeta,
	MobileTaskActions,
	SectionLead,
} from './index.styles';
import {
	faExternalLinkAlt,
	faBuilding,
	faUsers,
	faScrewdriverWrench,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';

export const SuitesTab: React.FC<SuitesTabProps> = ({ property }) => {
	const navigate = useNavigate();
	const isMobile = useSelector((state: RootState) => state.app.isMobile);

	if (!property?.hasSuites || property?.propertyType !== 'Commercial') {
		return null;
	}

	const columns: Column[] = [
		{
			header: 'Suite Profile',
			key: 'name',
			render: (value: string, row: any) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 250 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24,
								borderRadius: 8,
								background: '#ecfeff',
								color: '#0f766e',
							}}>
							<FontAwesomeIcon icon={faBuilding} />
						</span>
						<strong>{value}</strong>
					</div>
					<div style={{ fontSize: 12, color: '#64748b' }}>
						Commercial maintenance scope for this suite
					</div>
					<button
						type='button'
						onClick={() =>
							navigate(
								`/property/${property.slug}/suite/${row.name
									.replace(/\s+/g, '-')
									.toLowerCase()}`,
							)
						}
						style={{
							border: 'none',
							background: 'transparent',
							color: '#1d4ed8',
							fontWeight: 700,
							cursor: 'pointer',
							padding: 0,
							textAlign: 'left',
							fontSize: 12,
						}}>
						View history
					</button>
				</div>
			),
		},
		{
			header: 'Occupancy',
			key: 'tenants',
			render: (value: any[]) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<FontAwesomeIcon icon={faUsers} color='#0f766e' />
					<span style={{ fontWeight: 700 }}>{(value || []).length}</span>
				</div>
			),
		},
		{
			header: 'Maintenance Activity',
			key: 'deviceIds',
			render: (value: any[]) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0f172a' }}>
						<FontAwesomeIcon icon={faScrewdriverWrench} color='#0f766e' />
						{(value || []).length} linked system{(value || []).length === 1 ? '' : 's'}
					</div>
					<div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
						<FontAwesomeIcon icon={faClockRotateLeft} />
						Timeline updates appear as suite tasks are completed.
					</div>
				</div>
			),
		},
	];

	const actions: Action[] = [
		{
			label: 'View History',
			icon: faExternalLinkAlt,
			onClick: (suite: any) =>
				navigate(
					`/property/${property.slug}/suite/${suite.name
						.replace(/\s+/g, '-')
						.toLowerCase()}`,
				),
		},
	];

	return (
		<SectionContainer>
			<SectionHeader>Commercial Suites</SectionHeader>
			<SectionLead>
				Keep commercial spaces aligned with occupancy and system coverage.
			</SectionLead>
			{property?.suites && property.suites.length > 0 ? (
				isMobile ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
						{property.suites.map((suite: any) => {
							const linkedSystems = (suite.deviceIds || []).length;
							const occupantCount = (suite.tenants || []).length;
							const suiteHref = `/property/${property.slug}/suite/${suite.name
								.replace(/\s+/g, '-')
								.toLowerCase()}`;

							return (
								<DeviceCard key={suite.id || suite.name} onClick={() => navigate(suiteHref)}>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
											<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
												<div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{suite.name}</div>
												<div style={{ fontSize: 12, color: '#64748b' }}>
													Commercial maintenance scope for this suite
												</div>
											</div>
											<span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', whiteSpace: 'nowrap' }}>
												Suite
											</span>
										</div>
										<MobileFeedMeta>
											<MobileFeedLine>
												{occupantCount} occupant{occupantCount === 1 ? '' : 's'}
											</MobileFeedLine>
											<MobileFeedLineMuted>
												{linkedSystems} linked system{linkedSystems === 1 ? '' : 's'}
											</MobileFeedLineMuted>
											<MobileFeedLineMuted>
												Timeline updates appear as suite tasks are completed.
											</MobileFeedLineMuted>
										</MobileFeedMeta>
									</div>
									<MobileTaskActions>
										<MobileActionButton
											variant='primary'
											onClick={(e) => {
												e.stopPropagation();
												navigate(suiteHref);
											}}>
											View history
										</MobileActionButton>
									</MobileTaskActions>
								</DeviceCard>
							);
						})}
					</div>
				) : (
					<DesktopTableWrapper>
						<ReusableTable
							columns={columns}
							rowData={property.suites}
							getRowClassName={(row: any) =>
								((row.deviceIds || []).length === 0 ? 'attention-row' : undefined)
							}
							actions={actions}
							hideHeader={true}
							emptyMessage='No suites yet. Add a suite to begin commercial maintenance tracking.'
						/>
					</DesktopTableWrapper>
				)
			) : (
				<EmptyState>
					<p>No suites added to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
