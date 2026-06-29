import React from 'react';
import { LoginCard } from '../../Components/LoginCard';
import {
	BrandCopy,
	BrandLogo,
	BrandPanel,
	BrandStep,
	BrandSteps,
	FormPanel,
	LoginShell,
	Wrapper,
} from './LoginPage.styles';
import MaintleyLogo from '../../Assets/TitleName.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faHouse,
	faListCheck,
	faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';

export const LoginPage = () => {
	return (
		<Wrapper>
			<LoginShell>
				<BrandPanel>
					<BrandLogo src={MaintleyLogo} alt='Maintley' />
					<BrandCopy>
						<h1>Your home’s maintenance story, kept together.</h1>
						<p>
							Stay organized across properties, systems, maintenance work,
							documents, and the history you will want later.
						</p>
					</BrandCopy>
					<BrandSteps aria-label='Maintley workflow'>
						<BrandStep>
							<span><FontAwesomeIcon icon={faHouse} /></span>
							Organize every property in one place
						</BrandStep>
						<BrandStep>
							<span><FontAwesomeIcon icon={faScrewdriverWrench} /></span>
							Keep systems and service history connected
						</BrandStep>
						<BrandStep>
							<span><FontAwesomeIcon icon={faListCheck} /></span>
							Know what needs attention next
						</BrandStep>
					</BrandSteps>
				</BrandPanel>
				<FormPanel>
					<LoginCard />
				</FormPanel>
			</LoginShell>
		</Wrapper>
	);
};
