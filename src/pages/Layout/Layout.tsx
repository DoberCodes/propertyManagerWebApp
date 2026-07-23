import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../Redux/store/store';
import {
	SideNav,
	/*MobileNav,*/ TopNav,
} from '../../Components/Library/Navbar';
import { DataLoader } from '../../Components/DataLoader';
import { OnboardingFlow } from '../../Components/OnboardingFlow';
import LegalAgreementNotification from '../../Components/Library/LegalAgreementNotification';
import { PwaInstallBanner } from '../../Components/PwaInstallBanner';
import { Wrapper, Main, Sidebar, Content } from './Layout.styles';
import { Outlet, useLocation } from 'react-router-dom';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { logout, setCurrentUser } from '../../Redux/Slices/userSlice';
import { docToData } from '../../Redux/API/apiSlice';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { shouldBypassOnboarding } from '../../utils/userAccount';

export const Layout = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeTab = useSelector((state: RootState) => state.app.activeTab);
	const dispatch = useDispatch<AppDispatch>();
	const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
	const [updateUser] = useUpdateUserMutation();
	const currentUserRef = useRef(currentUser);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const location = useLocation();

	// Fetch properties to check if user has any
	const { data: ownedProperties = [] } = useGetPropertiesQuery();

	useEffect(() => {
		currentUserRef.current = currentUser;
	}, [currentUser]);

	useEffect(() => {
		contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	}, [location.pathname, location.search, activeTab]);

	useEffect(() => {
		if (!currentUser?.id) {
			return;
		}

		const unsubscribe = onSnapshot(
			doc(db, 'users', currentUser.id),
			async (snapshot) => {
				if (!snapshot.exists()) {
					try {
						await signOut(auth);
					} catch (error) {
						console.warn('Failed to sign out removed user:', error);
					}
					dispatch(logout());
					return;
				}
				const latestUser = currentUserRef.current;
				if (!latestUser) return;

				let userData = docToData(snapshot);
				if (!userData) return;

				if (
					userData.isTeamMemberAccount === true &&
					String(userData.teamMemberId || '').trim()
				) {
					try {
						const teamMemberSnapshot = await getDoc(
							doc(db, 'teamMembers', String(userData.teamMemberId).trim()),
						);
						const teamMemberData = teamMemberSnapshot.exists()
							? docToData(teamMemberSnapshot)
							: null;

						if (teamMemberData) {
							const managedFields = [
								'firstName',
								'lastName',
								'title',
								'phone',
								'address',
								'image',
								'role',
							] as const;
							const syncedFields: Record<string, unknown> = {};

							managedFields.forEach((field) => {
								if (teamMemberData[field] !== undefined) {
									syncedFields[field] = teamMemberData[field];
								}
							});

							if (Object.keys(syncedFields).length > 0) {
								const needsUserDocSync = Object.entries(syncedFields).some(
									([field, value]) => userData[field] !== value,
								);

								userData = {
									...userData,
									...syncedFields,
								};

								if (needsUserDocSync) {
									try {
										await updateDoc(doc(db, 'users', currentUser.id), {
											...syncedFields,
											updatedAt: new Date().toISOString(),
										});
									} catch (syncError) {
										console.warn(
											'Failed to sync team member profile fields from team record:',
											syncError,
										);
									}
								}
							}
						}
					} catch (teamMemberProfileError) {
						console.warn(
							'Failed to hydrate live team member profile:',
							teamMemberProfileError,
						);
					}
				}

				dispatch(
					setCurrentUser({
						...latestUser,
						...userData,
						id: latestUser.id,
						subscription: userData.subscription ?? latestUser.subscription,
					}),
				);
			},
			(error) => {
				console.warn('Failed to listen for profile updates:', error);
			},
		);

		return unsubscribe;
	}, [currentUser?.id, dispatch]);

	useEffect(() => {
		if (currentUser) {
			if (shouldBypassOnboarding(currentUser)) {
				setShowOnboarding(false);
				return;
			}

			if (currentUser.subscription?.pendingCheckoutPlan) {
				setShowOnboarding(false);
				return;
			}

			const userDocumentCompleted = currentUser.onboardingCompleted;

			// User has completed onboarding if either localStorage or user document indicates completion
			const hasCompletedOnboarding = userDocumentCompleted === true;

			// For testing, also show if user has no onboarding completed flag at all
			const shouldShowOnboarding = !hasCompletedOnboarding; // Temporarily always show if not completed

			if (shouldShowOnboarding) {
				setShowOnboarding(true);
			}
		}
	}, [currentUser, ownedProperties.length]);

	const handleOnboardingComplete = async () => {
		if (currentUser) {
			// Update user document in Firestore
			try {
				await updateUser({
					id: currentUser.id,
					updates: { onboardingCompleted: true },
				}).unwrap();

				// Update local Redux state immediately
				dispatch(
					setCurrentUser({
						...currentUser,
						onboardingCompleted: true,
					}),
				);
			} catch (error) {
				console.error('Failed to update onboarding status in database:', error);
			}
		}
		setShowOnboarding(false);
	};

	const handleOnboardingSkip = async () => {
		if (currentUser) {
			// Update user document in Firestore
			try {
				await updateUser({
					id: currentUser.id,
					updates: { onboardingCompleted: true },
				}).unwrap();

				// Update local Redux state immediately
				dispatch(
					setCurrentUser({
						...currentUser,
						onboardingCompleted: true,
					}),
				);
			} catch (error) {
				console.error('Failed to update onboarding status in database:', error);
			}
		}
		setShowOnboarding(false);
	};

	return (
		<>
			<LegalAgreementNotification />
			{showOnboarding && (
				<OnboardingFlow
					onComplete={handleOnboardingComplete}
					onSkip={handleOnboardingSkip}
				/>
			)}
			<Wrapper>
				<DataLoader />
				<TopNav />
				<Main>
					<Sidebar>
						<SideNav />
					</Sidebar>
					<Content ref={contentRef} data-app-scroll-container='true'>
						{!showOnboarding && <PwaInstallBanner />}
						<Outlet />
					</Content>
				</Main>
				{/* <MobileNav /> */}
			</Wrapper>
		</>
	);
};
