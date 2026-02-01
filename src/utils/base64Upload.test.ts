import { uploadToBase64, isValidImageFile } from './base64Upload';

describe('base64Upload utility functions', () => {
	describe('isValidImageFile', () => {
		it('should return true for valid image types under size limit', () => {
			const validFile = new File(['test'], 'test.png', { type: 'image/png' });
			expect(isValidImageFile(validFile)).toBe(true);
		});

		it('should return true for different valid image formats', () => {
			const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
			const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
			const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });
			const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

			expect(isValidImageFile(jpegFile)).toBe(true);
			expect(isValidImageFile(pngFile)).toBe(true);
			expect(isValidImageFile(gifFile)).toBe(true);
			expect(isValidImageFile(webpFile)).toBe(true);
		});

		it('should return false for non-image types', () => {
			const pdfFile = new File(['test'], 'test.pdf', {
				type: 'application/pdf',
			});
			const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });

			expect(isValidImageFile(pdfFile)).toBe(false);
			expect(isValidImageFile(textFile)).toBe(false);
		});

		it('should return false for files over size limit', () => {
			// Create a file larger than 700KB
			const largeContent = new Array(800 * 1024).fill('a').join('');
			const largeFile = new File([largeContent], 'large.png', {
				type: 'image/png',
			});

			expect(isValidImageFile(largeFile)).toBe(false);
		});
	});

	describe('uploadToBase64', () => {
		it('should convert file to base64 string', async () => {
			const mockFile = new File(['test content'], 'test.png', {
				type: 'image/png',
			});

			const result = await uploadToBase64(mockFile);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(result.startsWith('data:image/png;base64,')).toBe(true);
		});

		it('should handle empty file', async () => {
			const mockFile = new File([], 'empty.png', { type: 'image/png' });

			const result = await uploadToBase64(mockFile);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should reject with error for invalid file', async () => {
			const invalidFile = null as any;

			await expect(uploadToBase64(invalidFile)).rejects.toThrow();
		});

		it('should handle different file types', async () => {
			const jpegFile = new File(['jpeg content'], 'test.jpg', {
				type: 'image/jpeg',
			});
			const pngFile = new File(['png content'], 'test.png', {
				type: 'image/png',
			});

			const jpegResult = await uploadToBase64(jpegFile);
			const pngResult = await uploadToBase64(pngFile);

			expect(jpegResult.startsWith('data:image/jpeg;base64,')).toBe(true);
			expect(pngResult.startsWith('data:image/png;base64,')).toBe(true);
		});
	});
});
