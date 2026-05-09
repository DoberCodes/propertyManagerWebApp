import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	analyzeBarcodePayload,
	BarcodePayloadAnalysis,
} from '../../../utils/barcodeScanParser';

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

const MethodTabs = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`;

const MethodTabButton = styled.button<{ $active?: boolean }>`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid ${(props) => (props.$active ? '#0f766e' : '#cbd5e1')};
	background: ${(props) => (props.$active ? '#ecfeff' : '#ffffff')};
	color: ${(props) => (props.$active ? '#0f766e' : '#334155')};
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
`;

const HiddenFileInput = styled.input`
	display: none;
`;

const PreviewImage = styled.img`
	width: 100%;
	max-height: 260px;
	object-fit: contain;
	border-radius: 8px;
	border: 1px solid #cbd5e1;
	background: #ffffff;
`;

const InspectorCard = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 12px;
	background: #f8fafc;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const InspectorTitle = styled.h4`
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	color: #0f172a;
`;

const InspectorHint = styled.div`
	font-size: 12px;
	color: #475569;
`;

const ScrollPanel = styled.div`
	max-height: 260px;
	overflow: auto;
	padding: 8px;
	border-radius: 8px;
	border: 1px solid #cbd5e1;
	background: #ffffff;
`;

const DataBlock = styled.pre`
	margin: 0;
	white-space: pre-wrap;
	word-break: break-word;
	font-size: 11px;
	line-height: 1.5;
	color: #0f172a;
`;

const PillRow = styled.div`
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
`;

const Pill = styled.span`
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	background: #dcfce7;
	color: #166534;
`;

const RelabelGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const RelabelRowWrap = styled.div`
	display: grid;
	grid-template-columns: auto minmax(90px, 1fr) minmax(110px, 1fr) minmax(140px, 2fr);
	gap: 8px;
	align-items: center;

	@media (max-width: 740px) {
		grid-template-columns: auto 1fr;
	}
`;

const TinyLabel = styled.div`
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	font-weight: 700;
	color: #64748b;
`;

const MiniInput = styled.input`
	padding: 6px 8px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 12px;
	width: 100%;
`;

const Checkbox = styled.input`
	width: 14px;
	height: 14px;
