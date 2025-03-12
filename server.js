require('dotenv').config()
const express = require('express');
const cors = require('cors');
const usersRoutes = require('./routes/usersRoutes')

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/users', usersRoutes)

app.listen(3000, () => {
  console.log('server running on port 3000');
});
