const express = require("express");
const mongoose = require("mongoose");
const app = express();
const Class = require("./routes/class");
const Book = require("./routes/book");
const Series = require("./routes/series");
const Qr = require('./routes/qr')
const path = require("path");
const jwt = require('./jwt')
const cors = require('cors')
require('dotenv').config()
const noimposterallowed = require('./jwtMiddleware')
const logger = require('./logger')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
mongoose
.connect(process.env.database)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Could not connect to MongoDB", err));


app.use(cors());
app.get('/',(req,res)=>res.send("Api Working!"))
app.post('/login', (req, res) => {
  if (req.body.id === 'satyam2001' && req.body.password === 'satyamg2001') {
    const token = jwt.generateToken({name:'saytam'})
    res.status(200).send({ success: 'Successfully loggedin',token });
  } else {
    res.status(401).send({ error: 'Incorrect Username or password' });
  }
});
app.use("/class",noimposterallowed, Class);
app.use("/book",noimposterallowed, Book);
app.use("/series",noimposterallowed, Series);
app.use('/qr',noimposterallowed,Qr);

// Global error logger
app.use((err, req, res, next) => {
  logger.error(`Global Error ${err.message}`)
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
