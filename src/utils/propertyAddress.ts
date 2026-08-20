import { PropertyAddressDetails } from '../types/Property.types';

const EMPTY_ADDRESS_DETAILS: PropertyAddressDetails = {
	streetAddress: '',
	unit: '',
	city: '',
	state: '',
	postalCode: '',
	countryCode: 'US',
};

export const normalizePropertyAddressDetails = (
	details: PropertyAddressDetails,
): PropertyAddressDetails => ({
	streetAddress: details.streetAddress.trim(),
	unit: details.unit?.trim() || '',
	city: details.city.trim(),
	state: details.state.trim().toUpperCase(),
	postalCode: details.postalCode.trim(),
	countryCode: 'US',
});

export const formatPropertyAddress = (
	details?: PropertyAddressDetails,
): string => {
	if (!details) return '';
	const normalized = normalizePropertyAddressDetails(details);
	const statePostal = [normalized.state, normalized.postalCode]
		.filter(Boolean)
		.join(' ');

	return [
		normalized.streetAddress,
		normalized.unit,
		normalized.city,
		statePostal,
	]
		.filter(Boolean)
		.join(', ');
};

export const isCompletePropertyAddress = (
	details?: PropertyAddressDetails,
): boolean => {
	if (!details) return false;
	const normalized = normalizePropertyAddressDetails(details);

	return Boolean(
		normalized.streetAddress &&
			normalized.city &&
			/^[A-Z]{2}$/.test(normalized.state) &&
			/^\d{5}(?:-\d{4})?$/.test(normalized.postalCode),
	);
};

/**
 * Presents a legacy address in the structured form without persisting a guessed
 * migration. Only comma-delimited values with an unambiguous city/state/ZIP
 * ending are separated; otherwise the original value remains the street line.
 */
export const getPropertyAddressFormValues = (
	formattedAddress?: string,
	details?: PropertyAddressDetails,
): PropertyAddressDetails => {
	if (details) {
		return {
			...details,
			unit: details.unit || '',
			countryCode: 'US',
		};
	}

	const legacyAddress = formattedAddress?.trim();
	if (!legacyAddress) return { ...EMPTY_ADDRESS_DETAILS };

	const parts = legacyAddress
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	const statePostalMatch = parts.at(-1)?.match(
		/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/,
	);

	if (parts.length < 3 || !statePostalMatch) {
		return {
			...EMPTY_ADDRESS_DETAILS,
			streetAddress: legacyAddress,
		};
	}

	return {
		streetAddress: parts[0],
		unit: parts.length > 3 ? parts.slice(1, -2).join(', ') : '',
		city: parts.at(-2) || '',
		state: statePostalMatch[1].toUpperCase(),
		postalCode: statePostalMatch[2],
		countryCode: 'US',
	};
};
