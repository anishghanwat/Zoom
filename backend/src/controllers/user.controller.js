import httpStatus from 'http-status';
import { User } from "../models/user.model.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10; // Number of bcrypt salt rounds for hashing passwords

/**
 * LOGIN CONTROLLER
 * Authenticates the user based on username and password.
 */
const login = async (req, res) => {
    const { username, password } = req.body;

    // 1. Validate required input
    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        // 2. Check if the user exists in the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        // 3. Compare the given password with the hashed password stored in DB
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        // 4. Generate a random token (can be replaced with JWT for stateless auth)
        const token = crypto.randomBytes(20).toString("hex");

        // 5. Store token in DB (you can also store an expiry time for better security)
        user.token = token;
        // Example for expiry: user.tokenExpiresAt = Date.now() + 3600000; // 1 hour
        await user.save();

        // 6. Send token back to client
        return res.status(httpStatus.OK).json({ token });
    } catch (error) {
        // 7. Log the error internally and return generic error to client
        console.error("Login Error:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

/**
 * REGISTER CONTROLLER
 * Registers a new user by creating an account with hashed password.
 */
const register = async (req, res) => {
    const { name, username, password } = req.body;

    // 1. Validate required input fields
    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide all required fields" });
    }

    // 2. Validate password length
    if (password.length < 6) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must be at least 6 characters long" });
    }

    try {
        // 3. Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: 'User already exists!' });
        }

        // 4. Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 5. Create new user object
        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        // 6. Save new user to database
        await newUser.save();

        // 7. Send success response
        return res.status(httpStatus.CREATED).json({ message: 'User registered successfully' });
    } catch (error) {
        // 8. Log the error internally and return generic error to client
        console.error("Registration Error:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

export { login, register };
