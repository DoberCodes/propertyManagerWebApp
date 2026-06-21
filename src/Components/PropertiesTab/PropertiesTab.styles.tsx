import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	flex: 1 1 auto;
	padding: 16px;
	margin: 10px 20px;
	justify-content: flex-start;
	min-height: 0;

	@media (max-width: 1024px) {
		padding: 0;
		gap: 15px;
		margin: 0;
	}

	@media (max-width: 480px) {
		padding: 0;
		gap: 12px;
	}
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-radius: 20px;
	gap: 20px;
	padding-bottom: 20px;
	border-bottom: 2px solid #e5e7eb;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 10px;
		padding-bottom: 15px;
		justify-content: center;
		text-align: center;
	}
`;

export const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 24px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
	}
`;

export const TopActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		width: 100%;
		align-items: stretch;
		justify-content: flex-start;
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 8px;
	}
`;

export const DesktopPropertyFilters = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const CompactResultCount = styled.div`
	display: none;
	color: #64748b;
	font-size: 0.8rem;
	font-weight: 700;

	@media (max-width: 1024px) {
		display: block;
		padding-right: 58px;
	}
`;

export const PropertyFilterFields = styled.div`
	display: grid;
	grid-template-columns: minmax(220px, 1.4fr) repeat(2, minmax(170px, 1fr));
	gap: 12px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

export const PropertyFilterField = styled.label`
	display: flex;
	flex-direction: column;
	gap: 6px;
	color: #475569;
	font-size: 12px;
	font-weight: 800;

	> input,
	> select {
		width: 100%;
		max-width: none;
	}
`;

export const PropertyFilterSelect = styled.select`
	width: 100%;
	min-height: 42px;
	padding: 8px 12px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	background: #ffffff;
	color: #0f172a;
	font: inherit;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
	}
`;

export const SummaryStatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(140px, 1fr));
	gap: 14px;

	@media (max-width: 1200px) {
		grid-template-columns: repeat(2, minmax(140px, 1fr));
	}

	@media (max-width: 640px) {
		display: none;
	}
`;

export const SummaryCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 14px 16px;
	display: flex;
	align-items: center;
	gap: 12px;
	box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
`;

export const SummaryIcon = styled.div<{ $bg: string; $color: string }>`
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $bg }) => $bg};
	color: ${({ $color }) => $color};
	font-size: 16px;
`;

export const SummaryValue = styled.div`
	font-size: 22px;
	font-weight: 700;
	line-height: 1;
	color: #111827;
`;

export const SummaryLabel = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: #4b5563;
	margin-top: 4px;
`;

export const GroupsContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: fit-content;
	padding-bottom: max(24px, calc(var(--mobile-bottom-nav-offset, 0px) + 24px));
	gap: 22px;
	flex: 1;
	align-items: start;

	@media (max-width: 1024px) {
		gap: 20px;
		padding-bottom: calc(var(--mobile-bottom-nav-offset, 0px) + 28px);
	}

	@media (max-width: 480px) {
		gap: 20px;
		align-items: stretch;
		padding-bottom: calc(var(--mobile-bottom-nav-offset, 0px) + 24px);
	}
`;

export const GroupSection = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
	background: transparent;
	border: none;
	border-radius: 0;
	padding: 0;
	box-shadow: none;

	@media (max-width: 480px) {
		gap: 15px;
		align-items: stretch;
		width: 100%;
		max-width: none;
		margin: 0 auto;
	}
`;

export const GroupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	flex-wrap: wrap;
	padding: 0;
	background-color: transparent;
	border-radius: 0;
	box-shadow: none;
	margin-bottom: 0;

	> div:first-child {
		min-width: 0;
	}

	@media (max-width: 1024px) {
		padding: 12px 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
		justify-content: space-between;
		align-items: center;
		flex-wrap: nowrap;
		width: 100%;
	}
`;

export const GroupName = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	flex: 1;
	cursor: default;
	padding: 0;
	border-radius: 0;

	@media (max-width: 1024px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 0;
		min-width: 0;
	}
`;

export const GroupTitleBlock = styled.div`
	display: grid;
	gap: 2px;
	min-width: 0;
