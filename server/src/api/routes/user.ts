import express, { Response, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';

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

        // @ts-ignore
        const userId = userModel.findOne({ email }).id ?? "";
        const payload = { userId: userId }; // Create a JWT payload with the user's ID
        const token = jwt.sign(payload, process.env.JWT_SECRET ?? "", { expiresIn: '30d' }); // Sign the JWT for 30 days
        res.status(200).json({token});    
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Log in a user
router.post('/login', async (req: Request, res: Response) => {
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
        const token = jwt.sign(payload, process.env.JWT_SECRET ?? "", { expiresIn: '30d' }); // Sign the JWT for 1

        // SUCCESS
        res.status(200).json({token});
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get the currently logged in user, you might need this when you want to display the user's name in the navbar for example
router.get('/getUserFromCookie', async (req: Request, res: Response) => { 
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) return res.sendStatus(401); // Unauthorized

        // Verify the JWT and extract the user's ID
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "");
        const userId = (typeof decodedToken === 'string') ? "" : decodedToken.userId;

        // Find the user in the database
        const user = await userModel.findById(userId).select('-password'); // Exclude the password from the returned data
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        res.status(200).json(user);
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;