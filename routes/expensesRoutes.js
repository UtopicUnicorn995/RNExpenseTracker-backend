const express = require("express");
const {
  createExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
} = require("../controllers/expensesController");
const router = express.Router();

router.post("/create-expense", createExpense);
console.log("router");

module.exports = router;
