const MAX_BASE64_IMAGE_BYTES = 700 * 1024; // ~700KB to stay under Firestore doc size limits

const readFileAsDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as data URL'));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});

/**
 * Convert image file to base64 data URL
 */
export const uploadToBase64 = async (file: File): Promise<string> => {
	try {
		console.log('Starting base64 conversion:', {
			fileSize: file.size,
			fileType: file.type,
		});

		const dataUrl = await readFileAsDataUrl(file);
		console.log('Base64 conversion complete');
		return dataUrl;
	} catch (error) {
		console.error('Base64 conversion error:', error);
		throw new Error('Failed to read image. Please try another file.');
	}
};

export const isValidImageFile = (file: File): boolean => {
	if (!file.type.startsWith('image/')) {
		return false;
	}

	if (file.size > MAX_BASE64_IMAGE_BYTES) {
		return false;
	}

	return true;
};
