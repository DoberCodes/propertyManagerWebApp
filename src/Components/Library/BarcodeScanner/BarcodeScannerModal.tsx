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

const CameraToolbar = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`;

const Helper = styled.div`
	font-size: 12px;
	color: #64748b;
`;

const EngineHint = styled.div`
	font-size: 11px;
	font-weight: 600;
	color: #0f766e;
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

const ConfidenceBadge = styled.span<{ $tone: 'high' | 'medium' | 'low' }>`
	padding: 2px 7px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 700;
	background: ${(props) =>
		props.$tone === 'high'
			? '#dcfce7'
			: props.$tone === 'medium'
				? '#fef9c3'
				: '#fee2e2'};
	color: ${(props) =>
		props.$tone === 'high'
			? '#166534'
			: props.$tone === 'medium'
				? '#854d0e'
				: '#991b1b'};
`;

const GuidanceCard = styled.div`
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	background: #f8fafc;
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 6px;
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
type ZxingModule = typeof import('@zxing/library');

type RelabelRow = {
	id: string;
	sourceKey: string;
	targetKey: string;
	value: string;
	selected: boolean;
};

type ScannerMethod = 'barcode' | 'photo';
type CaptureIntent = 'appliance' | 'part' | 'generic';

interface BarcodeScannerModalProps {
	isOpen: boolean;
	title?: string;
	defaultMethod?: ScannerMethod;
	captureIntent?: CaptureIntent;
	onClose: () => void;
	onDetected: (value: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
	isOpen,
	title = 'Capture Assistant',
	defaultMethod = 'barcode',
	captureIntent = 'generic',
	onClose,
	onDetected,
}) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const photoInputRef = useRef<HTMLInputElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef<number | null>(null);
	const zxingModuleRef = useRef<ZxingModule | null>(null);
	const zxingReaderRef = useRef<any | null>(null);
	const zxingStopRef = useRef<(() => void) | null>(null);
	const activeVideoTrackRef = useRef<MediaStreamTrack | null>(null);
	const [error, setError] = useState<string>('');
	const [manualValue, setManualValue] = useState('');
	const [capturedValue, setCapturedValue] = useState('');
	const [analysis, setAnalysis] = useState<BarcodePayloadAnalysis | null>(null);
	const [relabelRows, setRelabelRows] = useState<RelabelRow[]>([]);
	const [activeMethod, setActiveMethod] = useState<ScannerMethod>(defaultMethod);
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [selectedImagePreview, setSelectedImagePreview] = useState('');
	const [isExtractingText, setIsExtractingText] = useState(false);
	const [ocrError, setOcrError] = useState('');
	const [captureEngineLabel, setCaptureEngineLabel] = useState('');
	const [isTorchAvailable, setIsTorchAvailable] = useState(false);
	const [isTorchOn, setIsTorchOn] = useState(false);

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

	const confidenceFromField = useCallback(
		(sourceKey: string, targetKey: string, value: string): 'high' | 'medium' | 'low' => {
			const normalizedKey = `${sourceKey} ${targetKey}`.toLowerCase();
			const cleanedValue = value.trim();
			if (!cleanedValue || cleanedValue.length < 2) return 'low';

			const isIdentifierField = /(serial|model|part|gtin|upc|ean|pn|sn)/i.test(
				normalizedKey,
			);
			const isDescriptorField = /(brand|manufacturer|type|size|material|notes|details)/i.test(
				normalizedKey,
			);

			if (isIdentifierField && /^[A-Za-z0-9._/-]{5,}$/.test(cleanedValue)) return 'high';
			if (isIdentifierField || isDescriptorField) return 'medium';
			return 'low';
		},
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
		activeVideoTrackRef.current = null;
		setIsTorchAvailable(false);
		setIsTorchOn(false);
		if (zxingStopRef.current) {
			zxingStopRef.current();
			zxingStopRef.current = null;
		}
	}, []);

	const syncTorchAvailability = useCallback((stream: MediaStream | null) => {
		const nextTrack = stream?.getVideoTracks?.()[0] || null;
		activeVideoTrackRef.current = nextTrack;
		const capabilities = nextTrack?.getCapabilities?.() as MediaTrackCapabilities & {
			torch?: boolean;
		};
		const hasTorch = Boolean(capabilities?.torch);
		setIsTorchAvailable(hasTorch);
		if (!hasTorch) {
			setIsTorchOn(false);
		}
	}, []);

	const toggleTorch = useCallback(async () => {
		const track = activeVideoTrackRef.current;
		if (!track || !isTorchAvailable) return;

		const nextTorchState = !isTorchOn;
		try {
			await track.applyConstraints({
				advanced: [{ torch: nextTorchState } as MediaTrackConstraintSet],
			});
			setIsTorchOn(nextTorchState);
		} catch {
			setError('Flashlight is not available on this camera.');
		}
	}, [isTorchAvailable, isTorchOn]);

	const loadZxingModule = useCallback(async () => {
		if (!zxingModuleRef.current) {
			zxingModuleRef.current = await import('@zxing/library');
		}
		return zxingModuleRef.current;
	}, []);

	const getZxingReader = useCallback(async () => {
		if (!zxingReaderRef.current) {
			const zxing = await loadZxingModule();
			const hints = new Map();
			hints.set(zxing.DecodeHintType.POSSIBLE_FORMATS, [
				zxing.BarcodeFormat.CODE_128,
				zxing.BarcodeFormat.CODE_39,
				zxing.BarcodeFormat.EAN_13,
				zxing.BarcodeFormat.EAN_8,
				zxing.BarcodeFormat.UPC_A,
				zxing.BarcodeFormat.UPC_E,
				zxing.BarcodeFormat.QR_CODE,
				zxing.BarcodeFormat.DATA_MATRIX,
			]);
			zxingReaderRef.current = new zxing.BrowserMultiFormatReader(hints);
		}
		return zxingReaderRef.current;
	}, [loadZxingModule]);

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
				const zxingReader = await getZxingReader();
				const imageUrl = URL.createObjectURL(file);
				try {
					const decodedBarcode = await zxingReader.decodeFromImageUrl(imageUrl);
					const decodedValue = decodedBarcode.getText().trim();
					if (decodedValue) {
						setCaptureEngineLabel('ZXing barcode decode from image');
						setManualValue(decodedValue);
						captureValue(decodedValue);
						return;
					}
				} catch {
					// Fall through to OCR extraction when no machine-readable barcode is found.
				} finally {
					URL.revokeObjectURL(imageUrl);
				}

				const tesseractModule = await import('tesseract.js');
				const worker = await (tesseractModule as any).createWorker('eng');
				const result = await worker.recognize(file);
				await worker.terminate();

				const extractedText = String(result?.data?.text || '').trim();
				if (!extractedText) {
					setOcrError('No readable text was detected on this image. Try a clearer photo.');
					return;
				}

				setCaptureEngineLabel('OCR text extraction');
				setManualValue(extractedText);
				captureValue(extractedText);
			} catch {
				setOcrError('Unable to extract text from this image. Please try another photo.');
			} finally {
				setIsExtractingText(false);
			}
		},
		[captureValue, getZxingReader],
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

	const capturePhotoFromCamera = useCallback(async () => {
		const video = videoRef.current;
		if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
			setOcrError('Camera preview is not ready yet. Try again in a moment.');
			return;
		}

		setOcrError('');
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext('2d');
		if (!context) {
			setOcrError('Could not capture this image. Try again.');
			return;
		}

		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
		setSelectedImagePreview(previewUrl);

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.92);
		});
		if (!blob) {
			setOcrError('Could not capture this image. Try again.');
			return;
		}

		const capturedFile = new File([blob], `maintley-label-${Date.now()}.jpg`, {
			type: 'image/jpeg',
		});
		setSelectedImageFile(capturedFile);
		await extractTextFromImage(capturedFile);
	}, [extractTextFromImage]);

	useEffect(() => {
		if (!isOpen) {
			stopScanner();
			setError('');
			setManualValue('');
			setCapturedValue('');
			setAnalysis(null);
			setRelabelRows([]);
			setActiveMethod(defaultMethod);
			setSelectedImageFile(null);
			setSelectedImagePreview('');
			setIsExtractingText(false);
			setOcrError('');
			setCaptureEngineLabel('');
			return;
		}

		if (analysis) {
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
					activeMethod === 'barcode' && !supportsBarcodeDetector
						? 'Native browser barcode detection is unavailable. Maintley will use ZXing decoding instead.'
						: '',
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
				syncTorchAvailability(stream);
				const video = videoRef.current;
				if (!video) return;
				video.srcObject = stream;
				await video.play();

				if (activeMethod !== 'barcode') {
					setCaptureEngineLabel('Camera capture for OCR');
					return;
				}

				if (!supportsBarcodeDetector) {
					setCaptureEngineLabel('ZXing live decode');
				}

				let captured = false;
				const handleCapture = (value: string, engine: string) => {
					if (captured || cancelled) return;
					captured = true;
					setCaptureEngineLabel(engine);
					captureValue(value);
				};

				if (supportsBarcodeDetector) {
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
						if (!videoRef.current || captured || cancelled) return;
						try {
							const results = (await detector.detect(videoRef.current)) as BarcodeScanResult[];
							if (results.length > 0 && results[0].rawValue) {
								handleCapture(results[0].rawValue, 'Native browser barcode detector');
								return;
							}
						} catch {
							// Keep scanning even if one frame errors.
						}
						rafRef.current = requestAnimationFrame(tick);
					};

					rafRef.current = requestAnimationFrame(tick);
				}

				const zxing = await loadZxingModule();
				const zxingReader = await getZxingReader();
				await zxingReader.decodeFromStream(
					stream,
					video,
					(result, decodeError) => {
						if (captured || cancelled) return;
						if (result?.getText()) {
							handleCapture(result.getText(), 'ZXing live decode');
							return;
						}
						if (
							decodeError &&
							!(decodeError instanceof zxing.NotFoundException) &&
							!supportsBarcodeDetector
						) {
							setError('ZXing could not decode the current frame. Try better lighting or move closer.');
						}
					},
				);
				zxingStopRef.current = () => zxingReader.reset();
			} catch {
				setError('Unable to access camera. Check browser permissions and try again.');
			}
		};

		setup();

		return () => {
			cancelled = true;
			stopScanner();
		};
	}, [
		activeMethod,
		analysis,
		captureValue,
		capturePhotoFromCamera,
		defaultMethod,
		getZxingReader,
		isOpen,
		loadZxingModule,
		syncTorchAvailability,
		stopScanner,
		supportsBarcodeDetector,
		supportsCameraAccess,
	]);

	const tabLabels = useMemo(() => {
		if (captureIntent === 'appliance') {
			return {
				barcode: 'Barcode Scan (Helper)',
				photo: 'Label Scan (Recommended)',
			};
		}

		return {
			barcode: 'Barcode / QR Scan',
			photo: 'Label Photo (OCR)',
		};
	}, [captureIntent]);

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
					<GuidanceCard>
						<InspectorTitle style={{ fontSize: '12px' }}>Capture assistant flow</InspectorTitle>
						<Helper>
							Capture first, then confirm what should be applied. Nothing is saved until you tap an Apply button.
						</Helper>
					</GuidanceCard>
					<MethodTabs>
						<MethodTabButton
							type='button'
							$active={activeMethod === 'barcode'}
							onClick={() => setActiveMethod('barcode')}>
							{tabLabels.barcode}
						</MethodTabButton>
						<MethodTabButton
							type='button'
							$active={activeMethod === 'photo'}
							onClick={() => setActiveMethod('photo')}>
							{tabLabels.photo}
						</MethodTabButton>
					</MethodTabs>

					{!analysis && activeMethod === 'barcode' && (
						<>
							<VideoWrap>
								<Video ref={videoRef} playsInline muted />
							</VideoWrap>
							<CameraToolbar>
								<GhostButton
									type='button'
									onClick={() => void toggleTorch()}
									disabled={!isTorchAvailable}>
									{isTorchOn ? 'Flashlight Off' : 'Flashlight On'}
								</GhostButton>
							</CameraToolbar>
							<Helper>
								Use this when the label has a UPC/EAN/QR code. Appliance barcodes may not include full make/model/serial data.
							</Helper>
							<EngineHint>Engines: Native BarcodeDetector + ZXing fallback</EngineHint>
						</>
					)}

					{!analysis && activeMethod === 'photo' && (
						<>
							{supportsCameraAccess && (
								<>
									<VideoWrap>
										<Video ref={videoRef} playsInline muted />
									</VideoWrap>
									<CameraToolbar>
										<GhostButton
											type='button'
											onClick={() => void toggleTorch()}
											disabled={!isTorchAvailable}>
											{isTorchOn ? 'Flashlight Off' : 'Flashlight On'}
										</GhostButton>
										<ActionButton
											type='button'
											onClick={() => void capturePhotoFromCamera()}>
											Capture From Camera
										</ActionButton>
									</CameraToolbar>
								</>
							)}
							<Helper>
								Take or upload the equipment sticker. This path usually finds model and serial details more reliably.
							</Helper>
							<Helper>
								Tip: fill the frame with the label, reduce glare, and keep text horizontal for best OCR results.
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
								Standardized structure: raw value, detected key-value pairs, GS1 segments, and normalized appliance/part mappings. Review before applying.
							</InspectorHint>
							{captureEngineLabel && <EngineHint>Captured via: {captureEngineLabel}</EngineHint>}
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
												<PillRow>
													<ConfidenceBadge
														$tone={confidenceFromField(
															row.sourceKey,
															row.targetKey,
															row.value,
														)}>
														{confidenceFromField(
															row.sourceKey,
															row.targetKey,
															row.value,
														)}
														confidence
													</ConfidenceBadge>
												</PillRow>
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
