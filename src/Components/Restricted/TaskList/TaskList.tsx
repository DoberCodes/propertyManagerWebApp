import { ListItem, Wrapper } from './TaskList.styles';

export interface TaskList {
	taskData: any;
}

export interface Task {
	id: string;
	name: string;
	date: any;
}

export const TaskList = (props: TaskList) => {
	return (
		<Wrapper>
			{props.taskData.map((task: Task) => {
				return (
					<ListItem key={task.id}>{`${task.date} - ${task.name}`}</ListItem>
				);
			})}
		</Wrapper>
	);
};
