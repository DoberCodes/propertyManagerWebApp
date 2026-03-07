import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../Redux/store/store';
import { useUpdateUserMutation } from '../../../Redux/API/userSlice';
import { setCurrentUser } from '../../../Redux/Slices/userSlice';
import DocumentViewer from '../../DocumentViewer';
import { COLORS } from '../../../constants/colors';
import {
	LEGAL_AGREEMENT_VERSION,
	LEGAL_DOCUMENT_KEYS,
	createLegalAgreementDocuments,
} from '../../../constants/legal';

const NotificationWrapper = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	backdrop-filter: blur(3px);
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	animation: fadeIn 0.3s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 1024px) {
		padding: 1rem;
	}

	@media (max-width: 480px) {
		padding: 0.5rem;
	}
`;

const NotificationCard = styled.div`
	background: white;
	border-radius: 12px;
	max-width: 600px;
	width: 100%;
	max-height: 85vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	animation: slideUp 0.3s ease-out;

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 1024px) {
		max-width: 95%;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		max-width: 95%;
		max-height: 82vh;
	}
`;

const NotificationHeader = styled.div`
	padding: 24px;
	border-bottom: 2px solid ${COLORS.primaryLight};
	background: linear-gradient(
		135deg,
		${COLORS.primaryLight} 0%,
		rgba(16, 185, 129, 0.05) 100%
	);
`;

const NotificationTitle = styled.h2`
	margin: 0 0 8px 0;
	font-size: 24px;
	font-weight: 700;
	color: ${COLORS.primaryDark};
`;

const NotificationSubtitle = styled.p`
	margin: 0;
	font-size: 14px;
	color: #64748b;
	line-height: 1.5;
`;

const NotificationBody = styled.div`
	padding: 24px;
	flex: 1;
	overflow-y: auto;
`;

const WarningBox = styled.div`
	padding: 16px;
	background: #fef3c7;
	border: 2px solid #fbbf24;
	border-radius: 8px;
	margin-bottom: 20px;
`;

const WarningText = styled.p`
	margin: 0;
	font-size: 14px;
	color: #92400e;
	line-height: 1.5;
	font-weight: 600;
`;

const ErrorMessage = styled.div`
	margin-bottom: 16px;
	padding: 12px 16px;
	border-radius: 8px;
	background: #fee2e2;
	color: #b91c1c;
	font-size: 14px;
	border-left: 4px solid #dc2626;
`;

const LegalSection = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
	margin-bottom: 16px;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}
`;

const SelectAllRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
	margin-bottom: 16px;
`;

const SelectAllLabel = styled.label`
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
	cursor: pointer;
`;

const LegalCheckbox = styled.input`
	margin-top: 4px;
	flex-shrink: 0;
	width: 18px;
	height: 18px;
	cursor: pointer;
`;

const LegalContent = styled.div`
	flex: 1;
`;

const LegalTitle = styled.h3`
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
	color: #0f172a;
`;

const LegalDescription = styled.p`
	margin: 0 0 10px 0;
	font-size: 14px;
	color: #64748b;
	line-height: 1.5;
`;

const ViewLink = styled.button`
	background: none;
	border: none;
	color: ${COLORS.primary};
	text-decoration: underline;
	cursor: pointer;
	font-size: 14px;
	padding: 0;
	font-weight: 500;
	transition: color 0.2s ease;

	&:hover {
		color: ${COLORS.primaryDark};
	}
