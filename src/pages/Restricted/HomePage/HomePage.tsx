import { useSelector } from 'react-redux';
import { Card } from '../../../Components/Restricted/Card';
import { ProfileCard } from '../../../Components/Restricted/ProfileCard';
import { TaskList } from '../../../Components/Restricted/TaskList';
import { Body, Wrapper } from './HomePage.styles';

export const HomePage = (props: any) => {
	const user = useSelector((state) => state);
	console.log(user);
	console.log('user', props.location.state);
	const tasks = [
		{
			id: '10',
			name: 'Change batteries',
			date: new Date(),
		},
	];

	return (
		<Wrapper>
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
