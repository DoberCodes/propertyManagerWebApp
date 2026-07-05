import React from 'react';
import styled from 'styled-components';
import { GenericModal } from '../Library';
import {
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../utils/propertyIntelligenceScan';
import { COLORS } from '../../constants/colors';

interface RecommendationResolutionModalProps {
	isOpen: boolean;
	recommendation: PropertyScanRecommendation | null;
	onClose: () => void;
	onStartAction: (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => void;
}

export const RecommendationResolutionModal: React.FC<
	RecommendationResolutionModalProps
> = ({
	isOpen,
	recommendation,
	onClose,
	onStartAction,
}) => {
	const resolution = recommendation?.resolution;

	if (!isOpen || !recommendation || !resolution) {
		return null;
	}

	const handlePrimaryAction = () => {
		onStartAction(resolution.primaryActionType, recommendation);
	};

	const handleOptionAction = (
		optionActionType: PropertyScanActionType,
		optionMetadata?: Record<string, unknown>,
	) => {
		onStartAction(optionActionType, {
			...recommendation,
			metadata: {
				...(recommendation.metadata || {}),
				...(optionMetadata || {}),
			},
		});
	};

	return (
		<GenericModal
			isOpen={isOpen}
			onClose={onClose}
			title='Complete recommendation'
			compact
			showActions
			primaryButtonLabel={resolution.primaryActionLabel}
			secondaryButtonLabel='Not now'
			primaryButtonAction={handlePrimaryAction}>
			<ResolutionContent>
				<ContextLine>
					<span>Maintley Intelligence</span>
					{resolution.assetLabel ? <span>{resolution.assetLabel}</span> : null}
					<span>{resolution.sectionLabel}</span>
				</ContextLine>

				<RecommendationBlock>
					<BlockLabel>Maintley Recommendation</BlockLabel>
					<RecommendationTitle>{recommendation.title}</RecommendationTitle>
					{resolution.missingFields.length > 0 ? (
						<FieldList aria-label='Missing information'>
							{resolution.missingFields.map((field) => (
								<FieldPill key={field}>{field}</FieldPill>
							))}
						</FieldList>
					) : null}
				</RecommendationBlock>

				<GuidanceSection>
					<BlockLabel>Why it matters</BlockLabel>
					<p>{resolution.whyItMatters}</p>
				</GuidanceSection>

				<GuidanceSection>
					<BlockLabel>What to do</BlockLabel>
					<p>{resolution.whatToDo}</p>
				</GuidanceSection>

				{resolution.options.length > 0 ? (
					<HelpSection>
						<BlockLabel>Other ways to complete this</BlockLabel>
						<OptionList>
							{resolution.options.map((option) => (
								<OptionButton
									key={`${option.actionType}-${option.label}`}
									type='button'
									onClick={() =>
										handleOptionAction(option.actionType, option.metadata)
									}>
									<strong>{option.label}</strong>
									{option.description ? <span>{option.description}</span> : null}
								</OptionButton>
							))}
						</OptionList>
					</HelpSection>
				) : null}
			</ResolutionContent>
		</GenericModal>
	);
};

const ResolutionContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`;

const ContextLine = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	color: #64748b;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;

	span:not(:last-child)::after {
		content: '/';
		margin-left: 8px;
		color: #94a3b8;
	}
`;

const RecommendationBlock = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const BlockLabel = styled.span`
	color: ${COLORS.primaryDark};
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const RecommendationTitle = styled.h4`
	margin: 0;
	color: #172033;
	font-size: 20px;
	line-height: 1.25;
	font-weight: 800;
`;

const FieldList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;

const FieldPill = styled.span`
	border: 1px solid #cbd5e1;
	border-radius: 999px;
	background: #f8fafc;
	color: #334155;
	font-size: 13px;
	font-weight: 700;
	padding: 6px 10px;
`;

const GuidanceSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 6px;

	p {
		margin: 0;
		color: #475569;
		font-size: 14px;
		line-height: 1.55;
	}
`;

const HelpSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const OptionList = styled.div`
	display: grid;
	gap: 8px;
`;

const OptionButton = styled.button`
	display: flex;
	flex-direction: column;
	gap: 3px;
	width: 100%;
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #ffffff;
	color: #172033;
	padding: 10px 12px;
	text-align: left;
	cursor: pointer;

	strong {
		font-size: 14px;
	}

	span {
		color: #64748b;
		font-size: 13px;
		line-height: 1.35;
	}

	&:hover {
		border-color: ${COLORS.primary};
		background: ${COLORS.primaryLight};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}
`;
