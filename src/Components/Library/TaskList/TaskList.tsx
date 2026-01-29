import React from 'react';
import { Wrapper } from './TaskList.styles';

export interface TaskListProps {
	taskData: any;
}

export interface Task {
	id: string;
	name: string;
	date: any;
}

export const TaskList = (props: TaskListProps) => {
	console.log(props);
	const date = props.taskData.dueDate;
	console.log(date);

	return (
		<Wrapper>
			{props.taskData.map((task) => {
				console.log(task);
				return (
					<div>
						<div>{task.taskName}</div>
						<div>{new Date(task.dueDate).toDateString()}</div>
					</div>
				);
			})}
		</Wrapper>
	);
};