`;

export const GroupIconBadge = styled.span<{
	$background: string;
	$color: string;
}>`
	width: 38px;
	height: 38px;
	flex: 0 0 38px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $background }) => $background};
	color: ${({ $color }) => $color};
	box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);

	@media (max-width: 480px) {
		width: 34px;
		height: 34px;
		flex-basis: 34px;
		font-size: 13px;
	}
`;

export const GroupDescription = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 12px;
	line-height: 1.35;
	max-width: 680px;

	@media (max-width: 480px) {
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: min(62vw, 320px);
	}
`;

export const GroupCountBadge = styled.span`
	margin-left: 8px;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	background: #ecfdf3;
	color: #047857;
`;

export const GroupNameInput = styled.input`
	font-size: 20px;
	font-weight: 600;
	color: black;
	border: 2px solid #22c55e;
	border-radius: 4px;
	padding: 8px 12px;
	font-family: inherit;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #16a34a;
	}

	@media (max-width: 1024px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 6px 10px;
	}
`;

export const HeaderRight = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 5px;
		width: auto;
		margin-left: auto;
		flex: 0 0 auto;
		justify-content: flex-end;
	}
`;

export const GroupActions = styled.div`
	position: relative;
	display: flex;
	gap: 8px;
	align-items: center;

	@media (max-width: 480px) {
		gap: 6px;
	}
`;

export const GroupActionButton = styled.button`
	background: transparent;
	border: none;
	color: #6b7280;
	font-size: 18px;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: #22c55e;
	}

	@media (max-width: 1024px) {
		font-size: 16px;
		width: 28px;
		height: 28px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		width: auto;
		height: auto;
		padding: 2px 4px;
	}
`;

export const AddPropertyButton = styled.button<{ disabled?: boolean }>`
	background-color: #22c55e;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	white-space: nowrap;

	&:hover {
		background-color: #16a34a;
	}

	&:active {
		background-color: #15803d;
	}

	&:disabled {
		background-color: #d1d5db; /* Light gray background for disabled state */
		color: #9ca3af; /* Gray text for disabled state */
		cursor: not-allowed; /* Change cursor to indicate disabled state */
		opacity: 0.6; /* Reduce opacity for visual feedback */
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		flex: 1;
	}

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const PropertiesGrid = styled.div<{
	$isHomeowner?: boolean;
	$singleProperty?: boolean;
}>`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 18px;
	margin-top: 2px;
	justify-items: center;

	${({ $isHomeowner, $singleProperty }) =>
		$isHomeowner && $singleProperty
			? `
		justify-items: center;
		grid-template-columns: 340px;
		max-width: 340px;
		margin: 8px auto 0;
	`
			: ''}

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
		gap: 18px;
		justify-items: center;

		${({ $isHomeowner, $singleProperty }) =>
		$isHomeowner && $singleProperty
			? `
			grid-template-columns: 300px;
			max-width: 300px;
		`
			: ''}
	}

	@media (max-width: 600px) {
		grid-template-columns: 1fr;
		gap: 14px;
		justify-items: stretch;
		align-items: start;
		padding: 0;

		${({ $isHomeowner, $singleProperty }) =>
		$isHomeowner && $singleProperty
			? `
			grid-template-columns: 1fr;
			width: 100%;
			max-width: none;
		`
			: ''}
	}
`;

export const AddPropertyTile = styled.button`
	border: 1px dashed #cbd5e1;
	border-radius: 10px;
	background: #f8fafc;
	width: 100%;
	min-height: 180px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	cursor: pointer;
	color: #475569;
	transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;

	&:hover {
		border-color: #94a3b8;
		background: #f1f5f9;
		color: #0f172a;
	}
`;

export const AddPropertyTileIcon = styled.div`
	width: 34px;
	height: 34px;
	border-radius: 999px;
	border: 1px solid #cbd5e1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 700;
`;

export const AddPropertyTileTitle = styled.div`
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
`;

export const AddPropertyTileHint = styled.div`
	font-size: 12px;
	color: #64748b;
	text-align: center;
	max-width: 180px;
`;

export const PropertyTile = styled.div`
	position: relative;
	border-radius: 16px;
	overflow: hidden;
	cursor: pointer;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	max-width: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
	}

	@media (max-width: 1024px) {
		min-height: 250px;
	}

`;

export const PropertyImageWrap = styled.div`
	position: relative;
	height: 145px;
	overflow: hidden;

	@media (max-width: 600px) {
		height: 136px;
	}
`;

