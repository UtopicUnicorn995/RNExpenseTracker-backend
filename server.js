require("dotenv").config();
const express = require("express");
const cors = require("cors");
const usersRoutes = require("./routes/usersRoutes");
const expensesRoutes = require("./routes/expensesRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", usersRoutes);
app.use("/api/expenses", expensesRoutes);

app.listen(3000, () => {
  console.log("server running on port 3000");
});
