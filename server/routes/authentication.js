const express = require('express');

const authenticationRoutes = express.Router();

const dbo = require('../db/conn');

const ObjectId = require('mongodb').ObjectId;

authenticationRoutes.route('/authentication').get((req, res) => {
	let db_connect = dbo.getDb('Authentication');

	db_connect
		.collection('users')
		.find({ email: 'austin.dober@gmail.com' })
		.toArray((err, results) => {
			if (err) throw err;

			res.json(results);
		});
});

module.exports = authenticationRoutes;
