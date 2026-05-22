import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel';
import { getAuthenticatedUser } from '../utils/auth';

const router = express.Router();

const serializeUser = (user: any) => {
    const { password, ...safeUser } = user.toObject();

    return safeUser;
};

// Registers a new user and returns a JWT plus the user profile.
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (await userModel.findOne({ email })) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        if (await userModel.findOne({ username })) {
            return res.status(400).json({ error: 'Username already in use' });
        }

        const newUser = new userModel({
            username,
            email,
            password: await bcrypt.hash(password, 10),
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET ?? '', { expiresIn: '30d' });
        return res.status(201).json({ token, ...serializeUser(newUser) });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Logs in a user and returns a JWT plus the user profile.
router.put('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Email not found' });

        const isMatching = await bcrypt.compare(password, user.password);
        if (!isMatching) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET ?? '', { expiresIn: '30d' });
        return res.status(200).json({ token, ...serializeUser(user) });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Returns the currently authenticated user.
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        return res.status(200).json(serializeUser(authenticatedUser));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Returns users that match a username search query.
router.get('/search', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const query = String(req.query.query ?? '').trim();
        if (!query) return res.status(200).json([]);

        const users = await userModel
            .find({
                _id: { $ne: authenticatedUser._id },
                username: { $regex: query, $options: 'i' }, // i inseamna case sensitive
            })
            .limit(10);

        return res.status(200).json(users.map(serializeUser));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

//ia o lista de id-uri si intoarce userii corespunzatori
router.get('/lookup', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const ids = String(req.query.ids ?? '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);

        if (ids.length === 0) return res.status(200).json([]);

        const users = await userModel.find({ _id: { $in: ids } });
        return res.status(200).json(users.map(serializeUser));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;


//la fiecare request, frontend-ul trimite tokenul în authorization