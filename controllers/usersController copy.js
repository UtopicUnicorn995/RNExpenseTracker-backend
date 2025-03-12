const db = require('../db');
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
      [username, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database insertion failed' });
        }
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during user creation' });
  }
};

module.exports = { createUser };
