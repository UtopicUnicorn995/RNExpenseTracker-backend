const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
          },
          process.env.JWT_SECRET
        );

        console.log("res", res);

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

module.exports = { createUser, loginUser, deleteUser };
