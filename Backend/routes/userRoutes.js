const express = require("express");
const router = express.Router();

const { createUser, loginUser } = require("../controllers/userControllers");

router.post("/signup", createUser);
router.post("/login", loginUser);

module.exports = router;