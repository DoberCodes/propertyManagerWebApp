import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

const DocumentModal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 1001;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
`;

const DocumentContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	max-width: 800px;
	width: 100%;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const DocumentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	border-bottom: 1px solid #e2e8f0;
	padding-bottom: 16px;
`;

const DocumentTitle = styled.h3`
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	color: ${COLORS.primary};
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: color 0.2s ease;
	font-size: 24px;
	line-height: 1;

	&:hover {
		color: #475569;
	}
`;

const DocumentTextContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 0 4px;
`;

const DocumentText = styled.pre`
	font-family: ${TYPOGRAPHY.fontFamily};
	font-size: 14px;
	line-height: 1.6;
	color: #374151;
	white-space: pre-wrap;
	word-wrap: break-word;
	margin: 0;
	padding: 16px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px;
	color: #64748b;
`;

const ErrorContainer = styled.div`
	text-align: center;
	padding: 40px;
	color: #dc2626;
`;

const ErrorText = styled.p`
	margin: 0 0 16px 0;
	font-size: 16px;
`;

const RetryButton = styled.button`
	background: ${COLORS.primary};
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: background 0.2s ease;

	&:hover {
		background: #2563eb;
	}
`;

interface DocumentViewerProps {
	documentName: string;
	title: string;
	isOpen: boolean;
	onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
	documentName,
	title,
	isOpen,
	onClose,
}) => {
	const [content, setContent] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const loadDocument = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/${documentName}.txt`);
			if (!response.ok) {
				throw new Error(`Failed to load document: ${response.status}`);
			}
			const text = await response.text();
			setContent(text);
		} catch (err) {
			console.error('Error loading document:', err);
			setError('Failed to load document. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [documentName]);

	useEffect(() => {
		if (isOpen && documentName) {
			loadDocument();
		}
	}, [isOpen, documentName, loadDocument]);

	const handleRetry = () => {
		loadDocument();
	};

	if (!isOpen) return null;

	return (
		<DocumentModal onClick={onClose}>
			<DocumentContent onClick={(e) => e.stopPropagation()}>
				<DocumentHeader>
					<DocumentTitle>{title}</DocumentTitle>
					<CloseButton onClick={onClose}>×</CloseButton>
				</DocumentHeader>

				<DocumentTextContainer>
					{loading && (
						<LoadingContainer>
							<div>Loading document...</div>
						</LoadingContainer>
					)}

					{error && (
						<ErrorContainer>
							<ErrorText>{error}</ErrorText>
							<RetryButton onClick={handleRetry}>Try Again</RetryButton>
						</ErrorContainer>
					)}

					{!loading && !error && content && (
						<DocumentText>{content}</DocumentText>
					)}
				</DocumentTextContainer>
			</DocumentContent>
		</DocumentModal>
	);
};

export default DocumentViewer;
