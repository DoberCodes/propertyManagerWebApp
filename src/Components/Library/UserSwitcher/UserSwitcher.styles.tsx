import styled from 'styled-components';

export const Container = styled.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	max-width: 600px;
	margin: 0 auto;
`;

export const Header = styled.div`
	margin-bottom: 1.5rem;
`;

export const Title = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	color: #333;
`;

export const CurrentUserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background-color: #f8f9fa;
	border-radius: 8px;
	margin-bottom: 1rem;
`;

export const UserAvatar = styled.img`
	width: 60px;
	height: 60px;
	border-radius: 50%;
	object-fit: cover;
`;

export const UserDetails = styled.div`
	flex: 1;
`;

export const UserName = styled.div`
	font-size: 1.1rem;
	font-weight: 600;
	color: #333;
	margin-bottom: 0.25rem;
`;

export const UserRole = styled.div`
	font-size: 0.9rem;
	color: #666;
	margin-bottom: 0.5rem;
`;

export const RoleBadge = styled.span<{ color: string }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	background-color: ${(props) => props.color};
	color: white;
	border-radius: 12px;
	font-size: 0.85rem;
	font-weight: 500;
`;

export const Divider = styled.hr`
	border: none;
	border-top: 1px solid #e0e0e0;
	margin: 1.5rem 0;
`;

export const UserList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

export const UserCard = styled.div<{ isActive: boolean }>`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem;
	border: 2px solid ${(props) => (props.isActive ? '#3498db' : '#e0e0e0')};
	border-radius: 8px;
	transition: all 0.2s ease;
	background-color: ${(props) => (props.isActive ? '#f0f8ff' : 'white')};

	&:hover {
		border-color: ${(props) => (props.isActive ? '#3498db' : '#bbb')};
	}
`;

export const UserCardAvatar = styled.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
`;

export const UserCardInfo = styled.div`
	flex: 1;
`;

export const UserCardName = styled.div`
	font-size: 0.95rem;
	font-weight: 600;
	color: #333;
	margin-bottom: 0.25rem;
`;

export const UserCardRole = styled.div<{ color: string }>`
	font-size: 0.85rem;
	color: ${(props) => props.color};
	font-weight: 500;
`;

export const SwitchButton = styled.button`
	padding: 0.5rem 1rem;
	border: none;
	background-color: #3498db;
	color: white;
	border-radius: 4px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #2980b9;
	}
`;
