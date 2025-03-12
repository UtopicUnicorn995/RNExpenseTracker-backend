const express = require('express');
const {createUser, loginUser} = require('../controllers/usersController');
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUser);
console.log('router');

module.exports = router;