export const PropertyImage = styled.img<{ $isFallback?: boolean }>`
	width: 100%;
	height: 100%;
	object-fit: ${({ $isFallback }) => ($isFallback ? 'contain' : 'cover')};
	padding: ${({ $isFallback }) => ($isFallback ? '4px' : '0')};
	background: ${({ $isFallback }) => ($isFallback ? '#f3f6f9' : 'transparent')};
`;

export const PropertyTopBadge = styled.button`
	position: absolute;
	top: 12px;
	left: 12px;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	border: none;
	background: #0f7a4f;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
	z-index: 2;
	cursor: pointer;
`;

export const PropertyTopMenu = styled.div`
	position: absolute;
	top: 12px;
	right: 12px;
	z-index: 2;
`;

export const PropertyBody = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 12px;
	align-items: flex-start;
	padding: 14px 16px 10px;
`;

export const PropertyAddress = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 6px;
	margin-top: 4px;
	font-size: 12px;
	line-height: 1.35;
	color: #6b7280;

	span {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
`;

export const PropertyLabelBadge = styled.span`
	white-space: nowrap;
	align-self: flex-start;
	padding: 6px 10px;
	border-radius: 999px;
	background: #ecfdf3;
	color: #15803d;
	font-size: 11px;
	font-weight: 700;
`;

export const PropertyMetaRow = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
	padding: 0 16px 14px;
	border-top: 1px solid #f1f5f9;
	padding-top: 12px;

	@media (max-width: 600px) {
		grid-template-columns: 1fr;
	}
`;

export const PropertyMetaItem = styled.div<{ $color?: string }>`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: ${({ $color }) => $color || '#6b7280'};
`;

export const PropertyMetaText = styled.span`
	color: inherit;

	strong {
		font-weight: 700;
	}
`;

export const FavoriteStar = styled.button`
	display: none;

	&:hover {
		transform: none;
	}

	&:active {
		transform: none;
	}
`;

export const PropertyTitle = styled.a`
	font-size: 22px;
	font-weight: 600;
	color: #111827;
	text-decoration: none;
	cursor: pointer;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.9;
		text-decoration: underline;
	}

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const DropdownToggle = styled.button`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	color: #4b5563;
	font-size: 16px;
	cursor: pointer;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	transition: background-color 0.2s ease, border-color 0.2s ease;
	display: inline-flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: #f8fafc;
		border-color: #cbd5e1;
	}
`;

export const DropdownMenu = styled.div`
	position: absolute;
	top: 40px;
	right: 16px;
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 100;
	min-width: 120px;
	overflow: hidden;
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	background: none;
	border: none;
	color: black;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: #f5f5f5;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 12px;
	}
`;

export const AddGroupContainer = styled.div`
	display: none; /* replaced by PageHeader + TopActions */
`;

export const AddGroupButton = styled.button`
	background-color: #d1d5db;
	color: #666666;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease;

	&:hover {
		background-color: #b6b9c1;
		color: #4b5563;
	}

	&:active {
		background-color: #a0a5b3;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		width: 100%;
	}
`;

export const PageSubtitle = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 4px 0 0 0;
	font-weight: 400;
	line-height: 1.45;

	@media (max-width: 768px) {
		max-width: 32rem;
	}
`;

export const SearchBar = styled.input`
	flex: 1;
	max-width: 300px;
	padding: 8px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	font-size: 14px;
	background-color: #f9fafb;
	transition: border-color 0.2s ease, background-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #22c55e;
		background-color: white;
	}

	@media (max-width: 768px) {
		order: 1;
		flex: 1 0 100%;
		width: 100%;
		max-width: none;
		min-height: 44px;
		font-size: 16px;
	}

	@media (max-width: 480px) {
		max-width: 100%;
	}
`;

export const FilterSortContainer = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;

	@media (max-width: 768px) {
		order: 3;
		flex: 1 1 0;
		min-width: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: stretch;
	}
`;

