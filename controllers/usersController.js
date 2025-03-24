const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateAccountNumber = () => {
  const accountNumber = Math.floor(
    100000000000000 + Math.random() * 900000000000000
  );
  return accountNumber.toString();
};

// db.query(
//   "ALTER TABLE users ADD COLUMN account_number VARCHAR(20) UNIQUE;",
//   (err, result) => {
//     if (err) {
//       console.error("Error adding account_number column:", err);
//     } else {
//       console.log("Added account_number column to users table");
//     }
//   }
// );

// db.query(
//   "SELECT id FROM users WHERE account_number IS NULL",
//   async (err, users) => {
//     if (err) {
//       console.error("Error fetching users:", err);
//       return;
//     }

//     for (let user of users) {
//       const accountNumber = generateAccountNumber();

//       db.query(
//         "UPDATE users SET account_number = ? WHERE id = ?",
//         [accountNumber, user.id],
//         (err, result) => {
//           if (err) {
//             console.error(`Error updating user ${user.id}:`, err);
//           } else {
//             console.log(
//               `Updated user ${user.id} with account number ${accountNumber}`
//             );
//           }
//         }
//       );
//     }
//   }
// );

const createUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (username, email, password, role, available_balance, account_number) VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, "user", 0, generateAccountNumber()],
      (err, result) => {
        if (err) {
          console.error(err);

          if (err.code === "ER_DUP_ENTRY") {
            let duplicateField = "";

            if (err.message.includes("username")) {
              duplicateField = "Username";
            } else if (err.message.includes("email")) {
              duplicateField = "Email";
            }

            return res.status(409).json({
              error: `${duplicateField || "Entry"} already exists`,
            });
          }

          return res.status(500).json({ error: "Database insertion failed" });
        }
        res.status(201).json({
          message: "User created successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during user creation" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database query failed" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            email: user.email,
            available_balance: user.available_balance,
            account_number: user.account_number,
            role: user.role,
          },
          process.env.JWT_SECRET
        );

        console.log("resss", token);

        return res.status(200).json({
          message: "Login successful",
          token,
          userId: user.id,
          username: user.username,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    db.query("SELECT * FROM users WHERE id = ?", [id], async (err, result) => {
      if (err) {
        console.error("Error fetching user", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      db.query(
        "UPDATE users SET is_active = ? WHERE id = ?",
        [0, id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating user: ", updateErr);
            return res.status(500).json({ error: "Failed to deactivate user" });
          }

          return res
            .status(200)
            .json({ message: "User deactivated successfully", updateResult });
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error: ", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const addBalance = async (req, res) => {
  const { id, amount, description } = req.body;

  if (!id || !amount) {
    return res.status(400).json({ error: "User ID and amount are required" });
  }

  try {
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Error fetching user", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result[0];
      const currentBalance = parseFloat(user.available_balance);
      const addAmount = parseFloat(amount);

      const newBalance = currentBalance + addAmount;

      db.query(
        "UPDATE users SET available_balance = ? WHERE id = ?",
        [newBalance, id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating user balance:", updateErr);
            return res.status(500).json({ error: "Failed to update balance" });
          }

          db.query(
            "INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)",
            [id, amount, "deposit", description || ""],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error("Error creating transaction:", insertErr);
                return res
                  .status(500)
                  .json({ error: "Failed to create transaction" });
              }

              return res.status(200).json({
                message:
                  "Balance updated and transaction recorded successfully",
                balance: newBalance,
                transaction: insertResult,
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const subtractBalance = async (req, res) => {
  const { id, amount } = req.body;

  if (!id || !amount) {
    return res.status(400).json({ error: "User ID and amount are required" });
  }

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
      const newBalance = user.available_balance - amount;

      if (newBalance < 0) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      db.query(
        "UPDATE users SET available_balance = ? WHERE id = ?",
        [newBalance, id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating user: ", updateErr);
            return res.status(500).json({ error: "Failed to update balance" });
          }

          db.query(
            "INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)",
            [id, amount, "withdrawal", description || ""],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error("Error creating transaction:", insertErr);
                return res
                  .status(500)
                  .json({ error: "Failed to create transaction" });
              }

              return res.status(200).json({
                message:
                  "Balance updated and transaction recorded successfully",
                balance: newBalance,
                transaction: insertResult,
              });
            }
          );

          return res
            .status(200)
            .json({ message: "Balance updated successfully", updateResult });
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error: ", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const updateBalance = async (req, res) => {
  const { id, newBalance } = req.body;

  if (!id || !newBalance) {
    return res.status(400).json({ error: "User ID and amount are required" });
  }

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

      db.query(
        "UPDATE users SET available_balance = ? WHERE id = ?",
        [newBalance, id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating user: ", updateErr);
            return res.status(500).json({ error: "Failed to update balance" });
          }

          db.query(
            "INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)",
            [id, amount, "modify", description || ""],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error("Error creating transaction:", insertErr);
                return res
                  .status(500)
                  .json({ error: "Failed to create transaction" });
              }

              return res.status(200).json({
                message:
                  "Balance updated and transaction recorded successfully",
                balance: newBalance,
                transaction: insertResult,
              });
            }
          );

          return res
            .status(200)
            .json({ message: "Balance updated successfully", updateResult });
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error: ", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  createUser,
  loginUser,
  deleteUser,
  addBalance,
  subtractBalance,
  updateBalance,
};
