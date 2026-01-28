import React, { useState } from 'react';
import { testFirebaseConnection } from '../../utils/testFirebaseConnection';
import styled from 'styled-components';

const TestContainer = styled.div`
	position: fixed;
	top: 20px;
	right: 20px;
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	max-width: 400px;
	z-index: 10000;
`;

const TestButton = styled.button`
	background: #4caf50;
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 4px;
	cursor: pointer;
	margin-bottom: 15px;
	width: 100%;
	font-size: 14px;

	&:hover {
		background: #45a049;
	}

	&:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 10px;
	right: 10px;
	background: #f44336;
	color: white;
	border: none;
	padding: 5px 10px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;

	&:hover {
		background: #da190b;
	}
`;

const ResultItem = styled.div<{ $success: boolean }>`
	padding: 8px;
	margin: 5px 0;
	border-radius: 4px;
	background: ${(props) => (props.$success ? '#d4edda' : '#f8d7da')};
	color: ${(props) => (props.$success ? '#155724' : '#721c24')};
	font-size: 13px;
	border: 1px solid ${(props) => (props.$success ? '#c3e6cb' : '#f5c6cb')};
`;

const Title = styled.h3`
	margin: 0 0 15px 0;
	color: #333;
	font-size: 18px;
`;

const LoadingText = styled.p`
	color: #666;
	font-size: 14px;
	text-align: center;
`;

interface TestResult {
	connected: boolean;
	error: string | null;
}

interface TestResults {
	properties: TestResult;
	tasks: TestResult;
	propertyGroups: TestResult;
	teamGroups: TestResult;
	teamMembers: TestResult;
}

export const FirebaseConnectionTest: React.FC = () => {
	const [testing, setTesting] = useState(false);
	const [results, setResults] = useState<TestResults | null>(null);
	const [visible, setVisible] = useState(true);

	const runTest = async () => {
		setTesting(true);
		setResults(null);
		try {
			const testResults = await testFirebaseConnection();
			setResults(testResults);
		} catch (error) {
			console.error('Test failed:', error);
		} finally {
			setTesting(false);
		}
	};

	if (!visible) return null;

	return (
		<TestContainer>
			<CloseButton onClick={() => setVisible(false)}>×</CloseButton>
			<Title>🔥 Firebase Connection Test</Title>

			<TestButton onClick={runTest} disabled={testing}>
				{testing ? 'Testing...' : 'Run Connection Test'}
			</TestButton>

			{testing && <LoadingText>Testing Firebase connections...</LoadingText>}

			{results && (
				<div>
					<ResultItem $success={results.properties.connected}>
						{results.properties.connected ? '✅' : '❌'} Properties Collection
						{results.properties.error && (
							<div>Error: {results.properties.error}</div>
						)}
					</ResultItem>

					<ResultItem $success={results.tasks.connected}>
						{results.tasks.connected ? '✅' : '❌'} Tasks Collection
						{results.tasks.error && <div>Error: {results.tasks.error}</div>}
					</ResultItem>

					<ResultItem $success={results.propertyGroups.connected}>
						{results.propertyGroups.connected ? '✅' : '❌'} Property Groups
						{results.propertyGroups.error && (
							<div>Error: {results.propertyGroups.error}</div>
						)}
					</ResultItem>

					<ResultItem $success={results.teamGroups.connected}>
						{results.teamGroups.connected ? '✅' : '❌'} Team Groups
						{results.teamGroups.error && (
							<div>Error: {results.teamGroups.error}</div>
						)}
					</ResultItem>

					<ResultItem $success={results.teamMembers.connected}>
						{results.teamMembers.connected ? '✅' : '❌'} Team Members
						{results.teamMembers.error && (
							<div>Error: {results.teamMembers.error}</div>
						)}
					</ResultItem>
				</div>
			)}
		</TestContainer>
	);
};