`;

const NotificationFooter = styled.div`
	padding: 20px 24px;
	border-top: 1px solid #e2e8f0;
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	background: #f9fafb;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 12px 24px;
	border-radius: 8px;
	font-size: 15px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	white-space: nowrap;

	${(props) =>
		props.variant === 'primary'
			? `
		background: ${COLORS.primary};
		color: white;
		&:hover:not(:disabled) {
			background: ${COLORS.primaryDark};
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
		}
	`
			: `
		background: #e2e8f0;
		color: #475569;
		&:hover:not(:disabled) {
			background: #cbd5e1;
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

interface LegalAgreementNotificationProps {
	onDismiss?: () => void;
}

export const LegalAgreementNotification: React.FC<
	LegalAgreementNotificationProps
> = ({ onDismiss }) => {
	const [show, setShow] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
	const [acceptedMaintenance, setAcceptedMaintenance] = useState(false);
	const [acceptedSubscriptionTerms, setAcceptedSubscriptionTerms] =
		useState(false);
	const [acceptedEula, setAcceptedEula] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);
	const [error, setError] = useState('');

	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch();
	const [updateUser, { isLoading }] = useUpdateUserMutation();

	useEffect(() => {
		if (!currentUser) {
			setShow(false);
			return;
		}

		const docs = currentUser.legalAgreement?.documents;
		const hasAcceptedAllDocuments =
			docs?.[LEGAL_DOCUMENT_KEYS.termsOfService]?.accepted &&
			docs?.[LEGAL_DOCUMENT_KEYS.termsOfService]?.agreedVersion ===
				LEGAL_AGREEMENT_VERSION &&
			docs?.[LEGAL_DOCUMENT_KEYS.privacyPolicy]?.accepted &&
			docs?.[LEGAL_DOCUMENT_KEYS.privacyPolicy]?.agreedVersion ===
				LEGAL_AGREEMENT_VERSION &&
			docs?.[LEGAL_DOCUMENT_KEYS.maintenanceDisclaimer]?.accepted &&
			docs?.[LEGAL_DOCUMENT_KEYS.maintenanceDisclaimer]?.agreedVersion ===
				LEGAL_AGREEMENT_VERSION &&
			docs?.[LEGAL_DOCUMENT_KEYS.subscriptionTerms]?.accepted &&
			docs?.[LEGAL_DOCUMENT_KEYS.subscriptionTerms]?.agreedVersion ===
				LEGAL_AGREEMENT_VERSION &&
			docs?.[LEGAL_DOCUMENT_KEYS.eula]?.accepted &&
			docs?.[LEGAL_DOCUMENT_KEYS.eula]?.agreedVersion ===
				LEGAL_AGREEMENT_VERSION;

		// Check if user needs to accept legal documents
		const needsToAccept =
			!currentUser.legalAgreement?.agreedToTerms ||
			currentUser.legalAgreement?.agreedVersion !== LEGAL_AGREEMENT_VERSION ||
			!hasAcceptedAllDocuments;

		setShow(needsToAccept);
	}, [currentUser]);

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseDocumentViewer = () => {
		setSelectedDocument(null);
	};

	const handleCancel = () => {
		const confirmed = window.confirm(
			'You must accept the legal documents to continue using Maintley without interruption of service.\n\nAre you sure you want to cancel?',
		);
		if (!confirmed) {
			return;
		}
		setShow(false);
		onDismiss?.();
	};

	const handleAccept = async () => {
		setError('');

		if (
			!acceptedTerms ||
			!acceptedPrivacy ||
			!acceptedMaintenance ||
			!acceptedSubscriptionTerms ||
			!acceptedEula
		) {
			setError('Please accept all legal documents to continue.');
			return;
		}

		if (!currentUser) {
			setError('User not found. Please refresh and try again.');
			return;
		}

		const agreedAt = new Date().toISOString();
		const documents = createLegalAgreementDocuments(agreedAt);

		try {
			await updateUser({
				id: currentUser.id,
				updates: {
					legalAgreement: {
						agreedToTerms: true,
						agreedVersion: LEGAL_AGREEMENT_VERSION,
						agreedAt,
						documents,
					},
				},
			}).unwrap();

			// Update Redux store
			dispatch(
				setCurrentUser({
					...currentUser,
					legalAgreement: {
						agreedToTerms: true,
						agreedVersion: LEGAL_AGREEMENT_VERSION,
						agreedAt,
						documents,
					},
				}),
			);

			setShow(false);
			onDismiss?.();
		} catch (err: any) {
			setError(err.message || 'Failed to accept legal documents');
		}
	};

	const handleToggleSelectAll = (checked: boolean) => {
		setAcceptedTerms(checked);
		setAcceptedPrivacy(checked);
		setAcceptedMaintenance(checked);
		setAcceptedSubscriptionTerms(checked);
		setAcceptedEula(checked);
		setError('');
	};

	if (!show) {
		return null;
	}

	const allAccepted =
		acceptedTerms &&
		acceptedPrivacy &&
		acceptedMaintenance &&
		acceptedSubscriptionTerms &&
		acceptedEula;

	return (
		<NotificationWrapper>
			<NotificationCard>
				<NotificationHeader>
					<NotificationTitle>📝 Legal Documents Required</NotificationTitle>
					<NotificationSubtitle>
						Please review and accept our legal documents to continue using
						Maintley
					</NotificationSubtitle>
				</NotificationHeader>

				<NotificationBody>
					<WarningBox>
						<WarningText>
							⚠️ You must accept these documents to avoid any interruption of
							service.
						</WarningText>
					</WarningBox>

					{error && <ErrorMessage>{error}</ErrorMessage>}

					<SelectAllRow>
						<LegalCheckbox
							type='checkbox'
							id='select-all-legal-docs'
							checked={allAccepted}
							onChange={(e) => handleToggleSelectAll(e.target.checked)}
						/>
						<SelectAllLabel htmlFor='select-all-legal-docs'>
							Select all legal documents
						</SelectAllLabel>
					</SelectAllRow>

					<LegalSection>
						<LegalCheckbox
							type='checkbox'
							checked={acceptedTerms}
							onChange={(e) => {
								setAcceptedTerms(e.target.checked);
								setError('');
							}}
						/>
						<LegalContent>
							<LegalTitle>Terms of Service</LegalTitle>
							<LegalDescription>
								I agree to the terms of service that govern the use of Maintley
								and understand my rights and responsibilities as a user.
							</LegalDescription>
							<ViewLink
								onClick={() =>
									handleViewDocument('terms-of-service', 'Terms of Service')
								}>
								View Terms of Service →
							</ViewLink>
						</LegalContent>
					</LegalSection>

					<LegalSection>
						<LegalCheckbox
							type='checkbox'
							checked={acceptedPrivacy}
							onChange={(e) => {
								setAcceptedPrivacy(e.target.checked);
								setError('');
							}}
						/>
						<LegalContent>
							<LegalTitle>Privacy Policy</LegalTitle>
							<LegalDescription>
								I acknowledge and agree to the privacy policy regarding how my
								data is collected, used, and protected.
							</LegalDescription>
							<ViewLink
								onClick={() =>
									handleViewDocument('privacy-policy', 'Privacy Policy')
								}>
								View Privacy Policy →
							</ViewLink>
						</LegalContent>
					</LegalSection>

					<LegalSection>
						<LegalCheckbox
							type='checkbox'
							checked={acceptedMaintenance}
							onChange={(e) => {
								setAcceptedMaintenance(e.target.checked);
								setError('');
							}}
						/>
						<LegalContent>
							<LegalTitle>Maintenance Disclaimer</LegalTitle>
							<LegalDescription>
								I understand that Maintley is a property management tool and
								does not provide professional maintenance services or
								warranties.
							</LegalDescription>
							<ViewLink
								onClick={() =>
									handleViewDocument(
										'maintenance-disclaimer',
										'Maintenance Disclaimer',
									)
								}>
								View Maintenance Disclaimer →
							</ViewLink>
						</LegalContent>
					</LegalSection>

					<LegalSection>
						<LegalCheckbox
							type='checkbox'
							checked={acceptedSubscriptionTerms}
							onChange={(e) => {
								setAcceptedSubscriptionTerms(e.target.checked);
								setError('');
							}}
						/>
						<LegalContent>
							<LegalTitle>Subscription Terms</LegalTitle>
							<LegalDescription>
								I acknowledge and agree to the subscription terms, including
								billing cycles, trial period details, and cancellation policy.
							</LegalDescription>
							<ViewLink
								onClick={() =>
									handleViewDocument('subscription-terms', 'Subscription Terms')
								}>
								View Subscription Terms →
							</ViewLink>
						</LegalContent>
					</LegalSection>

					<LegalSection>
						<LegalCheckbox
							type='checkbox'
							checked={acceptedEula}
							onChange={(e) => {
								setAcceptedEula(e.target.checked);
								setError('');
							}}
						/>
						<LegalContent>
							<LegalTitle>End User License Agreement (EULA)</LegalTitle>
							<LegalDescription>
								I acknowledge and agree to the end user license agreement for
								use of the Maintley software.
							</LegalDescription>
							<ViewLink
								onClick={() =>
									handleViewDocument(
										'eula',
										'End User License Agreement (EULA)',
									)
								}>
								View EULA →
							</ViewLink>
						</LegalContent>
					</LegalSection>
				</NotificationBody>

				<NotificationFooter>
					<Button
						variant='secondary'
						onClick={handleCancel}
						disabled={isLoading}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleAccept}
						disabled={!allAccepted || isLoading}>
						{isLoading ? 'Accepting...' : 'Accept & Continue'}
					</Button>
				</NotificationFooter>
			</NotificationCard>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseDocumentViewer}
			/>
		</NotificationWrapper>
	);
};

export default LegalAgreementNotification;
