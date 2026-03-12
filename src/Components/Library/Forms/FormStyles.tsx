import styled from 'styled-components';
import React, { useState, useRef, useEffect } from 'react';

/**
 * Shared form styled components used across the app
 * Provides consistent form field styling and layout
 */

export const FormGroup = styled.div`
	margin-bottom: 1.25rem;
	width: 100%;
`;

export const FormLabel = styled.label`
	display: block;
	font-weight: 500;
	color: #333;
	margin-bottom: 0.5rem;
	font-size: 14px;

	@media (max-width: 480px) {
		font-size: 15px;
		margin-bottom: 0.625rem;
	}
`;

export const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	transition: all 0.2s ease;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	&::placeholder {
		color: #999;
	}

	@media (max-width: 480px) {
		padding: 0.875rem;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	min-height: 100px;
	resize: vertical;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	&::placeholder {
		color: #999;
	}

	@media (max-width: 480px) {
		padding: 0.875rem;
		font-size: 16px;
		min-height: 120px;
	}
`;

export const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* make selects a bit more compact on tablet/mobile after breakpoint update */
	@media (max-width: 1024px) {
		padding: 0.5rem;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 0.875rem;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const MultiSelectContainer = styled.div`
	position: relative;
	width: 100%;
`;

export const MultiSelectInput = styled.div`
	min-height: 42px;
	padding: 0.5rem 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	flex-wrap: wrap;
	gap: 0.25rem;
	align-items: center;

	&:focus-within {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:hover {
		border-color: #ccc;
	}

	@media (max-width: 1024px) {
		min-height: 36px;
		padding: 0.4rem 0.6rem;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		min-height: 44px;
		padding: 0.625rem 0.75rem;
		font-size: 16px;
	}
`;

export const MultiSelectTag = styled.span`
	background-color: #f3f4f6;
	color: #374151;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 12px;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

export const MultiSelectTagRemove = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0;
	font-size: 14px;
	line-height: 1;

	&:hover {
		color: #374151;
	}
`;

export const MultiSelectPlaceholder = styled.span`
	color: #9ca3af;
	font-size: 14px;
`;

export const MultiSelectDropdown = styled.div<{ isOpen: boolean }>`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background-color: white;
	border: 1px solid #ddd;
	border-radius: 4px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	max-height: 200px;
	overflow-y: auto;
	z-index: 1000;
	display: ${(props) => (props.isOpen ? 'block' : 'none')};
`;

export const MultiSelectOption = styled.div<{ $isSelected: boolean }>`
	padding: 0.5rem 0.75rem;
	cursor: pointer;
	background-color: ${(props) => (props.$isSelected ? '#f3f4f6' : 'white')};
	color: #374151;
	font-size: 14px;

	&:hover {
		background-color: #f9fafb;
	}

	@media (max-width: 480px) {
		padding: 0.75rem;
		font-size: 16px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

interface MultiSelectProps {
	options: { label: string; value: string }[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select options...',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleToggleOption = (optionValue: string) => {
		const newValue = value.includes(optionValue)
			? value.filter((v) => v !== optionValue)
			: [...value, optionValue];
		onChange(newValue);
	};

	const handleRemoveTag = (optionValue: string) => {
		onChange(value.filter((v) => v !== optionValue));
	};

	const selectedOptions = options.filter((option) =>
		value.includes(option.value),
	);

	return (
		<MultiSelectContainer ref={containerRef}>
			<MultiSelectInput onClick={() => setIsOpen(!isOpen)}>
				{selectedOptions.length > 0 ? (
					selectedOptions.map((option) => (
						<MultiSelectTag key={option.value}>
							{option.label}
							<MultiSelectTagRemove
								onClick={(e) => {
									e.stopPropagation();
									handleRemoveTag(option.value);
								}}>
								×
							</MultiSelectTagRemove>
						</MultiSelectTag>
					))
				) : (
					<MultiSelectPlaceholder>{placeholder}</MultiSelectPlaceholder>
				)}
			</MultiSelectInput>

			<MultiSelectDropdown isOpen={isOpen}>
				{options.map((option) => (
					<MultiSelectOption
						key={option.value}
						$isSelected={value.includes(option.value)}
						onClick={(e) => {
							e.stopPropagation();
							handleToggleOption(option.value);
						}}>
						{option.label}
					</MultiSelectOption>
				))}
			</MultiSelectDropdown>
		</MultiSelectContainer>
	);
};

export const FormError = styled.div`
	color: #e74c3c;
	font-size: 14px;
	margin-top: 0.25rem;

	@media (max-width: 480px) {
		font-size: 15px;
		margin-top: 0.375rem;
	}
`;

export const FormHelperText = styled.div`
	color: #666;
	font-size: 13px;
	margin-top: 0.25rem;

	@media (max-width: 480px) {
		font-size: 14px;
		margin-top: 0.375rem;
	}
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1.25rem;
`;

export const FormSection = styled.div`
	margin-bottom: 2rem;
`;

export const FormSectionTitle = styled.h3`
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid #f0f0f0;

	@media (max-width: 480px) {
		font-size: 17px;
		margin-bottom: 1.125rem;
	}
`;
