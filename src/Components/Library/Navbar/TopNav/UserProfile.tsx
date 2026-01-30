import React, { useState } from 'react';
import {
	UserProfileWrapper,
	UserImage,
	UserInfo,
	UserName,
	UserTitle,
	DropdownMenu,
	DropdownItem,
	DropdownButton,
} from './UserProfile.styles';

interface UserProfileProps {
	userName?: string;
	userTitle?: string;
	userImage?: string;
	onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
	userName = 'John Doe',
	userTitle = 'Administrator',
	userImage,
	onLogout,
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
					<DropdownButton
						onClick={() => {
							setIsOpen(false);
							// Trigger APK download
							const link = document.createElement('a');
							link.href = '/PropertyManager.apk'; // APK location in public folder
							link.download = 'PropertyManager.apk';
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						}}>
						Download Mobile App
					</DropdownButton>
					{onLogout && (
						<DropdownButton
							variant='danger'
							onClick={() => {
								setIsOpen(false);
								onLogout();
							}}>
							Log Out
						</DropdownButton>
					)}
				</DropdownMenu>
			)}
		</UserProfileWrapper>
	);
};
