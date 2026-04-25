import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export interface TaskSelectOption {
	value: string;
	label: string;
}

interface TaskSelectProps {
	name?: string;
	value: string;
	onChange: (value: string) => void;
	options: TaskSelectOption[];
	placeholder?: string;
	disabled?: boolean;
	id?: string;
}

const Wrap = styled.div`
	position: relative;
	width: 100%;
`;

const Trigger = styled.button<{ $disabled?: boolean }>`
	width: 100%;
	min-height: 44px;
	padding: 0.75rem;
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	background: #ffffff;
	text-align: left;
	font-size: 14px;
	font-family: inherit;
	color: ${COLORS.textPrimary};
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	opacity: ${(props) => (props.$disabled ? 0.65 : 1)};

	&:focus-visible {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover {
		border-color: ${(props) => (props.$disabled ? COLORS.gray300 : COLORS.gray400)};
	}
`;

const ValueText = styled.span<{ $placeholder?: boolean }>`
	color: ${(props) => (props.$placeholder ? COLORS.gray500 : COLORS.textPrimary)};
`;

const Chevron = styled.span<{ $open?: boolean }>`
	font-size: 12px;
	color: ${COLORS.gray500};
	transform: rotate(${(props) => (props.$open ? 180 : 0)}deg);
	transition: transform 0.2s ease;
`;

const Menu = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	left: 0;
	right: 0;
	background: #ffffff;
	border: 1px solid ${COLORS.gray200};
	border-radius: 10px;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
	max-height: 260px;
	overflow-y: auto;
	z-index: 40;
`;

const MenuItem = styled.button<{ $active?: boolean }>`
	width: 100%;
	text-align: left;
	padding: 0.6rem 0.75rem;
	border: none;
	border-bottom: 1px solid ${COLORS.gray100};
	background: ${(props) => (props.$active ? COLORS.primaryLight : '#ffffff')};
	color: ${(props) => (props.$active ? COLORS.primary : COLORS.textPrimary)};
	cursor: pointer;
	font-size: 0.9rem;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: ${COLORS.primaryLight};
		color: ${COLORS.primary};
	}
`;

export const TaskSelect: React.FC<TaskSelectProps> = ({
	name,
	value,
	onChange,
	options,
	placeholder = 'Select an option...',
	disabled,
	id,
}) => {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef<HTMLDivElement | null>(null);

	const selectedLabel = useMemo(() => {
		const selected = options.find((option) => option.value === value);
		return selected?.label || '';
	}, [options, value]);

	useEffect(() => {
		const onClickOutside = (event: MouseEvent) => {
			if (!wrapRef.current) return;
			if (!wrapRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, []);

	return (
		<Wrap ref={wrapRef}>
			<Trigger
				type='button'
				id={id}
				name={name}
				$disabled={disabled}
				disabled={disabled}
				onClick={() => setOpen((prev) => !prev)}>
				<ValueText $placeholder={!selectedLabel}>
					{selectedLabel || placeholder}
				</ValueText>
				<Chevron $open={open}>▼</Chevron>
			</Trigger>
			{open && !disabled && (
				<Menu>
					{options.map((option) => (
						<MenuItem
							type='button'
							key={`${name || 'task-select'}-${option.value}`}
							$active={option.value === value}
							onClick={() => {
								onChange(option.value);
								setOpen(false);
							}}>
							{option.label}
						</MenuItem>
					))}
				</Menu>
			)}
		</Wrap>
	);
};
