import express, { Response, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';
import { getAuthenticatedUser } from '../utils/auth';

const router = express.Router();

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if the email is already in use
        let user = await userModel.findOne({ email });
        if (user) return res.status(400).json({ error:'Email already in use' });

        user = await userModel.findOne({ username });
        if (user) return res.status(400).json({ error:'Username already in use' });

        // Create the new user
        const newUser = new userModel({
            username, 
            email,
            password: await bcrypt.hash(password, 10), // Hash the password before saving it to the database to increase security
        });

        // Save the new user to the database
        await newUser.save();

        const payload = { userId: newUser._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET ?? "", { expiresIn: '30d' }); // Sign the JWT for 30 days
        res.status(201).json({token});    
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Log in a user
router.put('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check if the email exists in the database
        const user = await userModel.findOne({email});  
        if (!user) return res.status(401).json({ error: 'Email not found' }) 

        // Compare the password with the hashed password in the database
        const isMatching = await bcrypt.compare(password, user.password); 
        if (!isMatching)  return res.status(401).json({ error: 'Invalid password' }) 

        // Generate a JWT with the user's ID
        const payload: JwtPayload = { userId: user._id }; 
        const token = jwt.sign(payload, process.env.JWT_SECRET ?? "", { expiresIn: '30d' }); // creez tokenul pentru 30 de zile

        // SUCCESS
        res.status(200).json({token});
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get the authenticated user's information
router.get('/me', async (req: Request, res: Response) => { 
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        res.status(200).json(authenticatedUser);
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// uploads an avatar image (received from frontend as base64 string)
router.put('/avatar', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { avatarBase64 } = req.body;
        authenticatedUser.avatarBase64 = avatarBase64;
        await authenticatedUser.save();

        return res.status(200).json({ message: 'Avatar updated successfully!' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
