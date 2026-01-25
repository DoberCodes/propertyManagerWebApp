import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { HomePage } from './pages/HomePage';
import { Layout } from './Components/Layout';

export const RouterComponent = () => {
	return (
		<Router>
			<Routes>
				<Route
					path='/'
					element={<LandingPage />}
					errorElement={<ErrorPage />}
				/>
				<Route path='login' element={<LoginPage />} />
				<Route path='registration' element={<RegistrationPage />} />
				<Route
					path='property_manager'
					element={
						<ProtectedRoutes>
							<HomePage />
						</ProtectedRoutes>
					}>
					<Route path='dashboard' element={<HomePage />} />
				</Route>
				<Route
					path='*'
					element={
						<ProtectedRoutes>
							<HomePage />
						</ProtectedRoutes>
					}
				/>
			</Routes>
		</Router>
	);
};
