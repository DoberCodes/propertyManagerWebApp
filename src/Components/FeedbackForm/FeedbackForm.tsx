import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { useSubmitFeedbackMutation } from '../../Redux/API/apiSlice';

interface FeedbackFormProps {
	onClose?: () => void;
}

export type FeedbackType = 'feedback' | 'feature_request' | 'bug_report';

export interface FeedbackData {
	type: FeedbackType;
	subject: string;
	message: string;
	userEmail?: string;
	userId?: string;
	userName?: string;
}

interface FeedbackAttachment {
	filename: string;
	contentBase64: string;
	contentType: string;
	sizeBytes: number;
}

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
				return;
			}
			reject(new Error('Failed to read selected file.'));
		};
		reader.onerror = () => reject(new Error('Failed to read selected file.'));
		reader.readAsDataURL(file);
	});

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [formData, setFormData] = useState<FeedbackData>({
		type: 'feedback',
		subject: '',
		message: '',
		userEmail: currentUser?.email || '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [ticketNumber, setTicketNumber] = useState<string | null>(null);
	const [error, setError] = useState('');
	const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);

	const handleAttachmentChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		setError('');

		const selectedFiles = Array.from(e.target.files || []);
		e.target.value = '';

		if (selectedFiles.length === 0) return;

		if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
			setError(`You can attach up to ${MAX_ATTACHMENTS} screenshots.`);
			return;
		}

		const invalidTypeFile = selectedFiles.find(
			(file) => !file.type.startsWith('image/'),
		);
		if (invalidTypeFile) {
			setError('Only image files are supported for attachments.');
			return;
		}

		const oversizedFile = selectedFiles.find(
			(file) => file.size > MAX_ATTACHMENT_SIZE_BYTES,
		);
		if (oversizedFile) {
			setError('Each screenshot must be 3MB or smaller.');
			return;
		}

		try {
			const convertedFiles = await Promise.all(
				selectedFiles.map(async (file): Promise<FeedbackAttachment> => {
					const dataUrl = await readFileAsDataUrl(file);
					const base64Data = dataUrl.includes(',')
						? dataUrl.split(',')[1]
						: dataUrl;

					return {
						filename: file.name,
						contentBase64: base64Data,
						contentType: file.type || 'application/octet-stream',
						sizeBytes: file.size,
					};
				}),
			);

			setAttachments((prev) => [...prev, ...convertedFiles]);
		} catch (conversionError) {
			setError(
				conversionError instanceof Error
					? conversionError.message
					: 'Failed to process screenshot attachment.',
			);
		}
	};

	const handleRemoveAttachment = (filename: string) => {
		setAttachments((prev) => prev.filter((item) => item.filename !== filename));
	};

	const [submitFeedback] = useSubmitFeedbackMutation();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!formData.subject.trim() || !formData.message.trim()) {
			setError('Please fill in all required fields.');
			return;
		}

		setIsSubmitting(true);

		try {
			const res = await submitFeedback({
				...formData,
				userId: currentUser?.id,
				userEmail: formData.userEmail || currentUser?.email,
				userName:
					currentUser?.firstName && currentUser?.lastName
						? `${currentUser.firstName} ${currentUser.lastName}`
						: currentUser?.email?.split('@')[0],
				attachments,
			}).unwrap();

			if (res?.ticketNumber) {
				setTicketNumber(res.ticketNumber);
			} else if (res?.id) {
				setTicketNumber(res.id);
			}

			setIsSubmitted(true);
			setTimeout(() => {
				onClose?.();
			}, 2000);
		} catch (err: any) {
			setError(err.message || 'Failed to submit feedback. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<SuccessContainer>
				<SuccessIcon>
					<FontAwesomeIcon icon={faCheckCircle} />
				</SuccessIcon>
				<SuccessTitle>Request received</SuccessTitle>
				<SuccessMessage>
					Your request has been sent to Maintley. You can track updates from My
					requests in the Support Center.
				</SuccessMessage>
				{ticketNumber && (
					<SuccessMessage style={{ marginTop: 10 }}>
						Ticket Number: <code>{ticketNumber}</code>
					</SuccessMessage>
				)}
			</SuccessContainer>
		);
	}

	return (
		<FormContainer onSubmit={handleSubmit}>
			<FormTitle>Tell us how we can help</FormTitle>
			<FormDescription>
				Ask a question, report a problem, share feedback, or suggest an
				improvement.
			</FormDescription>

			<FormGroup>
				<Label htmlFor='feedback-type'>Request type</Label>
				<Select
					id='feedback-type'
					value={formData.type}
					onChange={(e) =>
						setFormData({ ...formData, type: e.target.value as FeedbackType })
					}>
					<option value='feedback'>Question or Feedback</option>
					<option value='feature_request'>Feature Request</option>
					<option value='bug_report'>Bug Report</option>
				</Select>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='subject'>Subject *</Label>
				<Input
					id='subject'
					type='text'
					value={formData.subject}
					onChange={(e) =>
						setFormData({ ...formData, subject: e.target.value })
					}
					placeholder='Briefly describe what you need help with'
					required
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='userEmail'>Email Address (Optional)</Label>
				<Input
					id='userEmail'
					type='email'
					value={formData.userEmail || ''}
					onChange={(e) =>
						setFormData({ ...formData, userEmail: e.target.value })
					}
					placeholder='your.email@example.com'
				/>
				<HelpText>
					We will use this address if we need to follow up.
				</HelpText>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='message'>Message *</Label>
				<TextArea
					id='message'
					value={formData.message}
					onChange={(e) =>
						setFormData({ ...formData, message: e.target.value })
					}
					placeholder='Share any details that will help us understand your request...'
					rows={6}
					required
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='screenshots'>Screenshots (Optional)</Label>
				<Input
					id='screenshots'
					type='file'
					accept='image/*'
					multiple
					onChange={handleAttachmentChange}
				/>
				<HelpText>
					Attach up to {MAX_ATTACHMENTS} images, max 3MB each. These are sent
					with your feedback email.
				</HelpText>
				{attachments.length > 0 && (
					<AttachmentList>
						{attachments.map((attachment) => (
							<AttachmentItem key={attachment.filename}>
								<AttachmentName>{attachment.filename}</AttachmentName>
								<AttachmentMeta>
									{(attachment.sizeBytes / 1024 / 1024).toFixed(2)} MB
								</AttachmentMeta>
								<RemoveAttachmentButton
									type='button'
									onClick={() => handleRemoveAttachment(attachment.filename)}>
									Remove
								</RemoveAttachmentButton>
							</AttachmentItem>
						))}
					</AttachmentList>
				)}
			</FormGroup>

			{error && <ErrorMessage>{error}</ErrorMessage>}

			<SubmissionHint>
				If submit fails unexpectedly, please disable strict ad/privacy blocking
				for this site and try again.
			</SubmissionHint>

			<ButtonGroup>
				{onClose && (
					<CancelButton type='button' onClick={onClose}>
						Cancel
					</CancelButton>
				)}
				<SubmitButton type='submit' disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<FontAwesomeIcon icon={faPaperPlane} spin />
							Sending...
						</>
					) : (
						<>
							<FontAwesomeIcon icon={faPaperPlane} />
							Send Request
						</>
					)}
				</SubmitButton>
			</ButtonGroup>
		</FormContainer>
	);
};

