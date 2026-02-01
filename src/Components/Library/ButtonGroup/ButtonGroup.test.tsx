import React from 'react';
import { render } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup Component', () => {
	it('should render children correctly', () => {
		const { getByText } = render(
			<ButtonGroup>
				<button>Button 1</button>
				<button>Button 2</button>
			</ButtonGroup>,
		);

		expect(getByText('Button 1')).toBeInTheDocument();
		expect(getByText('Button 2')).toBeInTheDocument();
	});

	it('should apply default styles', () => {
		const { container } = render(
			<ButtonGroup>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = container.firstChild as HTMLElement;
		const styles = window.getComputedStyle(buttonGroup);

		expect(styles.display).toBe('flex');
	});

	it('should apply custom gap prop', () => {
		const { container } = render(
			<ButtonGroup gap='20px'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = container.firstChild as HTMLElement;
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply custom justify prop', () => {
		const { container } = render(
			<ButtonGroup justify='center'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = container.firstChild as HTMLElement;
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply custom marginTop prop', () => {
		const { container } = render(
			<ButtonGroup marginTop='24px'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = container.firstChild as HTMLElement;
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply responsive prop', () => {
		const { container } = render(
			<ButtonGroup responsive>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = container.firstChild as HTMLElement;
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should handle multiple props together', () => {
		const { container, getByText } = render(
			<ButtonGroup
				gap='16px'
				justify='space-between'
				marginTop='32px'
				responsive>
				<button>Action 1</button>
				<button>Action 2</button>
				<button>Action 3</button>
			</ButtonGroup>,
		);

		expect(getByText('Action 1')).toBeInTheDocument();
		expect(getByText('Action 2')).toBeInTheDocument();
		expect(getByText('Action 3')).toBeInTheDocument();
		expect(container.firstChild).toBeInTheDocument();
	});

	it('should render without any props', () => {
		const { container } = render(
			<ButtonGroup>
				<button>Default</button>
			</ButtonGroup>,
		);

		expect(container.firstChild).toBeInTheDocument();
	});

	it('should render empty children', () => {
		const { container } = render(<ButtonGroup>{null}</ButtonGroup>);

		expect(container.firstChild).toBeInTheDocument();
	});
});
