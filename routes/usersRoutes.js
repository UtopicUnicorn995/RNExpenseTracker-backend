const express = require('express');
const {createUser, loginUser, deleteUser} = require('../controllers/usersController');
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUser);
router.put('/delete', deleteUser);
console.log('router');

module.exports = router;
