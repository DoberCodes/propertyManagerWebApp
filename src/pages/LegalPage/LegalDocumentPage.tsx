import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SEO from 'Components/SEO/SEO';
import { COLORS } from '../../constants/colors';
import { legalDocuments } from './legalDocuments';

const Container = styled.div`
	max-width: 1000px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const BackLink = styled.button`
	display: inline-block;
	margin-bottom: 24px;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;

	&:hover {
		background: #4f46e5;
		color: #fff;
	}
`;

const Title = styled.h2`
	font-size: 2.25rem;
	margin-bottom: 12px;
	color: #1f2937;
`;

const Description = styled.p`
	font-size: 1rem;
	color: #6b7280;
	margin: 0 0 24px 0;
	line-height: 1.6;
`;

const TocContainer = styled.aside`
	margin: 0 0 24px 0;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
`;

const TocTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 1rem;
	color: #1f2937;
`;

const TocList = styled.ul`
	margin: 0;
	padding-left: 20px;
	color: #374151;
`;

const TocItem = styled.li`
	margin: 6px 0;
`;

const TocLink = styled.button`
	color: ${COLORS.primary};
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font: inherit;
	text-decoration: none;
	font-size: 0.95rem;

	&:hover {
		text-decoration: underline;
	}
`;

const DocumentText = styled.pre`
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
		sans-serif;
	font-size: 14px;
	line-height: 1.6;
	color: #374151;
	white-space: pre-wrap;
	word-wrap: break-word;
	margin: 0;
	padding: 20px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
`;

const Section = styled.section`
	margin-bottom: 24px;
	scroll-margin-top: 80px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 1.15rem;
	color: #111827;
`;

const StatusContainer = styled.div`
	padding: 32px;
	text-align: center;
	color: #6b7280;
`;

const ErrorText = styled.p`
	margin: 0 0 16px 0;
	color: #dc2626;
`;

const RetryButton = styled.button`
	background: ${COLORS.primary};
	color: #fff;
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

const NotFoundText = styled.p`
	margin: 0 0 16px 0;
	color: #6b7280;
`;

const headingRegex = /^\d+\.\s+(.+)/;

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');

const parseDocument = (text: string) => {
	const lines = text.split(/\r?\n/);
	const sections: { id: string; title: string; body: string }[] = [];
	const introLines: string[] = [];
	let currentTitle: string | null = null;
	let currentLines: string[] = [];
	const slugCounts = new Map<string, number>();

	const finalizeSection = () => {
		if (!currentTitle) return;
		const baseSlug = slugify(currentTitle) || 'section';
		const count = (slugCounts.get(baseSlug) || 0) + 1;
		slugCounts.set(baseSlug, count);
		const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;
		sections.push({
			id,
			title: currentTitle,
			body: currentLines.join('\n').trim(),
		});
		currentTitle = null;
		currentLines = [];
	};

	lines.forEach((line) => {
		const match = line.match(headingRegex);
		if (match) {
			if (currentTitle) {
				finalizeSection();
			} else if (introLines.length === 0) {
				// Keep any intro text that precedes the first numbered heading.
				introLines.push('');
			}
			currentTitle = match[1].trim();
			return;
		}

		if (!currentTitle) {
			introLines.push(line);
			return;
		}

		currentLines.push(line);
	});

	finalizeSection();

	return {
		intro: introLines.join('\n').trim(),
		sections,
	};
};

const LegalDocumentPage: React.FC = () => {
	const { documentName } = useParams<{ documentName: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const parsedDocument = useMemo(() => {
		if (!content) {
			return { intro: '', sections: [] };
		}
		return parseDocument(content);
	}, [content]);

	const documentInfo = useMemo(
		() => legalDocuments.find((doc) => doc.filename === documentName),
		[documentName],
	);

	const handleBack = () => {
		const from = (location.state as { from?: string } | null)?.from;
		if (from) {
			navigate(from, { replace: true });
			return;
		}

		if ((window.history.state?.idx ?? 0) > 0) {
			navigate(-1);
			return;
		}

		navigate('/legal', {
			replace: true,
			state: { from: '/' },
		});
	};

	const handleTocClick = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (!element) return;
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const loadDocument = useCallback(async () => {
		if (!documentInfo) return;
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/${documentInfo.filename}.txt`);
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
	}, [documentInfo]);

	useEffect(() => {
		if (documentInfo) {
			setContent('');
			loadDocument();
		}
	}, [documentInfo, loadDocument]);

	if (!documentInfo) {
		return (
			<Container>
				<SEO
					title='Legal Document Not Found — Maintley'
					description='The requested legal document could not be found.'
					url={`${window.location.origin}/legal`}
					keywords='legal documents, maintley'
				/>
				<BackLink onClick={handleBack}>Back to Legal Documents</BackLink>
				<Title>Document not found</Title>
				<NotFoundText>
					We could not find that legal document. Please return to the legal hub
					and choose another document.
				</NotFoundText>
			</Container>
		);
	}

	return (
		<Container>
			<SEO
				title={`${documentInfo.title} — Maintley`}
				description={documentInfo.description}
				url={`${window.location.origin}/legal/${documentInfo.filename}`}
				keywords='terms of service, privacy policy, legal'
			/>
			<BackLink onClick={handleBack}>Back to Legal Documents</BackLink>
			<Title>{documentInfo.title}</Title>
			<Description>{documentInfo.description}</Description>

			{loading && <StatusContainer>Loading document...</StatusContainer>}

			{error && (
				<StatusContainer>
					<ErrorText>{error}</ErrorText>
					<RetryButton onClick={loadDocument}>Try Again</RetryButton>
				</StatusContainer>
			)}

			{!loading && !error && content && (
				<>
					{parsedDocument.sections.length > 0 && (
						<TocContainer>
							<TocTitle>Table of Contents</TocTitle>
							<TocList>
								{parsedDocument.sections.map((section) => (
									<TocItem key={section.id}>
										<TocLink
											type='button'
											onClick={() => handleTocClick(section.id)}>
											{section.title}
										</TocLink>
									</TocItem>
								))}
							</TocList>
						</TocContainer>
					)}

					{parsedDocument.intro && (
						<DocumentText>{parsedDocument.intro}</DocumentText>
					)}

					{parsedDocument.sections.length > 0
						? parsedDocument.sections.map((section) => (
							<Section key={section.id} id={section.id}>
								<SectionTitle>{section.title}</SectionTitle>
								<DocumentText>{section.body}</DocumentText>
							</Section>
						))
						: !parsedDocument.intro && <DocumentText>{content}</DocumentText>}
				</>
			)}
		</Container>
	);
};

export default LegalDocumentPage;
