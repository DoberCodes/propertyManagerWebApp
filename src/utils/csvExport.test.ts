import { generateCSV, downloadCSV, exportToCSV } from './csvExport';

describe('csvExport utilities', () => {
	describe('generateCSV', () => {
		it('should generate CSV with headers only for empty data', () => {
			const columns = ['name', 'email', 'age'];
			const result = generateCSV([], columns);

			expect(result).toBe('name,email,age');
		});

		it('should generate CSV with simple data', () => {
			const data = [
				{ name: 'John', email: 'john@example.com', age: 30 },
				{ name: 'Jane', email: 'jane@example.com', age: 25 },
			];
			const columns = ['name', 'email', 'age'];
			const result = generateCSV(data, columns);

			const expected =
				'name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25';
			expect(result).toBe(expected);
		});

		it('should handle values with commas by wrapping in quotes', () => {
			const data = [
				{ name: 'Doe, John', email: 'john@example.com' },
				{ name: 'Smith, Jane', email: 'jane@example.com' },
			];
			const columns = ['name', 'email'];
			const result = generateCSV(data, columns);

			expect(result).toContain('"Doe, John"');
			expect(result).toContain('"Smith, Jane"');
		});

		it('should escape quotes in values when they contain commas', () => {
			const data = [
				{ name: 'John "Johnny" Doe, Jr.', email: 'john@example.com' },
			];
			const columns = ['name', 'email'];
			const result = generateCSV(data, columns);

			expect(result).toContain('"John ""Johnny"" Doe, Jr."');
		});

		it('should handle nested properties with dot notation', () => {
			const data = [
				{ user: { name: 'John', address: { city: 'NYC' } } },
				{ user: { name: 'Jane', address: { city: 'LA' } } },
			];
			const columns = ['user.name', 'user.address.city'];
			const result = generateCSV(data, columns);

			expect(result).toContain('John,NYC');
			expect(result).toContain('Jane,LA');
		});

		it('should handle missing values as empty strings', () => {
			const data = [
				{ name: 'John', email: 'john@example.com' },
				{ name: 'Jane' },
			];
			const columns = ['name', 'email'];
			const result = generateCSV(data, columns);

			const lines = result.split('\n');
			expect(lines[2]).toBe('Jane,');
		});

		it('should handle null and undefined values', () => {
			const data = [
				{ name: 'John', email: null, age: undefined },
				{ name: null, email: undefined, age: 25 },
			];
			const columns = ['name', 'email', 'age'];
			const result = generateCSV(data, columns);

			expect(result).toContain('John,,');
			expect(result).toContain(',,25');
		});
	});

	describe('downloadCSV', () => {
		let createElementSpy: jest.SpyInstance;
		let appendChildSpy: jest.SpyInstance;
		let removeChildSpy: jest.SpyInstance;

		beforeEach(() => {
			// Mock DOM elements and methods
			const mockElement = {
				href: '',
				download: '',
				click: jest.fn(),
			};

			createElementSpy = jest
				.spyOn(document, 'createElement')
				.mockReturnValue(mockElement as any);
			appendChildSpy = jest
				.spyOn(document.body, 'appendChild')
				.mockImplementation(() => mockElement as any);
			removeChildSpy = jest
				.spyOn(document.body, 'removeChild')
				.mockImplementation(() => mockElement as any);

			// Mock URL.createObjectURL
			global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should create and trigger download of CSV file', () => {
			const csvData = 'name,email\nJohn,john@example.com';
			const filename = 'test.csv';

			downloadCSV(csvData, filename);

			expect(createElementSpy).toHaveBeenCalledWith('a');
			expect(appendChildSpy).toHaveBeenCalled();
			expect(removeChildSpy).toHaveBeenCalled();
		});

		it('should set correct filename', () => {
			const csvData = 'data';
			const filename = 'my-export.csv';
			let downloadAttr = '';

			createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
				set download(value: string) {
					downloadAttr = value;
				},
				get download() {
					return downloadAttr;
				},
				href: '',
				click: jest.fn(),
			} as any);

			downloadCSV(csvData, filename);

			expect(downloadAttr).toBe('my-export.csv');
		});
	});

	describe('exportToCSV', () => {
		beforeEach(() => {
			// Mock downloadCSV to avoid DOM manipulation
			jest.spyOn(document, 'createElement').mockReturnValue({
				href: '',
				download: '',
				click: jest.fn(),
			} as any);
			jest
				.spyOn(document.body, 'appendChild')
				.mockImplementation(() => null as any);
			jest
				.spyOn(document.body, 'removeChild')
				.mockImplementation(() => null as any);
			global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should export data to CSV file', () => {
			const options = {
				filename: 'users.csv',
				data: [
					{ name: 'John', email: 'john@example.com' },
					{ name: 'Jane', email: 'jane@example.com' },
				],
				columns: ['name', 'email'],
			};

			exportToCSV(options);

			expect(document.createElement).toHaveBeenCalledWith('a');
		});

		it('should handle empty data', () => {
			const options = {
				filename: 'empty.csv',
				data: [],
				columns: ['name', 'email'],
			};

			expect(() => exportToCSV(options)).not.toThrow();
		});
	});
});
