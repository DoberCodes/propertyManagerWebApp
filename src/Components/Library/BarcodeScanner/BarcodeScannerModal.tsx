import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 2000;
	background: rgba(15, 23, 42, 0.62);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
`;

const Card = styled.div`
	width: min(760px, 100%);
	max-height: 90vh;
	background: #ffffff;
	border-radius: 12px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px;
	border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 16px;
	font-weight: 700;
	color: #0f172a;
`;

const CloseButton = styled.button`
	border: 1px solid #d1d5db;
	background: #ffffff;
	border-radius: 8px;
	padding: 6px 10px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
`;

const Body = styled.div`
	padding: 14px 16px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const VideoWrap = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	overflow: hidden;
	background: #0f172a;
	min-height: 240px;
`;

const Video = styled.video`
	width: 100%;
	height: 320px;
	object-fit: cover;
`;

const Helper = styled.div`
	font-size: 12px;
	color: #64748b;
`;

const ErrorText = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #b91c1c;
`;

const Row = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`;

const ActionButton = styled.button`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #0f766e;
	background: #0f766e;
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
`;

const GhostButton = styled.button`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #cbd5e1;
	background: #ffffff;
	color: #334155;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
`;

const Input = styled.input`
	padding: 8px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	font-size: 13px;
	flex: 1;
`;

type BarcodeScanResult = {
	rawValue?: string;
};

interface BarcodeScannerModalProps {
	isOpen: boolean;
	title?: string;
	onClose: () => void;
	onDetected: (value: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
	isOpen,
	title = 'Scan Barcode',
	onClose,
	onDetected,
}) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef<number | null>(null);
	const [error, setError] = useState<string>('');
	const [manualValue, setManualValue] = useState('');

	const supportsBarcodeDetector = useMemo(
		() => typeof (window as any).BarcodeDetector !== 'undefined',
		[],
	);
	const supportsCameraAccess = useMemo(
		() =>
			typeof navigator !== 'undefined' &&
			!!navigator.mediaDevices &&
			typeof navigator.mediaDevices.getUserMedia === 'function',
		[],
	);

	const stopScanner = useCallback(() => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
	}, []);

	const commitValue = useCallback((value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return;
		onDetected(trimmed);
		stopScanner();
		onClose();
	}, [onClose, onDetected, stopScanner]);

	useEffect(() => {
		if (!isOpen) {
			stopScanner();
			setError('');
			setManualValue('');
			return;
		}

		if (!supportsCameraAccess) {
			setError('Camera access is not available in this browser. Use manual paste below.');
			return;
		}

		let cancelled = false;
		const setup = async () => {
			try {
				setError(
					supportsBarcodeDetector
						? ''
						: 'Camera access is available, but live barcode detection is not supported here. You can still use the camera preview and paste the scanned value manually if needed.',
				);
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: 'environment' },
					audio: false,
				});
				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}

				streamRef.current = stream;
				const video = videoRef.current;
				if (!video) return;
				video.srcObject = stream;
				await video.play();

				if (!supportsBarcodeDetector) {
					return;
				}

				const DetectorCtor = (window as any).BarcodeDetector;
				const detector = new DetectorCtor({
					formats: [
						'code_128',
						'code_39',
						'ean_13',
						'ean_8',
						'upc_a',
						'upc_e',
						'qr_code',
					],
				});

				const tick = async () => {
					if (!videoRef.current) return;
					try {
						const results = (await detector.detect(videoRef.current)) as BarcodeScanResult[];
						if (results.length > 0 && results[0].rawValue) {
							commitValue(results[0].rawValue);
							return;
						}
					} catch {
						// Keep scanning even if one frame errors.
					}
					rafRef.current = requestAnimationFrame(tick);
				};

				rafRef.current = requestAnimationFrame(tick);
			} catch {
				setError('Unable to access camera. Check browser permissions and try again.');
			}
		};

		setup();

		return () => {
			cancelled = true;
			stopScanner();
		};
	}, [commitValue, isOpen, stopScanner, supportsBarcodeDetector, supportsCameraAccess]);

	if (!isOpen) return null;

	return (
		<Overlay>
			<Card>
				<Header>
					<Title>{title}</Title>
					<CloseButton
						type='button'
						onClick={() => {
							stopScanner();
							onClose();
						}}>
						Close
					</CloseButton>
				</Header>
				<Body>
					<VideoWrap>
						<Video ref={videoRef} playsInline muted />
					</VideoWrap>
					<Helper>
						Point your camera at a barcode or QR code. If scanning does not work, paste the code below.
					</Helper>
					{error && <ErrorText>{error}</ErrorText>}
					<Row>
						<Input
							type='text'
							value={manualValue}
							onChange={(e) => setManualValue(e.target.value)}
							placeholder='Paste barcode value'
						/>
						<ActionButton type='button' onClick={() => commitValue(manualValue)}>
							Use Value
						</ActionButton>
						<GhostButton
							type='button'
							onClick={() => {
								setManualValue('');
							}}>
							Clear
						</GhostButton>
					</Row>
				</Body>
			</Card>
		</Overlay>
	);
};
