const express = require('express');
const app = express();
const cors = require('cors');
const sqlite3 = require('sqlite');

app.use(cors);
app.use((req, res, next) => {
	res.setHeader('Access-Control_allow-Origin', '*');
	next();
});
app.use(express.json({ limit: '10mb' }));

let db = new sqlite3.Database('credentials.db', (err) => {
	if (err) {
		console.log(err);
	}
	console.log('Connected to database');
});

app.post('/validatePassword', (req, res) => {
	const { username, password } = req.body;
	// const { username, password } = {
	// 	username: 'austin.dober@gmail.com',
	// 	password: 'Testing123',
	// };

	db.all(
		`select * from credentials where username = '${username}' and password = '${password}'`,
		(err, rows) => {
			if (err) {
				console.log(err);
			}
			if (rows.length) {
				res.send({ validation: true });
			} else {
				res.send({ validation: false });
			}
		}
	);
});

app.listen(3001, () => console.log('Listening at port 3001'));
