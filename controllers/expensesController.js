const db = require("../db");

const createExpense = async (req, res) => {
  const { amount, description, category, date, id } = req.body;

  const currentDate = new Date().toISOString().split("T")[0];

  try {
    db.query("SELECT * FROM users WHERE id = ?", [id], async (err, result) => {
      if (err) {
        console.error("Error fetching user", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user = result[0];
      const currentBalance = parseFloat(user.available_balance);
      const expenseAmount = parseFloat(amount);
      const newBalance = currentBalance - expenseAmount;

      if (newBalance < 0) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      db.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error("Transaction error:", transactionErr);
          return res.status(500).json({ error: "Failed to start transaction" });
        }

        db.query(
          "UPDATE users SET available_balance = ? WHERE id = ?",
          [newBalance, id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error updating balance:", updateErr);
              return db.rollback(() =>
                res.status(500).json({ error: "Failed to update balance" })
              );
            }

            db.query(
              "INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)",
              [id, amount, 'payment', description || ""],
              (insertErr, insertResult) => {
                if (insertErr) {
                  console.error("Error creating transaction:", insertErr);
                  return db.rollback(() =>
                    res
                      .status(500)
                      .json({ error: "Failed to create transaction" })
                  );
                }

                db.query(
                  "INSERT INTO expenses (amount, description, category, date, user_id) VALUES (?, ?, ?, ?, ?)",
                  [
                    amount,
                    description,
                    category || "Uncategorized",
                    date || currentDate,
                    id,
                  ],
                  (expenseErr) => {
                    if (expenseErr) {
                      console.error("Error creating expense:", expenseErr);
                      return db.rollback(() =>
                        res
                          .status(500)
                          .json({ error: "Failed to create expense" })
                      );
                    }

                    db.commit((commitErr) => {
                      if (commitErr) {
                        console.error("Commit error:", commitErr);
                        return db.rollback(() =>
                          res
                            .status(500)
                            .json({ error: "Failed to commit transaction" })
                        );
                      }

                      return res.status(200).json({
                        message:
                          "Balance updated and transaction recorded successfully",
                        balance: newBalance,
                        transaction: insertResult.insertId,
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
