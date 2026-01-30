import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const DebugPanel = styled.div`
	position: fixed;
	bottom: 0;
	right: 0;
	width: 100%;
	background: rgba(0, 0, 0, 0.9);
	color: #00ff00;
	font-family: monospace;
	font-size: 12px;
	padding: 10px;
	max-height: 200px;
	overflow-y: auto;
	z-index: 9999;
	border-top: 2px solid #00ff00;
`;

const LogEntry = styled.div`
	margin: 2px 0;
	padding: 2px;
	&.error {
		color: #ff4444;
	}
	&.warn {
		color: #ffaa00;
	}
	&.log {
		color: #00ff00;
	}
`;

const ToggleButton = styled.button`
	position: fixed;
	bottom: 20px;
	right: 20px;
	width: 50px;
	height: 50px;
	border-radius: 50%;
	background: #065f46;
	color: white;
	border: 2px solid white;
	font-size: 20px;
	cursor: pointer;
	z-index: 10000;
	font-weight: bold;
`;

interface LogMessage {
	type: 'log' | 'error' | 'warn';
	message: string;
	timestamp: string;
}

export const DebugConsole: React.FC = () => {
	const [logs, setLogs] = useState<LogMessage[]>([
		{
			type: 'log',
			message: 'Debug Console Started',
			timestamp: new Date().toLocaleTimeString(),
		},
	]);
	const [isOpen, setIsOpen] = useState(true);

	useEffect(() => {
		// Override console methods
		const originalLog = console.log;
		const originalError = console.error;
		const originalWarn = console.warn;

		console.log = (...args: any[]) => {
			originalLog(...args);
			setLogs((prev) => [
				...prev,
				{
					type: 'log',
					message: args
						.map((arg) => {
							if (typeof arg === 'object') {
								return JSON.stringify(arg);
							}
							return String(arg);
						})
						.join(' '),
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		};

		console.error = (...args: any[]) => {
			originalError(...args);
			setLogs((prev) => [
				...prev,
				{
					type: 'error',
					message: args
						.map((arg) => {
							if (typeof arg === 'object') {
								return JSON.stringify(arg);
							}
							return String(arg);
						})
						.join(' '),
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		};

		console.warn = (...args: any[]) => {
			originalWarn(...args);
			setLogs((prev) => [
				...prev,
				{
					type: 'warn',
					message: args
						.map((arg) => {
							if (typeof arg === 'object') {
								return JSON.stringify(arg);
							}
							return String(arg);
						})
						.join(' '),
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		};

		return () => {
			console.log = originalLog;
			console.error = originalError;
			console.warn = originalWarn;
		};
	}, []);

	return (
		<>
			<ToggleButton onClick={() => setIsOpen(!isOpen)}>
				{isOpen ? '✕' : '▼'}
			</ToggleButton>
			{isOpen && (
				<DebugPanel>
					{logs.slice(-20).map((log, i) => (
						<LogEntry key={i} className={log.type}>
							<span>[{log.timestamp}]</span> {log.message}
						</LogEntry>
					))}
				</DebugPanel>
			)}
		</>
	);
};
