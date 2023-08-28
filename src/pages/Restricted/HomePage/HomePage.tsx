import { Card } from '../../../Components/Restricted/Card';
import { Navbar } from '../../../Components/Restricted/Navbar';
import { ProfileCard } from '../../../Components/Restricted/ProfileCard';
import { TaskList } from '../../../Components/Restricted/TaskList';
import { Body, Wrapper } from './HomePage.styles';

export const HomePage = () => {
	const tasks = [
		{
			id: '10',
			name: 'Change batteries',
			date: new Date(),
		},
	];

	return (
		<Wrapper>
			<Navbar />
			<Body>
				<Card title='Overdue'>
					<TaskList taskData={tasks} />
				</Card>
				<ProfileCard />
				<Card title='Upcoming'>
					<TaskList taskData={tasks} />
				</Card>
			</Body>
		</Wrapper>
	);
};
