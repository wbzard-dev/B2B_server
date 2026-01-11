const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Company = require("../models/Company");
const Distributor = require("../models/Distributor");

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        {
            user: {
                id: user.id,
                role: user.role,
                entityId: user.entityId,
                entityType: user.entityType,
            },
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
};

// @route   POST api/auth/register-company
// @desc    Register a new company and admin user
// @access  Public
exports.registerCompany = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { companyName, name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        let company = await Company.findOne({ name: companyName });
        if (company)
            return res.status(400).json({ msg: "Company already exists" });

        company = new Company({
            name: companyName,
            isActive: true, // Auto-activate for MVP demo
        });
        await company.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: "company_admin",
            entityId: company.id,
            entityType: "Company",
        });
        await user.save();

        const token = generateToken(user);
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   POST api/auth/register-distributor
// @desc    Register a new distributor and admin user
// @access  Public
exports.registerDistributor = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { distributorName, name, email, password, companyId } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        // Verify company exists
        let targetCompanyId = companyId;

        // If no specific company requested, try to assign to the default/first one
        if (!targetCompanyId) {
            const company = await Company.findOne();
            if (company) {
                targetCompanyId = company.id;
            } else {
                // If the user modified schema to be optional, we can proceed without it
                // But for the logic of the app, we likely need it.
                // We'll log a warning but proceed if schema allows.
                console.warn(
                    "Registering distributor without a linked company."
                );
            }
        }

        const distributor = new Distributor({
            name: distributorName,
            companyId: targetCompanyId, // Can be null if schema allows and no company found
            status: "Pending",
        });
        await distributor.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: "distributor_admin",
            entityId: distributor.id,
            entityType: "Distributor",
        });
        await user.save();

        const token = generateToken(user);
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Invalid Credentials" });

        const token = generateToken(user);
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   POST api/auth/add-employee
// @desc    Company Admin adds a new employee (Company User)
// @access  Private (Company Admin)
exports.addEmployee = async (req, res) => {
    if (req.user.role !== "company_admin") {
        return res
            .status(403)
            .json({ msg: "Only company admins can add employees" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: "company_user",
            entityId: req.user.entityId,
            entityType: "Company",
        });

        await user.save();
        res.json({
            msg: "Employee added successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   GET api/auth/employees
// @desc    Get all employees for a company
// @access  Private (Company Admin)
exports.getEmployees = async (req, res) => {
    if (req.user.role !== "company_admin") {
        return res.status(403).json({ msg: "Not authorized" });
    }

    try {
        const employees = await User.find({
            entityId: req.user.entityId,
            role: "company_user",
        }).select("-password");
        res.json(employees);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   GET api/auth/me
// @desc    Get current logged in user
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};
exports.updateProfile = async (req, res) => {
    const { name, profileImage } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Update allowed fields only
        if (name) user.name = name;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        // Return updated user (without password)
        const updatedUser = await User.findById(req.user.id).select(
            "-password"
        );

        res.json({ user: updatedUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};