export default FeedbackForm;

// Styled Components
const FormContainer = styled.form`
	max-width: 500px;
	width: 100%;
`;

const FormTitle = styled.h3`
	margin: 0 0 8px 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
`;

const FormDescription = styled.p`
	margin: 0 0 24px 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const FormGroup = styled.div`
	margin-bottom: 20px;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 6px;
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: inherit;
	resize: vertical;
	min-height: 120px;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
`;

const BaseButton = styled.button`
	padding: 10px 20px;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 8px;
	border: none;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const SubmitButton = styled(BaseButton)`
	background: #6366f1;
	color: white;

	&:hover:not(:disabled) {
		background: #4f46e5;
	}
`;

const CancelButton = styled(BaseButton)`
	background: #f3f4f6;
	color: #374151;
	border: 1px solid #d1d5db;

	&:hover:not(:disabled) {
		background: #e5e7eb;
	}
`;

const ErrorMessage = styled.div`
	color: #dc2626;
	font-size: 0.875rem;
	margin-bottom: 16px;
	padding: 8px 12px;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 4px;
`;

const SuccessContainer = styled.div`
	text-align: center;
	padding: 40px 20px;
`;

const SuccessIcon = styled.div`
	font-size: 3rem;
	color: #10b981;
	margin-bottom: 16px;
`;

const SuccessTitle = styled.h3`
	margin: 0 0 8px 0;
	color: #1f2937;
	font-size: 1.25rem;
`;

const SuccessMessage = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const HelpText = styled.p`
	margin: 4px 0 0 0;
	color: #6b7280;
	font-size: 0.75rem;
	line-height: 1.4;
`;

const SubmissionHint = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 0.75rem;
	line-height: 1.4;
`;

const AttachmentList = styled.div`
	margin-top: 10px;
	display: grid;
	gap: 8px;
`;

const AttachmentItem = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
	background: #f9fafb;
`;

const AttachmentName = styled.span`
	font-size: 0.825rem;
	color: #374151;
	font-weight: 500;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const AttachmentMeta = styled.span`
	font-size: 0.75rem;
	color: #6b7280;
`;

const RemoveAttachmentButton = styled.button`
	border: none;
	background: transparent;
	color: #dc2626;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	padding: 0;

	&:hover {
		text-decoration: underline;
	}
`;
