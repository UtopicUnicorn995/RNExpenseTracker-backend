const express = require("express");
const {
  createUser,
  loginUser,
  deleteUser,
  addBalance,
  subtractBalance,
  updateBalance,
} = require("../controllers/usersController");
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.delete("/delete", deleteUser);
router.put("/add-balance", addBalance);
router.put("/subtract-balance", subtractBalance);

console.log("router");

module.exports = router;
