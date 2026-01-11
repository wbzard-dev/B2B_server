const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

// Register Company
router.post(
    "/register-company",
    [
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check(
            "password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }),
        check("companyName", "Company Name is required").not().isEmpty(),
    ],
    authController.registerCompany
);

// Register Distributor
router.post(
    "/register-distributor",
    [
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check(
            "password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }),
        check("distributorName", "Distributor Name is required")
            .not()
            .isEmpty(),
    ],
    authController.registerDistributor
);

// Login
router.post(
    "/login",
    [
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required").exists(),
    ],
    authController.login
);

// Register Employee
router.post(
    "/add-employee",
    [
        auth,
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check(
            "password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }),
    ],
    authController.addEmployee
);

// Get Employees
router.get("/employees", auth, authController.getEmployees);

// Get User
router.get("/me", auth, authController.getMe);
router.put("/update-profile", auth, authController.updateProfile);

module.exports = router;
