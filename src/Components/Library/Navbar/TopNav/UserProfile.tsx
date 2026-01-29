import React, { useState } from 'react';
import {
	UserProfileWrapper,
	UserImage,
	UserInfo,
	UserName,
	UserTitle,
	DropdownMenu,
	DropdownItem,
} from './UserProfile.styles';

interface UserProfileProps {
	userName?: string;
	userTitle?: string;
	userImage?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
	userName = 'John Doe',
	userTitle = 'Administrator',
	userImage,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	console.log('UserProfile: Received props:', {
		userName,
		userTitle,
		userImage,
	});

	return (
		<UserProfileWrapper isOpen={isOpen}>
			<div
				onClick={() => setIsOpen(!isOpen)}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					cursor: 'pointer',
				}}>
				<UserImage src={userImage} alt={userName} />
				<UserInfo>
					<UserName>{userName}</UserName>
					<UserTitle>{userTitle}</UserTitle>
				</UserInfo>
			</div>
			{isOpen && (
				<DropdownMenu>
					<DropdownItem to='/profile'>Edit Profile</DropdownItem>
					<DropdownItem to='/settings'>Settings</DropdownItem>
				</DropdownMenu>
			)}
		</UserProfileWrapper>
	);
};