export const FilterButton = styled.button<{ $isActive?: boolean }>`
	padding: 8px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	background-color: ${({ $isActive }) => ($isActive ? '#22c55e' : '#f9fafb')};
	color: ${({ $isActive }) => ($isActive ? 'white' : '#6b7280')};
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: #22c55e;
		background-color: ${({ $isActive }) => ($isActive ? '#16a34a' : '#f0fdf4')};
	}

	@media (max-width: 480px) {
		padding: 6px 10px;
		font-size: 12px;
	}

	@media (max-width: 768px) {
		width: 100%;
		min-height: 44px;
		border-radius: 8px;
		font-size: 14px;
	}
`;

export const SortButton = styled.button`
	padding: 8px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	background-color: #f9fafb;
	color: #6b7280;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		border-color: #22c55e;
		background-color: #f0fdf4;
	}

	@media (max-width: 480px) {
		padding: 6px 10px;
		font-size: 12px;
	}

	@media (max-width: 768px) {
		width: 100%;
		min-height: 44px;
		justify-content: center;
		border-radius: 8px;
		font-size: 14px;
	}
`;

export const PageHeaderRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 20px;
	margin-bottom: 16px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 12px;
	}

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: center;
	}
`;

export const HeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const HeaderControls = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		width: 100%;
		justify-content: center;
	}
`;

export const AddToGroupButton = styled.button`
	padding: 6px 12px;
	border: 1px solid #22c55e;
	border-radius: 6px;
	background-color: white;
	color: #22c55e;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #f0fdf4;
	}

	@media (max-width: 480px) {
		padding: 5px 10px;
		font-size: 11px;
	}
`;

export const GroupActionMenu = styled.button`
	padding: 4px 8px;
	background: none;
	border: none;
	color: #9ca3af;
	font-size: 18px;
	cursor: pointer;
	transition: color 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #22c55e;
	}

	@media (max-width: 480px) {
		width: 36px;
		height: 36px;
		padding: 0;
	}
`;

export const CollapseToggle = styled.button`
	padding: 4px 8px;
	background: none;
	border: none;
	color: #9ca3af;
	font-size: 16px;
	cursor: pointer;
	transition: color 0.2s ease, transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #22c55e;
	}
`;

export const GroupCollapsed = styled.div`
	display: none;
`;

export const SummarySubtitle = styled.span`
	font-size: 11px;
	color: #6b7280;
	display: block;
	margin-top: 2px;
	font-weight: 400;
`;

export const HeaderMenuWrap = styled.div`
	position: relative;
	display: flex;
	align-items: center;

	@media (max-width: 768px) {
		order: 4;
		flex: 0 0 48px;
		align-self: stretch;
	}
`;

export const HeaderMenuButton = styled.button`
	height: 40px;
	min-width: 40px;
	padding: 0 10px;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	background: #ffffff;
	color: #4b5563;
	font-size: 20px;
	line-height: 1;
	cursor: pointer;
	transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;

	&:hover {
		border-color: #cbd5e1;
		background: #f8fafc;
		color: #1f2937;
	}

	@media (max-width: 768px) {
		width: 100%;
		height: 44px;
		border-radius: 8px;
	}
`;

export const HeaderDropdownMenu = styled.div`
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	width: 280px;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
	overflow: hidden;
	z-index: 220;

	@media (max-width: 480px) {
		left: 0;
		width: min(280px, calc(100vw - 32px));
	}
`;

export const HeaderDropdownItem = styled.button`
	width: 100%;
	border: none;
	background: #ffffff;
	padding: 12px 14px;
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	border-bottom: 1px solid #f1f5f9;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: #f8fafc;
	}
`;

export const HeaderDropdownIcon = styled.span`
	width: 18px;
	min-width: 18px;
	margin-top: 2px;
	color: #4b5563;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

export const HeaderDropdownTitle = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: #111827;
`;

export const HeaderDropdownHint = styled.span`
	display: block;
	font-size: 12px;
	color: #6b7280;
`;

export const ManageGroupsStack = styled.div`
	display: grid;
	gap: 14px;
`;

export const ManageGroupsToolbar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;

	@media (max-width: 600px) {
		align-items: flex-start;
		flex-direction: column;

		button {
			width: 100%;
		}
	}
`;

export const ManageGroupList = styled.div`
	display: grid;
	gap: 10px;
