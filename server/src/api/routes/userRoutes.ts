import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/userModel";
import { getAuthenticatedUser } from "../utils/auth";

const router = express.Router();

const serializeUser = (user: any) => {
    const userObject = typeof user?.toObject === "function" ? user.toObject() : user;
    const { password, userType, ...safeUser } = userObject;

    return {
        ...safeUser,
        userType: userType ?? "user",
    };
};

const createGuestIdentity = () => {
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        username: `Guest-${suffix.slice(0, 8)}`,
        email: `guest-${suffix}@local`,
    };
};

const createGuestSession = async () => {
    const { username, email } = createGuestIdentity();

    const guestUser = new userModel({
        username,
        email,
        password: await bcrypt.hash(
            `${email}-${Math.random().toString(36)}`,
            10,
        ),
        userType: "guest",
    });

    await guestUser.save();

    const token = jwt.sign(
        { userId: guestUser._id },
        process.env.JWT_SECRET ?? "",
        { expiresIn: "30d" },
    );
    return { token, ...serializeUser(guestUser) };
};

// Registers a new user and returns a JWT plus the user profile.
router.post("/register", async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (await userModel.findOne({ email })) {
            return res.status(400).json({ error: "Email already in use" });
        }

        if (await userModel.findOne({ username })) {
            return res.status(400).json({ error: "Username already in use" });
        }

        const newUser = new userModel({
            username,
            email,
            password: await bcrypt.hash(password, 10),
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET ?? "",
            { expiresIn: "30d" },
        );
        return res.status(201).json({ token, ...serializeUser(newUser) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Logs in a user and returns a JWT plus the user profile.
router.put("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) return res.status(401).json({ error: "Email not found" });

        const isMatching = await bcrypt.compare(password, user.password);
        if (!isMatching)
            return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET ?? "",
            { expiresIn: "30d" },
        );
        return res.status(200).json({ token, ...serializeUser(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Creates an anonymous guest session that can view shared boards.
router.post("/guest", async (req: Request, res: Response) => {
    try {
        const guestSession = await createGuestSession();
        return res.status(201).json(guestSession);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Returns the currently authenticated user.
router.get("/me", async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser)
            return res.status(401).json({ error: "Unauthorized" });

        return res.status(200).json(serializeUser(authenticatedUser));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Updates the authenticated user's username.
router.patch("/username", async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser)
            return res.status(401).json({ error: "Unauthorized" });
        if (authenticatedUser.userType === "guest")
            return res.status(403).json({ error: "Forbidden" });

        const nextUsername = String(req.body.username ?? "").trim();
        if (!nextUsername) {
            return res.status(400).json({ error: "Username is required" });
        }

        const existingUser = await userModel.findOne({
            username: nextUsername,
            _id: { $ne: authenticatedUser._id },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Username already in use" });
        }

        authenticatedUser.username = nextUsername;
        await authenticatedUser.save();

        return res.status(200).json(serializeUser(authenticatedUser));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Returns users that match a username search query.
router.get("/search", async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser)
            return res.status(401).json({ error: "Unauthorized" });
        if (authenticatedUser.userType === "guest")
            return res.status(403).json({ error: "Forbidden" });

        const query = String(req.query.query ?? "").trim();
        if (!query) return res.status(200).json([]);

        const users = await userModel
            .find({
                _id: { $ne: authenticatedUser._id },
                username: { $regex: query, $options: "i" }, // i inseamna case insensitive
            })
            .limit(10);

        return res.status(200).json(users.map(serializeUser));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

//ia o lista de id-uri si intoarce userii corespunzatori
router.get("/lookup", async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser)
            return res.status(401).json({ error: "Unauthorized" });
        if (authenticatedUser.userType === "guest")
            return res.status(403).json({ error: "Forbidden" });

        const ids = String(req.query.ids ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (ids.length === 0) return res.status(200).json([]);

        const users = await userModel.find({ _id: { $in: ids } });
        return res.status(200).json(users.map(serializeUser));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;

//la fiecare request, frontend-ul trimite tokenul în authorization
