const crypto = require('crypto');

const TOKEN_LENGTH_MIN = 40;
const TOKEN_LENGTH_MAX = 80;
const VALID_CHARACTERS =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

const token = () => {
	const length = crypto.randomInt(TOKEN_LENGTH_MIN, TOKEN_LENGTH_MAX + 1);
	let result = '';
	for (let i = 0; i < length; i++) {
		result += VALID_CHARACTERS.charAt(
			crypto.randomInt(0, VALID_CHARACTERS.length),
		);
	}
	return result;
};

module.exports = token;
