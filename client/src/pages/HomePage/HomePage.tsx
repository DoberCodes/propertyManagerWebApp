import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ProfileCard } from '../../Components/Library/ProfileCard';
import { Task, TaskList } from '../../Components/Library/TaskList';
import { Body, Wrapper } from './HomePage.styles';
import { RootState } from '../../Redux/Store';
import { SideNav, TopNav } from '../../Components/Library/Navbar';
// import { setAllTasks, setProperty } from '../../Redux/Slices/propertySlice';

export const HomePage = () => {
	const store_User = useSelector((state: RootState) => state.user.cred);
	// const store_Properties = useSelector((state: RootState) => state.property);
	// const store_Tasks = useSelector(
	// 	(state: RootState) => state.property.AllTasks
	// );
	const tabIndex = useSelector(
		(state: RootState) => state.navigation.tabSelection
	);
	console.info('Homepage states', {
		store_User,
	});

	const [upcomingTasks, setUpcomingTasks]: any = useState([]);
	const [pastTasks, setPastTasks]: any = useState([]);

	console.log('tabIndex', tabIndex);

	// useEffect(() => {
	// 	fetch('http://localhost:5000/properties/' + store_User.UserId, {
	// 		method: 'GET',
	// 	}).then(async (response) => {
	// 		const properties = await response.json();

	// 		console.log('Home Fetch Properties', properties);
	// 		console.log(properties);
	// 		dispatch(setProperty(properties));

	// 		fetch('http://localhost:5000/tasks/' + properties._id, {
	// 			method: 'GET',
	// 		}).then(async (response) => {
	// 			console.log(response);
	// 			const tasks = await response.json();
	// 			// console.log(tasks);
	// 			dispatch(setAllTasks(tasks));
	// 		});
	// 	});
	// }, []);

	// useEffect(() => {
	// 	const today = new Date();
	// 	if (store_Tasks) {
	// 		const upcomingArray: Task[] = [];
	// 		const pastArray: Task[] = [];
	// 		// eslint-disable-next-line array-callback-return
	// 		store_Tasks.map((task: any) => {
	// 			const dueDate = new Date(task.dueDate);
	// 			if (today >= dueDate) {
	// 				upcomingArray.push(task);
	// 			} else {
	// 				pastArray.push(task);
	// 			}
	// 			setPastTasks(pastArray);
	// 			setUpcomingTasks(upcomingArray);
	// 		});
	// 	}
	// }, [store_Tasks]);

	return (
		<div>
			{tabIndex === 1 ? (
				<Wrapper>
					<Body>
						{/* <div>Hello, {store_Properties.HouseholdName}</div> */}
					</Body>
				</Wrapper>
			) : tabIndex === 2 ? (
				<Wrapper>
					<Body>
						<ProfileCard />
					</Body>
				</Wrapper>
			) : (
				<Wrapper>
					<Body>
						<div>Overdue Tasks</div>
						<TaskList taskData={upcomingTasks} />
						<div>Upcoming Tasks (Next 7 Days)</div>
						<TaskList taskData={pastTasks} />
					</Body>
				</Wrapper>
			)}
		</div>
	);
};
