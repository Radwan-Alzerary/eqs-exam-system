//users.js in routes/users.js
const express = require('express');
const router = express.Router();
const User = require("../models/user");

const passport = require('passport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

uploadDir = 'public/img/webimage'
const bcrypt = require('bcrypt');
const sharp = require('sharp');

const MAX_SIZE = 500 * 1024; // 500 kilobytes

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/webimage/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });


router.get('/login', (req, res) => {
  res.render('login');
})
router.get('/register', (req, res) => {
  res.render('register')
})
router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin/approve',
  failureRedirect: '/admin/login',
  failureFlash: true,
}), (req, res, next) => {
})
router.post('/register', async (req, res) => {
  const { name, email, password, password2, role } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords don't match" });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  } else {
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        errors.push({ msg: 'Email already registered' });
        return res.status(409).json({ errors });
      }
      const newUser = new User({
        name,
        email,
        password,
        role
      });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;
      await newUser.save();
      req.flash('success_msg', 'You have now registered!');
      return res.redirect('/admin/login');
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  }
});
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});




module.exports = router;
