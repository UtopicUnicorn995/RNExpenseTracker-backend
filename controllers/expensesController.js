const db = require("../db");

const createExpense = async (req, res) => {
  const { amount, description, category, date, user_id } = req.body;

  db.query(
    `INSERT INTO expenses (amount, description, category, date, user_id) VALUES (?, ?, ?, ?, ?)`,
    [amount, description, category, date, user_id],
    (err, result) => {
      if (err) {
        console.error("Error creating expense:", err);
        res.status(500).send("An error occurred while creating the expense");
      } else {
        res.status(201).send("Expense created successfully");
      }
    }
  );
};

const getExpenses = async (req, res) => {
  const { user_id } = req.query;

  db.query(
    `SELECT * FROM expenses WHERE user_id = ?`,
    [user_id],
    (err, result) => {
      if (err) {
        console.error("Error fetching expenses:", err);
        res.status(500).send("An error occurred while fetching expenses");
      } else {
        res.status(200).json(result);
      }
    }
  );
};

const deleteExpense = async (req, res) => {
  const { id } = req.body;

  db.query(`DELETE FROM expenses WHERE id = ?`, [id], (err, result) => {
    if (err) {
      console.error("Error deleting expense:", err);
      res.status(500).send("An error occurred while deleting the expense");
    } else {
      res.status(200).send("Expense deleted successfully");
    }
  });
};

const updateExpense = async (req, res) => {
  const { id, amount, description, category, date } = req.body;

  db.query(
    `UPDATE expenses SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?`,
    [amount, description, category, date, id],
    (err, result) => {
      if (err) {
        console.error("Error updating expense:", err);
        res.status(500).send("An error occurred while updating the expense");
      } else {
        res.status(200).send("Expense updated successfully");
      }
    }
  );
};

module.exports = { createExpense, getExpenses, deleteExpense, updateExpense };
