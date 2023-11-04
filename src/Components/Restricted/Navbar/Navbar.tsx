import {
	BottomNav,
	NavItem,
	NavItemWrapper,
	Title,
	TopNav,
	Wrapper,
} from './Navbar.styles';

export const Navbar = () => {
	const handleLogout = () => {
		console.log('logout');
	};
	return (
		<Wrapper>
			<Title>My Property Manager</Title>
			<NavItemWrapper>
				<TopNav>
					<NavItem to='/property_manager/Settings'>Profile Settings</NavItem>
					<NavItem to='/property_manager/Manage'>Manage Household</NavItem>
					<NavItem to='/' onClick={handleLogout}>
						Log Out
					</NavItem>
				</TopNav>
				<BottomNav>
					<NavItem to='/property_manager/dashboard'>Dashboard</NavItem>
					<NavItem to='/property_manager/Properties'>Properties</NavItem>
					<NavItem to='/property_manager/Facts'>FAQs</NavItem>
				</BottomNav>
			</NavItemWrapper>
		</Wrapper>
	);
};
