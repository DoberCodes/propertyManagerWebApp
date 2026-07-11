import {
	analyzeBarcodePayload,
	parseDeviceBarcodePayload,
	parsePartBarcodePayload,
} from './barcodeScanParser';

describe('barcodeScanParser', () => {
	it('extracts equipment model and serial from common sticker labels', () => {
		const parsed = parseDeviceBarcodePayload(`
			WHIRLPOOL CORPORATION
			MODEL NO. WTW4816FW3    SERIAL NO. C91234567
			TYPE 587-20
		`);

		expect(parsed.model).toBe('WTW4816FW3');
		expect(parsed.serialNumber).toBe('C91234567');
		expect(parsed.type).toBe('587-20');
		expect(parsed.brand).toBe('Whirlpool');
	});

	it('extracts slash abbreviations from HVAC labels', () => {
		const parsed = parseDeviceBarcodePayload(`
			MFR: Trane
			M/N 4TWR4036G1000AA
			S/N 19123ABC4F
		`);

		expect(parsed.brand).toBe('Trane');
		expect(parsed.model).toBe('4TWR4036G1000AA');
		expect(parsed.serialNumber).toBe('19123ABC4F');
	});

	it('uses the next OCR line when label and value are split', () => {
		const parsed = parseDeviceBarcodePayload(`
			Model Number
			FGHD2368TF8
			Serial Number
			4A12345678
		`);

		expect(parsed.model).toBe('FGHD2368TF8');
		expect(parsed.serialNumber).toBe('4A12345678');
	});

	it('handles common OCR key misreads from sticker photos', () => {
		const parsed = parseDeviceBarcodePayload(`
			M0DEL N0: AZF31X16
			S1N 49A8BC123
			P1N AB-4455
		`);

		expect(parsed.model).toBe('AZF31X16');
		expect(parsed.serialNumber).toBe('49A8BC123');
		expect(parsed.partNumber).toBe('AB-4455');
	});

	it('normalizes OCR dash and spacing noise in equipment identifiers', () => {
		const parsed = parseDeviceBarcodePayload(`
			LENNOX
			Model Number
			CHX35 - 36B - 6F - 1
			Serial Number
			abc - 123 - xy
		`);

		expect(parsed.brand).toBe('Lennox');
		expect(parsed.model).toBe('CHX35-36B-6F-1');
		expect(parsed.serialNumber).toBe('ABC-123-XY');
	});

	it('does not turn raw OCR text into equipment service notes', () => {
		const parsed = parseDeviceBarcodePayload(`
			LENNOX
			Model: CHX35-36B-6F-1
			Serial: 123456789
		`);

		expect(parsed.specNotes).toBeUndefined();
	});

	it('extracts part fields from filter packaging text', () => {
		const parsed = parsePartBarcodePayload(`
			Brand: Filtrete
			Part No: AD01-2PK-1E
			Filter Size: 16x25x1
			MERV 11
		`);

		expect(parsed.manufacturer).toBe('Filtrete');
		expect(parsed.partNumber).toBe('AD01-2PK-1E');
		expect(parsed.size).toBe('16x25x1');
		expect(parsed.mervRating).toBe('11');
	});

	it('infers equipment type when sticker text names the equipment', () => {
		const parsed = parseDeviceBarcodePayload(`
			A. O. SMITH
			GAS WATER HEATER
			M/N GCR-40
			S/N 1234ABC
		`);

		expect(parsed.brand).toBe('A. O. Smith');
		expect(parsed.type).toBe('Water Heater');
		expect(parsed.model).toBe('GCR-40');
		expect(parsed.serialNumber).toBe('1234ABC');
	});

	it('shows normalized fields in the scanner inspector analysis', () => {
		const analysis = analyzeBarcodePayload('MODEL: ABC123; S/N: XYZ789');

		expect(analysis.keyValuePairs.model).toBe('ABC123');
		expect(analysis.keyValuePairs.sn).toBe('XYZ789');
		expect(analysis.normalized.device.model).toBe('ABC123');
		expect(analysis.normalized.device.serialNumber).toBe('XYZ789');
	});
});
