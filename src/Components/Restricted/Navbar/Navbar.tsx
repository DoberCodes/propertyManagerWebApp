import {
	BottomNav,
	NavItem,
	NavItemWrapper,
	Title,
	TopNav,
	Wrapper,
} from './Navbar.styles';

export const Navbar = () => {
	return (
		<Wrapper>
			<Title>My Property Manager</Title>
			<NavItemWrapper>
				<TopNav>
					<NavItem href='/Settings'>Profile Settings</NavItem>
					<NavItem href='/Manage'>Manage Household</NavItem>
					<NavItem>Log Out</NavItem>
				</TopNav>
				<BottomNav>
					<NavItem href='/Home'>Dashboard</NavItem>
					<NavItem href='/Properties'>Properties</NavItem>
					<NavItem href='/Facts'>FAQs</NavItem>
				</BottomNav>
			</NavItemWrapper>
		</Wrapper>
	);
};
