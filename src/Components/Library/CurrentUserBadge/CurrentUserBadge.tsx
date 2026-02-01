import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../../../Redux/Store/store';
import { getRoleDisplayName, getRoleColor } from '../../../utils/permissions';
import { UserRole } from '../../../constants/roles';

const Badge = styled.div<{ color: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background-color: ${(props) => props.color};
	color: white;
	border-radius: 20px;
	font-size: 0.9rem;
	font-weight: 500;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Avatar = styled.img`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: 2px solid white;
`;

export const CurrentUserBadge: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	// currentUser guaranteed to exist in protected routes

	return (
		<Badge color={getRoleColor(currentUser!.role as UserRole)}>
			{currentUser!.image && (
				<Avatar src={currentUser!.image} alt={currentUser!.firstName} />
			)}
			<span>
				{currentUser!.firstName} {currentUser!.lastName}
			</span>
			<span style={{ opacity: 0.8, fontSize: '0.85rem' }}>
				({getRoleDisplayName(currentUser!.role as UserRole)})
			</span>
		</Badge>
	);
};
