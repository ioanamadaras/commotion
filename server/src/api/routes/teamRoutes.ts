import express, { Response, Request } from 'express';
import teamModel from '../models/teamModel';
import { getAuthenticatedUser } from '../utils/auth';

const router = express.Router();

router.post('/create', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { name } = req.body;

        // generate a 6 char wide random non-case-sensitive key with english letters and digits.
        const key = Math.random().toString(36).substring(2, 8);

        // Create the new team
        const newTeam = new teamModel({
            name, 
            key,
            owner: authenticatedUser._id,
            members: [authenticatedUser._id],
        });
        await newTeam.save();

        return res.status(201).json(newTeam);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// joins a user to a team using a 6digit code.
router.put('/join', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const team = await teamModel.findOne({ key: req.body.key });
        if (!team) return res.status(401).json({ error: 'Invalid key' });

        // add user to team:
        if (!team.members.some((memberId) => memberId.equals(authenticatedUser._id))) {
            team.members.push(authenticatedUser._id);
            await team.save();
        } else {
            return res.status(400).json({ error: 'User already in team' });
        }

        return res.status(201).json(team);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/leave', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const team = await teamModel.findById(req.body.teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // remove user from team:
        team.members = team.members.filter((memberId) => !memberId.equals(authenticatedUser._id));
        await team.save();

        return res.status(200).json({ message: 'Left team successfully!' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
