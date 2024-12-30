// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");



require("dotenv").config();
require("./config/database");
require("./config/passport")(passport);

require("./models/user");

const app = express();
const port = process.env.PORT || 4005;

// Middleware
app.use(compression());
app.use(morgan("dev"));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Use flash + passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Use your main routes (index.js)
app.use(require("./routes"));








// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