`;

export const ManageGroupRow = styled.div<{ $dragging?: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: ${({ $dragging }) => ($dragging ? '#f0fdf4' : '#ffffff')};
	opacity: ${({ $dragging }) => ($dragging ? 0.65 : 1)};
	box-shadow: ${({ $dragging }) =>
		$dragging ? '0 10px 24px rgba(15, 23, 42, 0.12)' : 'none'};
	transition: border-color 140ms ease, box-shadow 140ms ease,
		background-color 140ms ease;

	&:hover {
		border-color: #a7f3d0;
		box-shadow: 0 6px 18px rgba(15, 23, 42, 0.07);
	}
`;

export const ManageGroupDragHandle = styled.div`
	width: 36px;
	height: 44px;
	flex: 0 0 36px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	cursor: grab;
	touch-action: none;

	&:active {
		cursor: grabbing;
	}
`;

export const ManageGroupPreview = styled.div`
	flex: 1;
	min-width: 0;
	display: grid;
	gap: 3px;

	strong {
		color: #0f172a;
		font-size: 14px;
	}

	span {
		color: #64748b;
		font-size: 12px;
		line-height: 1.35;
	}
`;

export const ManageGroupRowActions = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	flex: 0 0 auto;

	> button:not(:last-child) {
		width: 34px;
		height: 34px;
		padding: 0;
	}
`;

export const ManageGroupMenuWrap = styled.div`
	position: relative;
`;

export const ManageGroupMenuButton = styled.button`
	width: 40px;
	height: 40px;
	border: none;
	border-radius: 10px;
	background: transparent;
	color: #475569;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
	}
`;

export const ManageGroupMenu = styled.div`
	position: absolute;
	right: 0;
	top: calc(100% + 6px);
	width: 210px;
	z-index: 20;
	padding: 6px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;
	box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16);
`;

export const ManageGroupMenuItem = styled.button<{ $danger?: boolean }>`
	width: 100%;
	border: none;
	border-radius: 8px;
	padding: 10px 11px;
	background: transparent;
	color: ${({ $danger }) => ($danger ? '#b91c1c' : '#334155')};
	text-align: left;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f8fafc')};
	}
`;

export const ManageGroupPanel = styled.div`
	display: grid;
	gap: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 14px;
	background: #ffffff;

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

export const ManageGroupPanelHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;

	> div:not(:first-child) {
		min-width: 0;
	}

	h4 {
		margin: 0;
		color: #0f172a;
		font-size: 15px;
	}

	p {
		margin: 3px 0 0;
		color: #64748b;
		font-size: 12px;
	}
`;

export const ManageGroupAppearancePreview = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #f8fafc;

	> div {
		min-width: 0;
	}

	strong {
		display: block;
		color: #0f172a;
		font-size: 14px;
	}

	> div > span {
		display: block;
		color: #64748b;
		font-size: 12px;
	}

	@media (max-width: 600px) {
		position: sticky;
		top: 0;
		z-index: 3;
		box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
	}
`;

export const PropertyTransferList = styled.div`
	display: grid;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	max-height: min(240px, 32vh);
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
	background: #ffffff;

	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: #f8fafc;
		border-radius: 999px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 999px;
	}

	@media (max-width: 600px) {
		max-height: min(200px, 28vh);
	}
`;

export const PropertyTransferRow = styled.div`
	display: flex;
	align-items: center;
	gap: 9px;
	padding: 9px 10px;
	border-bottom: 1px solid #f1f5f9;
	cursor: pointer;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: #f8fafc;
	}
`;

export const PropertyTransferName = styled.div`
	min-width: 0;

	strong {
		display: block;
		color: #0f172a;
		font-size: 13px;
	}

	span {
		display: block;
		color: #64748b;
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

export const PropertyTransferToolbar = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 8px;
	align-items: center;

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

export const PropertyTransferSelectionBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	flex-wrap: wrap;
	font-size: 12px;
	color: #64748b;

	button {
		border: none;
		background: transparent;
		color: #0f766e;
		font-weight: 700;
		cursor: pointer;
		padding: 4px;
	}
`;

export const SelectedTransferActions = styled.div`
	display: grid;
	grid-template-columns: minmax(160px, 1fr) auto;
	gap: 8px;

	@media (max-width: 560px) {
		grid-template-columns: 1fr;

		button {
			width: 100%;
			min-height: 44px;
		}
	}
`;

export const BulkTransferActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	@media (max-width: 600px) {
		flex-direction: column;

		button {
			width: 100%;
			min-height: 44px;
		}
	}
`;
