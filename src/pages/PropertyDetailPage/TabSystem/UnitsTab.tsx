import React from 'react';
import { UnitsTabProps } from 'types/PropertyDetailPage.types';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	SectionContainer,
	SectionHeader,
} from 'Components/Library/InfoCards/InfoCardStyles';
import { useGetUnitDevicesQuery } from 'Redux/API/deviceSlice';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import {
	EmptyState,
	Toolbar,
	ToolbarButton,
	DesktopTableWrapper,
	DeviceCard,
	MobileTaskActions,
	MobileActionButton,
	MobileActionLinkRow,
	MobileActionLinkButton,
	MobileFeedMeta,
	MobileFeedLine,
	MobileFeedLineMuted,
} from './index.styles';
import { SectionLead } from './index.styles';
import {
	faTrash,
	faExternalLinkAlt,
	faBuilding,
	faUsers,
	faScrewdriverWrench,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';

const UnitDeviceCount: React.FC<{ unitId: string }> = ({ unitId }) => {
	const { data: unitDevices = [] } = useGetUnitDevicesQuery(unitId, {
		skip: !unitId,
	});
	return <>{unitDevices.length}</>;
};

export const UnitsTab: React.FC<UnitsTabProps> = ({
	property,
	units,
	handleCreateUnit,
	handleDeleteUnit,
}) => {
	const navigate = useNavigate();
	const isMobile = useSelector((state: RootState) => state.app.isMobile);

	const handleNavigate = (unit: any) => {
		navigate(
			`/property/${property.slug}/unit/${unit.name
				.replace(/\s+/g, '-')
				.toLowerCase()}`,
		);
	};

	const getUnitPath = (unit: any) =>
		`/property/${property.slug}/unit/${unit.name.replace(/\s+/g, '-').toLowerCase()}`;

	const columns: Column[] = [
		{
			header: 'Unit Profile',
			key: 'name',
			render: (value: string, row: any) => {
				const occupantCount = (row.occupants || []).length;
				return (
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
							{occupantCount} occupant{occupantCount === 1 ? '' : 's'} currently assigned
						</div>
						<button
							type='button'
							onClick={() => navigate(getUnitPath(row))}
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
				);
			},
		},
		{
			header: 'Occupancy',
			key: 'occupants',
			render: (value: any[]) => {
				const count = (value || []).length;
				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<FontAwesomeIcon icon={faUsers} color='#0f766e' />
						<span style={{ fontWeight: 700 }}>{count}</span>
					</div>
				);
			},
		},
		{
			header: 'Continuity Activity',
			key: 'id',
			render: (id: string) => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0f172a' }}>
						<FontAwesomeIcon icon={faScrewdriverWrench} color='#0f766e' />
						<UnitDeviceCount unitId={id} /> linked system
					</div>
					<div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
						<FontAwesomeIcon icon={faClockRotateLeft} />
						Continuity is tracked at unit-level timelines.
					</div>
				</div>
			),
		},
	];

	const actions: Action[] = [
		{
			label: 'View History',
			icon: faExternalLinkAlt,
			onClick: (unit: any) => handleNavigate(unit),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (unit: any) => handleDeleteUnit(unit.id),
			className: 'delete',
		},
	];

	return (
		<SectionContainer>
			<SectionHeader>Units</SectionHeader>
			<SectionLead>
				Monitor occupancy and linked systems for each unit.
			</SectionLead>
			<Toolbar>
				<ToolbarButton onClick={handleCreateUnit}>+ Create Unit</ToolbarButton>
			</Toolbar>

			{isMobile && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
					{units && units.length > 0 ? (
						(units || []).map((unit) => (
							<DeviceCard key={unit.id} onClick={() => handleNavigate(unit)}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
										<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											<div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{unit.name}</div>
											<div style={{ fontSize: 12, color: '#64748b' }}>
												{(unit.occupants || []).length} occupant{(unit.occupants || []).length === 1 ? '' : 's'}
											</div>
										</div>
										<span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', whiteSpace: 'nowrap' }}>
											Unit
										</span>
									</div>
									<MobileFeedMeta>
										<MobileFeedLineMuted>
											{(unit.occupants || []).length} occupant{(unit.occupants || []).length === 1 ? '' : 's'}
										</MobileFeedLineMuted>
										<MobileFeedLine>
											Devices: <strong style={{ color: '#0f172a' }}><UnitDeviceCount unitId={unit.id} /></strong>
										</MobileFeedLine>
									</MobileFeedMeta>
								</div>
								<MobileTaskActions>
									<MobileActionButton
										variant='primary'
										onClick={(e) => {
											e.stopPropagation();
											handleNavigate(unit);
										}}>
										View history
									</MobileActionButton>
									<MobileActionLinkRow>
										<MobileActionLinkButton
											$danger
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteUnit(unit.id);
											}}>
											Delete
										</MobileActionLinkButton>
									</MobileActionLinkRow>
								</MobileTaskActions>
							</DeviceCard>
						))
					) : (
						<EmptyState>
							<p>No units added to this property</p>
						</EmptyState>
					)}
				</div>
			)}

			{/* Desktop table (hidden on mobile) */}
			<DesktopTableWrapper>
				{units && units.length > 0 ? (
					<ReusableTable
						columns={columns}
						rowData={units}
						getRowClassName={(row: any) =>
							((row.occupants || []).length === 0 ? 'attention-row' : undefined)
						}
						actions={actions}
						hideHeader={true}
						emptyMessage='No units yet. Add your first unit to begin occupancy continuity tracking.'
					/>
				) : (
					<EmptyState>
						<p>No units added to this property</p>
					</EmptyState>
				)}
			</DesktopTableWrapper>
		</SectionContainer>
	);
};
