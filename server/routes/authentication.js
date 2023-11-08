const express = require('express');

const authenticationRoutes = express.Router();

const dbo = require('../db/conn');

const ObjectId = require('mongodb').ObjectId;

authenticationRoutes.route('/authentication/:id').get(async (req, res) => {
	let db_connect = dbo.getDb();

	let query = { _id: ObjectId(req.params.id) };
	try {
		const user = await db_connect.collection('users').findOne(query);
		res.json(user);
	} catch (e) {
		console.log('Error ', e);
	}
});

authenticationRoutes.route('/authentication').post(async (req, res) => {
	let db_connect = dbo.getDb();
	let query = { email: req.body.email };

	try {
		const user = await db_connect.collection('users').findOne(query);
		res.json(user);
	} catch (e) {
		console.log('Error ', e);
	}
});

authenticationRoutes.route('/authentication/create').post((req, res) => {
	let db_connect = dbo.getDb();

	let newUser = {
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
	};

	db_connect.collection('users').insertOne(newUser, (err, response) => {
		if (err) throw err;
		res.json(response);
	});
});

authenticationRoutes.route('/authentication/update/:id').post((req, res) => {
	let db_connect = dbo.getDb();

	let query = { _id: ObjectId(req.params.id) };

	let updatedUser = {
		$set: {
			username: req.body.username,
			email: req.body.email,
			password: req.body.password,
		},
	};

	db_connect
		.collection('users')
		.updateOne(query, updatedUser, (err, response) => {
			if (err) throw err;
			console.log('1 document updated');
			res.json(response);
		});
});

authenticationRoutes.route('/:id').delete((req, res) => {
	let db_connect = dbo.getDb();

	let query = { _id: ObjectId(req.params.id) };

	db_connect.collection('users').deleteOne(query, (err, response) => {
		if (err) throw err;
		console.log('1 document deleted');
		res.json(response);
	});
});

module.exports = authenticationRoutes;
