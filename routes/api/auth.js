const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");


const User = require("../../models/User")

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", auth, async(req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   Post api/auth
// @desc    Authentucate user & get token
// @access  Public
router.post("/", [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required ').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      } 

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      }

      // console.log("secret", config.get('jwtSecret'))

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        });
      
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  
});


module.exports = router;