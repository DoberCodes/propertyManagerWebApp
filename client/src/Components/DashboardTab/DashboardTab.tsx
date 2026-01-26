import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Wrapper,
	TaskGridSection,
	TaskGridHeader,
	TaskGridTitle,
	ActionButton,
	ActionDropdown,
	DropdownItem,
	TableWrapper,
	Table,
	BottomSectionsWrapper,
	Section,
	SectionTitle,
	SectionContent,
} from './DashboardTab.styles';

interface Task {
	id: number;
	task: string;
	dueDate: string;
	status: string;
	property: string;
	notes: string;
	isEditing?: boolean;
}

export const DashboardTab = () => {
	const navigate = useNavigate();
	const [actionMenuOpen, setActionMenuOpen] = useState(false);
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
	const [tasks, setTasks] = useState<Task[]>([
		{
			id: 1,
			task: 'Fix plumbing issue',
			dueDate: '2026-02-10',
			status: 'In Progress',
			property: 'Downtown Apartments',
			notes: 'Check main line',
		},
		{
			id: 2,
			task: 'Paint living room',
			dueDate: '2026-02-15',
			status: 'Not Started',
			property: 'Sunset Heights',
			notes: 'Use light blue color',
		},
		{
			id: 3,
			task: 'Replace HVAC filter',
			dueDate: '2026-02-05',
			status: 'Completed',
			property: 'Oak Street Complex',
			notes: 'Order replacement parts',
		},
	]);

	const handleAddTask = () => {
		const newTask: Task = {
			id: Date.now(),
			task: '',
			dueDate: '',
			status: '',
			property: '',
			notes: '',
			isEditing: true,
		};
		setTasks([...tasks, newTask]);
		setActionMenuOpen(false);
	};

	const handleActionClick = (action: string) => {
		if (action === 'add_task') {
			handleAddTask();
		} else {
			console.log('Action:', action);
			setActionMenuOpen(false);
		}
	};

	const handleCellChange = (
		taskId: number,
		field: keyof Task,
		value: string,
	) => {
		setTasks(
			tasks.map((task) =>
				task.id === taskId ? { ...task, [field]: value } : task,
			),
		);
	};

	const handleCellBlur = (taskId: number) => {
		setTasks(
			tasks.map((task) =>
				task.id === taskId ? { ...task, isEditing: false } : task,
			),
		);
	};

	const handleRowDoubleClick = (taskId: number) => {
		// Navigate to task detail page
		navigate(`/task/${taskId}`);
	};

	const handleRowSelect = (taskId: number) => {
		const newSelected = new Set(selectedRows);
		if (newSelected.has(taskId)) {
			newSelected.delete(taskId);
		} else {
			newSelected.add(taskId);
		}
		setSelectedRows(newSelected);
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const allNonEditingTasks = tasks
				.filter((task) => !task.isEditing)
				.map((task) => task.id);
			setSelectedRows(new Set(allNonEditingTasks));
		} else {
			setSelectedRows(new Set());
		}
	};

	const handleDeleteSelected = () => {
		const filteredTasks = tasks.filter((task) => !selectedRows.has(task.id));
		setTasks(filteredTasks);
		setSelectedRows(new Set());
	};

	return (
		<Wrapper>
			{/* Task Grid Section */}
			<TaskGridSection>
				<TaskGridHeader>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<TaskGridTitle>Tasks</TaskGridTitle>
						{selectedRows.size > 0 && (
							<span style={{ fontSize: '12px', color: '#999999' }}>
								({selectedRows.size} selected)
							</span>
						)}
					</div>
					<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
						<button
							onClick={handleDeleteSelected}
							disabled={selectedRows.size === 0}
							style={{
								backgroundColor: selectedRows.size > 0 ? '#ef4444' : '#d1d5db',
								color: 'white',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								cursor: selectedRows.size > 0 ? 'pointer' : 'not-allowed',
								fontSize: '14px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (selectedRows.size > 0) {
									e.currentTarget.style.backgroundColor = '#dc2626';
								}
							}}
							onMouseLeave={(e) => {
								if (selectedRows.size > 0) {
									e.currentTarget.style.backgroundColor = '#ef4444';
								}
							}}>
							Delete Selected
						</button>
						<div style={{ position: 'relative' }}>
							<ActionButton onClick={() => setActionMenuOpen(!actionMenuOpen)}>
								+
							</ActionButton>
							{actionMenuOpen && (
								<ActionDropdown>
									<DropdownItem onClick={() => handleActionClick('add_column')}>
										Add Column
									</DropdownItem>
									<DropdownItem onClick={() => handleActionClick('assign')}>
										Assign
									</DropdownItem>
									<DropdownItem onClick={() => handleActionClick('add_task')}>
										Add New Task
									</DropdownItem>
								</ActionDropdown>
							)}
						</div>
					</div>
				</TaskGridHeader>
				<TableWrapper>
					<Table>
						<thead>
							<tr>
								<th style={{ width: '40px', textAlign: 'center' }}>
									<input
										type='checkbox'
										ref={(input) => {
											if (input) {
												input.indeterminate =
													selectedRows.size > 0 &&
													!tasks
														.filter((t) => !t.isEditing)
														.every((t) => selectedRows.has(t.id));
											}
										}}
										checked={
											tasks.filter((t) => !t.isEditing).length > 0 &&
											tasks
												.filter((t) => !t.isEditing)
												.every((t) => selectedRows.has(t.id))
										}
										onChange={(e) => handleSelectAll(e.target.checked)}
										style={{ cursor: 'pointer' }}
									/>
								</th>
								<th>Task</th>
								<th>Due Date</th>
								<th>Status</th>
								<th>Property</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{tasks.map((task) => (
								<tr
									key={task.id}
									onDoubleClick={() =>
										!task.isEditing && handleRowDoubleClick(task.id)
									}
									style={{
										cursor: task.isEditing ? 'default' : 'pointer',
										backgroundColor: selectedRows.has(task.id)
											? 'rgba(34, 197, 94, 0.1)'
											: undefined,
									}}>
									<td style={{ textAlign: 'center', width: '40px' }}>
										{!task.isEditing && (
											<input
												type='checkbox'
												checked={selectedRows.has(task.id)}
												onChange={() => handleRowSelect(task.id)}
												style={{ cursor: 'pointer' }}
												onClick={(e) => e.stopPropagation()}
											/>
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.task}
												onChange={(e) =>
													handleCellChange(task.id, 'task', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter task name'
												autoFocus
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.task
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='date'
												value={task.dueDate}
												onChange={(e) =>
													handleCellChange(task.id, 'dueDate', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.dueDate
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.status}
												onChange={(e) =>
													handleCellChange(task.id, 'status', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter status'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.status
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.property}
												onChange={(e) =>
													handleCellChange(task.id, 'property', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter property'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.property
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.notes}
												onChange={(e) =>
													handleCellChange(task.id, 'notes', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter notes'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.notes
										)}
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</TableWrapper>
			</TaskGridSection>

			{/* Bottom Three Sections */}
			<BottomSectionsWrapper>
				<Section>
					<SectionTitle>Notifications</SectionTitle>
					<SectionContent>No new notifications</SectionContent>
				</Section>
				<Section>
					<SectionTitle>Efficiency Chart</SectionTitle>
					<SectionContent>Chart placeholder</SectionContent>
				</Section>
				<Section>
					<SectionTitle>My Team</SectionTitle>
					<SectionContent>Team members will appear here</SectionContent>
				</Section>
			</BottomSectionsWrapper>
		</Wrapper>
	);
};