`;

type BarcodeScanResult = {
	rawValue?: string;
};

type RelabelRow = {
	id: string;
	sourceKey: string;
	targetKey: string;
	value: string;
	selected: boolean;
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
	const photoInputRef = useRef<HTMLInputElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef<number | null>(null);
	const [error, setError] = useState<string>('');
	const [manualValue, setManualValue] = useState('');
	const [capturedValue, setCapturedValue] = useState('');
	const [analysis, setAnalysis] = useState<BarcodePayloadAnalysis | null>(null);
	const [relabelRows, setRelabelRows] = useState<RelabelRow[]>([]);
	const [activeMethod, setActiveMethod] = useState<'barcode' | 'photo'>('barcode');
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [selectedImagePreview, setSelectedImagePreview] = useState('');
	const [isExtractingText, setIsExtractingText] = useState(false);
	const [ocrError, setOcrError] = useState('');

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

	const buildRelabelRows = useCallback((nextAnalysis: BarcodePayloadAnalysis): RelabelRow[] => {
		const rows: RelabelRow[] = [];
		const pairEntries = Object.entries(nextAnalysis.keyValuePairs);

		if (pairEntries.length > 0) {
			pairEntries.forEach(([key, value], index) => {
				rows.push({
					id: `pair-${index}-${key}`,
					sourceKey: key,
					targetKey: key,
					value,
					selected: true,
				});
			});
			return rows;
		}

		const mergedNormalized: Record<string, string> = {};
		Object.entries(nextAnalysis.normalized.device).forEach(([key, value]) => {
			if (value) mergedNormalized[key] = String(value);
		});
		Object.entries(nextAnalysis.normalized.part).forEach(([key, value]) => {
			if (value && !mergedNormalized[key]) mergedNormalized[key] = String(value);
		});

		Object.entries(mergedNormalized).forEach(([key, value], index) => {
			rows.push({
				id: `normalized-${index}-${key}`,
				sourceKey: key,
				targetKey: key,
				value,
				selected: true,
			});
		});

		return rows;
	}, []);

	const captureValue = useCallback((value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return;
		const nextAnalysis = analyzeBarcodePayload(trimmed);
		setCapturedValue(trimmed);
		setAnalysis(nextAnalysis);
		setRelabelRows(buildRelabelRows(nextAnalysis));
		stopScanner();
	}, [buildRelabelRows, stopScanner]);

	const toggleRelabelRow = (id: string) => {
		setRelabelRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)),
		);
	};

	const updateRelabelRow = (id: string, field: 'targetKey' | 'value', value: string) => {
		setRelabelRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
		);
	};

	const buildApplyValue = useCallback((): string => {
		const selected = relabelRows.filter(
			(row) => row.selected && row.targetKey.trim() && row.value.trim(),
		);
		if (selected.length === 0) return capturedValue;
		return selected
			.map((row) => `${row.targetKey.trim()}: ${row.value.trim()}`)
			.join('; ');
	}, [capturedValue, relabelRows]);

	const extractTextFromImage = useCallback(
		async (file: File) => {
			setOcrError('');
			setIsExtractingText(true);
			try {
				const tesseractModule = await import('tesseract.js');
				const worker = await (tesseractModule as any).createWorker('eng');
				const result = await worker.recognize(file);
				await worker.terminate();

				const extractedText = String(result?.data?.text || '').trim();
				if (!extractedText) {
					setOcrError('No readable text was detected on this image. Try a clearer photo.');
					return;
				}

				setManualValue(extractedText);
				captureValue(extractedText);
			} catch {
				setOcrError('Unable to extract text from this image. Please try another photo.');
			} finally {
				setIsExtractingText(false);
			}
		},
		[captureValue],
	);

	const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setSelectedImageFile(file);
		setOcrError('');

		const reader = new FileReader();
		reader.onload = () => {
			setSelectedImagePreview(String(reader.result || ''));
		};
		reader.readAsDataURL(file);
	};

	useEffect(() => {
		if (!isOpen) {
			stopScanner();
			setError('');
			setManualValue('');
			setCapturedValue('');
			setAnalysis(null);
			setRelabelRows([]);
			setActiveMethod('barcode');
			setSelectedImageFile(null);
			setSelectedImagePreview('');
			setIsExtractingText(false);
			setOcrError('');
			return;
		}

		if (activeMethod !== 'barcode' || analysis) {
			stopScanner();
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
							captureValue(results[0].rawValue);
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
	}, [activeMethod, analysis, captureValue, isOpen, stopScanner, supportsBarcodeDetector, supportsCameraAccess]);

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
					<MethodTabs>
						<MethodTabButton
							type='button'
							$active={activeMethod === 'barcode'}
							onClick={() => setActiveMethod('barcode')}>
							Barcode / QR Scan
						</MethodTabButton>
						<MethodTabButton
							type='button'
							$active={activeMethod === 'photo'}
							onClick={() => setActiveMethod('photo')}>
							Sticker Photo (OCR)
						</MethodTabButton>
					</MethodTabs>

					{!analysis && activeMethod === 'barcode' && (
						<>
							<VideoWrap>
								<Video ref={videoRef} playsInline muted />
							</VideoWrap>
							<Helper>
								Scan label code for quick identifiers, then confirm mapped fields below.
							</Helper>
						</>
					)}

					{!analysis && activeMethod === 'photo' && (
						<>
							<Helper>
								Take or upload a device sticker photo to extract text and map fields.
							</Helper>
							<Row>
								<ActionButton
									type='button'
									onClick={() => photoInputRef.current?.click()}>
									Choose Sticker Image
								</ActionButton>
								<GhostButton
									type='button'
									disabled={!selectedImageFile || isExtractingText}
									onClick={() => {
										if (selectedImageFile) {
											void extractTextFromImage(selectedImageFile);
										}
									}}>
									{isExtractingText ? 'Reading Text...' : 'Extract Text'}
								</GhostButton>
							</Row>
							<HiddenFileInput
								ref={photoInputRef}
								type='file'
								accept='image/*'
								capture='environment'
								onChange={handlePhotoSelected}
							/>
							{selectedImagePreview && (
								<PreviewImage src={selectedImagePreview} alt='Sticker preview' />
							)}
							{ocrError && <ErrorText>{ocrError}</ErrorText>}
						</>
					)}
					{error && <ErrorText>{error}</ErrorText>}
					<Row>
						<Input
							type='text'
							value={manualValue}
							onChange={(e) => setManualValue(e.target.value)}
							placeholder='Paste barcode or extracted sticker text'
						/>
						<ActionButton type='button' onClick={() => captureValue(manualValue)}>
							Inspect Captured Text
						</ActionButton>
						<GhostButton
							type='button'
							onClick={() => {
								setManualValue('');
							}}>
							Clear
						</GhostButton>
					</Row>
					{analysis && (
						<InspectorCard>
							<InspectorTitle>Scanned Data Inspector</InspectorTitle>
							<InspectorHint>
								Standardized structure: raw value, detected key-value pairs, GS1 segments, and normalized device/part mappings.
							</InspectorHint>
							<PillRow>
								{analysis.formatHints.hasPairs && <Pill>Key/Value</Pill>}
								{analysis.formatHints.hasGs1Markers && <Pill>GS1</Pill>}
								{analysis.formatHints.looksLikePlainCode && <Pill>Plain Code</Pill>}
							</PillRow>
							<ScrollPanel>
								<DataBlock>
									{JSON.stringify(
										{
											raw: analysis.raw,
											keyValuePairs: analysis.keyValuePairs,
											gs1: analysis.gs1,
											normalized: analysis.normalized,
										},
										null,
										2,
									)}
								</DataBlock>
							</ScrollPanel>
							<Row>
								<ActionButton type='button' onClick={() => commitValue(capturedValue)}>
									Apply Scanned Value
								</ActionButton>
								<ActionButton
									type='button'
									onClick={() => {
										const applyValue = buildApplyValue();
										commitValue(applyValue);
									}}>
									Apply Relabeled Fields
								</ActionButton>
								<GhostButton
									type='button'
									onClick={() => {
										setCapturedValue('');
										setAnalysis(null);
										setRelabelRows([]);
										setError('');
									}}>
									Scan Again
								</GhostButton>
							</Row>
							<InspectorTitle style={{ marginTop: '2px' }}>
								Relabel and Select Fields To Apply
							</InspectorTitle>
							<InspectorHint>
								Rename keys so they match existing inputs, then apply only checked rows.
							</InspectorHint>
							<ScrollPanel>
								<RelabelGrid>
									{relabelRows.length === 0 && (
										<Helper>No relabelable fields detected for this scan value.</Helper>
									)}
									{relabelRows.map((row) => (
										<RelabelRowWrap key={row.id}>
											<Checkbox
												type='checkbox'
												checked={row.selected}
												onChange={() => toggleRelabelRow(row.id)}
											/>
											<div>
												<TinyLabel>Detected Key</TinyLabel>
												<MiniInput value={row.sourceKey} disabled />
											</div>
											<div>
												<TinyLabel>Apply As</TinyLabel>
												<MiniInput
													value={row.targetKey}
													onChange={(event) =>
														updateRelabelRow(row.id, 'targetKey', event.target.value)
													}
												/>
											</div>
											<div>
												<TinyLabel>Value</TinyLabel>
												<MiniInput
													value={row.value}
													onChange={(event) =>
														updateRelabelRow(row.id, 'value', event.target.value)
													}
												/>
											</div>
										</RelabelRowWrap>
									))}
								</RelabelGrid>
							</ScrollPanel>
						</InspectorCard>
					)}
				</Body>
			</Card>
		</Overlay>
	);
};
