const express = require('express');
const bcrypt = require('bcryptjs');
const authenticationRoutes = express.Router();

const dbo = require('../db/conn');
const generateToken = require('../hooks/TokenGeneration');

const ObjectId = require('mongodb').ObjectId;

authenticationRoutes.route('/status').post(async (req, res) => {
	let db_connect = dbo.getAuthDb();
	const payload = { token: req.body.token };
	try {
		const userToken = await db_connect.collection('token').findOne(payload);
		const today = new Date().toDateString();
		const modified = new Date(userToken.modifiedDate).toDateString();
		if (userToken && new Date(modified) >= new Date(today)) {
			res.json(userToken.UserId);
		} else {
			res.status(204).send();
		}
	} catch (e) {
		res.status(400).json({ error: 'Invalid token' });
	}
});

authenticationRoutes.route('/authentication/:id').get(async (req, res) => {
	let db_connect = dbo.getAuthDb();
	let query = { _id: new ObjectId(req.params.id) };
	try {
		const user = await db_connect.collection('users').findOne(query);
		if (user) {
			res.json({ user: user.name });
		} else {
			res.status(404).json({ error: 'User not found' });
		}
	} catch (e) {
		res.status(400).json({ error: 'Invalid user ID' });
	}
});

authenticationRoutes.route('/authentication').post(async (req, res) => {
	let db_connect = dbo.getAuthDb();
	try {
		const user = await db_connect
			.collection('users')
			.findOne({ email: req.body.email });
		if (!user) {
			return res.status(400).json({ error: 'User not found' });
		}

		const isPasswordValid = await bcrypt.compare(
			req.body.password,
			user.password,
		);
		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Invalid password' });
		}

		const id = { UserId: user._id.toString() };
		const newToken = generateToken();
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const activation = {
			$set: {
				UserId: user._id.toString(),
				token: newToken,
				modifiedDate: tomorrow,
			},
		};

		const userToken = await db_connect.collection('token').findOne(id);
		if (userToken) {
			await db_connect.collection('token').updateOne(id, activation);
		} else {
			await db_connect.collection('token').insertOne(activation.$set);
		}

		res.status(200).json({
			username: user.name,
			UserId: activation.$set.UserId,
			token: activation.$set.token,
			modifiedDate: activation.$set.modifiedDate,
		});
	} catch (e) {
		res.status(500).json({ error: 'Authentication failed' });
	}
});

authenticationRoutes.route('/authentication/create').post(async (req, res) => {
	let db_connect = dbo.getAuthDb();
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		let newUser = {
			name: req.body.username,
			email: req.body.email,
			password: hashedPassword,
		};
		const response = await db_connect.collection('users').insertOne(newUser);
		res.json(response);
	} catch (e) {
		res.status(500).json({ error: 'Failed to create user' });
	}
});

authenticationRoutes
	.route('/authentication/update/:id')
	.post(async (req, res) => {
		let db_connect = dbo.getAuthDb();
		try {
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			let query = { _id: new ObjectId(req.params.id) };
			let updatedUser = {
				$set: {
					name: req.body.username,
					email: req.body.email,
					password: hashedPassword,
				},
			};
			const response = await db_connect
				.collection('users')
				.updateOne(query, updatedUser);
			res.json(response);
		} catch (e) {
			res.status(500).json({ error: 'Failed to update user' });
		}
	});

authenticationRoutes.route('/:id').delete(async (req, res) => {
	let db_connect = dbo.getAuthDb();
	try {
		let query = { _id: new ObjectId(req.params.id) };
		const response = await db_connect.collection('users').deleteOne(query);
		res.json(response);
	} catch (e) {
		res.status(500).json({ error: 'Failed to delete user' });
	}
});

module.exports = authenticationRoutes;
