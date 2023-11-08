import React from 'react';
import {
	ProfilePicture,
	Image,
	Stat,
	StatsWrapper,
	Wrapper,
} from './ProfileCard.styles';

export const ProfileCard = () => {
	const profilePic = require('../../../Assets/images/profilePicture.png');
	return (
		<Wrapper>
			<ProfilePicture>
				<Image src={profilePic} alt='Profile picture' />
			</ProfilePicture>
			<StatsWrapper>
				<Stat>
					<p>
						Total Tasks: <span>10</span>
					</p>
				</Stat>
				<Stat>
					<p>
						Properties Added: <span>2</span>
					</p>
				</Stat>
				<Stat>
					<p>
						Overdue Tasks: <span>10</span>
					</p>
				</Stat>
				<Stat>
					<p>
						My Completed: <span>10</span>
					</p>
				</Stat>
			</StatsWrapper>
		</Wrapper>
	);
};
