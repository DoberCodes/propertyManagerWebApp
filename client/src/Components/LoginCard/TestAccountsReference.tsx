import React, { useState } from 'react';
import styled from 'styled-components';
import { MOCK_USERS } from '../../Redux/Slices/userSlice';
import { getRoleDisplayName } from '../../utils/permissions';

const Container = styled.div`
	background: #f8f9fa;
	border-radius: 8px;
	padding: 1rem;
	margin-top: 1.5rem;
	border: 1px solid #e0e0e0;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;
	cursor: pointer;
	user-select: none;
`;

const Title = styled.h4`
	margin: 0;
	font-size: 0.9rem;
	color: #666;
`;

const ToggleButton = styled.span`
	color: #3498db;
	font-size: 0.85rem;
`;

const AccountList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const AccountItem = styled.div`
	background: white;
	padding: 0.75rem;
	border-radius: 4px;
	font-size: 0.85rem;
	border: 1px solid #e0e0e0;
`;

const Email = styled.div`
	font-weight: 600;
	color: #333;
	margin-bottom: 0.25rem;
`;

const Password = styled.div`
	color: #666;
	font-family: monospace;
`;

const Role = styled.span`
	color: #3498db;
	font-size: 0.8rem;
	margin-left: 0.5rem;
`;

export const TestAccountsReference: React.FC = () => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Container>
			<Header onClick={() => setIsExpanded(!isExpanded)}>
				<Title>🔑 Test Accounts (Development)</Title>
				<ToggleButton>{isExpanded ? 'Hide' : 'Show'}</ToggleButton>
			</Header>
			{isExpanded && (
				<AccountList>
					{MOCK_USERS.map((user) => (
						<AccountItem key={user.id}>
							<Email>
								{user.email}
								<Role>({getRoleDisplayName(user.role)})</Role>
							</Email>
							<Password>Password: {user.role}</Password>
						</AccountItem>
					))}
				</AccountList>
			)}
		</Container>
	);
};
