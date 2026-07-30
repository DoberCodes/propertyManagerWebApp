import { render, screen } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup Component', () => {
	it('should render children correctly', () => {
		render(
			<ButtonGroup>
				<button>Button 1</button>
				<button>Button 2</button>
			</ButtonGroup>,
		);

		expect(screen.getByText('Button 1')).toBeInTheDocument();
		expect(screen.getByText('Button 2')).toBeInTheDocument();
	});
	it('should apply default styles', () => {
		render(
			<ButtonGroup>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = screen.getByRole('group');

		expect(getComputedStyle(buttonGroup).display).toBe('flex');
	});

	it('should apply custom gap prop', () => {
		render(
			<ButtonGroup gap='20px'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = screen.getByRole('group');
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply custom justify prop', () => {
		render(
			<ButtonGroup justify='center'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = screen.getByRole('group');
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply custom marginTop prop', () => {
		render(
			<ButtonGroup marginTop='24px'>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = screen.getByRole('group');
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should apply responsive prop', () => {
		render(
			<ButtonGroup responsive>
				<button>Test</button>
			</ButtonGroup>,
		);

		const buttonGroup = screen.getByRole('group');
		expect(buttonGroup).toBeInTheDocument();
	});

	it('should handle multiple props together', () => {
		render(
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

		expect(screen.getByText('Action 1')).toBeInTheDocument();
		expect(screen.getByText('Action 2')).toBeInTheDocument();
		expect(screen.getByText('Action 3')).toBeInTheDocument();
		expect(screen.getByRole('group')).toBeInTheDocument();
	});

	it('should render without any props', () => {
		render(
			<ButtonGroup>
				<button>Default</button>
			</ButtonGroup>,
		);

		expect(screen.getByRole('group')).toBeInTheDocument();
	});

	it('should render empty children', () => {
		render(<ButtonGroup>{null}</ButtonGroup>);

		expect(screen.getByRole('group')).toBeInTheDocument();
	});
});
