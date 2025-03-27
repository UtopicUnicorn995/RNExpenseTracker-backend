const express = require("express");
const {
  createUser,
  loginUser,
  deleteUser,
  addBalance,
  subtractBalance,
  updateBalance,
  getTransactions
} = require("../controllers/usersController");
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.delete("/delete", deleteUser);
router.get("/get-transactions", getTransactions);
router.put("/add-balance", addBalance);
router.put("/subtract-balance", subtractBalance);
router.put("/update-balance", updateBalance);

console.log("router");

module.exports = router;
