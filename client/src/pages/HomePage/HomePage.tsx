import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../Components/Library/Card';
import { ProfileCard } from '../../Components/Library/ProfileCard';
import { TaskList } from '../../Components/Library/TaskList';
import { Body, Wrapper } from './HomePage.styles';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../../Components/Library/Navbar';
import { RootState } from '../../Redux/Store';
import { setAllTasks, setProperty } from '../../Redux/Slices/propertySlices';

export const HomePage = () => {
	const dispatch = useDispatch();

	const store_User = useSelector((state: RootState) => state.user.cred);
	const store_Properties = useSelector((state: RootState) => state.property);
	const tasks = useSelector((state: RootState) => state.property.AllTasks);

	console.info('Homepage states', { store_User, store_Properties });

	useEffect(() => {
		fetch('http://localhost:5000/properties/' + store_User.UserId, {
			method: 'GET',
		}).then(async (response) => {
			const properties = await response.json();
			console.log('Home Fetch Properties', properties);
			dispatch(setProperty(properties));
			fetch('http://localhost:5000/tasks/' + properties._id, {
				method: 'GET',
			}).then(async (response) => {
				console.log(response);
				const tasks = await response.json();
				console.log(tasks);
				dispatch(setAllTasks(tasks));
			});
		});
	}, []);

	console.log('All Tasks ', tasks);

	return (
		<Wrapper>
			<Navbar />
			<Body>
				<div>Overdue Tasks</div>
				<TaskList taskData={tasks} />
				<div>Upcoming Tasks (Next 7 Days)</div>
				<TaskList taskData={tasks} />
				<ProfileCard />
			</Body>
		</Wrapper>
	);
};
