/* Quick Resend connection check (safe — does NOT send email)
   Usage: from repo root run `npm --prefix functions run check-resend`
   The script loads ../.env, reads RESEND_API_KEY and requests /domains.
*/

const path = require('path');
const dotenv = require('dotenv');

// load env from functions/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
	console.error(
		'RESEND_API_KEY is not set in environment (check .env or Firebase config)',
	);
	process.exit(1);
}

(async () => {
	try {
		const response = await fetch('https://api.resend.com/domains', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		const body = await response.json().catch(() => ({}));

		if (response.ok) {
			console.log('✅ Resend connection OK — API key is valid');
			console.log(`HTTP ${response.status} — domains endpoint reachable`);
			if (Array.isArray(body?.data)) {
				console.log(`domains found: ${body.data.length}`);
			}
			process.exit(0);
		}

		console.error('⚠️ Unexpected Resend response:', response.status);
		console.error(JSON.stringify(body, null, 2));
		process.exit(2);
	} catch (err) {
		console.error('❌ Resend connection failed:');
		console.error(err && err.message ? err.message : String(err));
		process.exit(3);
	}
})();
