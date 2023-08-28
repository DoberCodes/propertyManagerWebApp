import {
	ProfilePicture,
	Stat,
	StatsWrapper,
	Wrapper,
} from './ProfileCard.styles';
// import profile from '../../../Assets/images/profilePicture.jpg';

export const ProfileCard = () => {
	return (
		<Wrapper>
			<ProfilePicture>
				<img
					src={'../../../Assets/images/profilePicture.jpg'}
					alt='Profile picture'
				/>
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
