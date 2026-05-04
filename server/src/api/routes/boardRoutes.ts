import express, { Request, Response } from 'express';
import boardModel from '../models/boardModel';
import teamModel from '../models/teamModel';
import { getAuthenticatedUser } from '../utils/auth';

const router = express.Router();

const isBoardAccessibleByUser = async (boardId: string, userId: string) => {
    const board = await boardModel.findById(boardId);
    if (!board) return { board: null, allowed: false };

    if (!board.teamId) { // personal board, only accessible by owner
        return {
            board,
            allowed: board.owner.equals(userId),
        };
    }

    const team = await teamModel.findById(board.teamId);
    if (!team) return { board: null, allowed: false };

    const allowed = team.owner.equals(userId) || team.members.some((memberId) => memberId.equals(userId));
    return { board, allowed };
};

router.post('/create', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { title, teamId, boardData } = req.body;
        const isPersonal = !teamId;

        if (teamId) {
            const team = await teamModel.findById(teamId);
            if (!team) return res.status(404).json({ error: 'Team not found' });

            const isTeamMember = team.members.some((memberId) => memberId.equals(authenticatedUser._id));
            const isTeamOwner = team.owner.equals(authenticatedUser._id);
            if (!isTeamMember && !isTeamOwner) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const newBoard = new boardModel({
            title: title ?? 'Untitled board',
            owner: authenticatedUser._id,
            isPersonal,
            teamId: teamId ?? null,
            boardData,
        });

        await newBoard.save();
        return res.status(201).json(newBoard);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// gets all private boards
router.get('/mine', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const boards = await boardModel.find({ owner: authenticatedUser._id, teamId: null });
        return res.status(200).json(boards);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// gets all boards for a team that the authenticated user has access to
router.get('/team/:teamId', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { teamId } = req.params;
        const team = await teamModel.findById(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const isTeamMember = team.members.some((memberId) => memberId.equals(authenticatedUser._id));
        const isTeamOwner = team.owner.equals(authenticatedUser._id);
        if (!isTeamMember && !isTeamOwner) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const boards = await boardModel.find({ teamId });
        return res.status(200).json(boards);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// gets a board by id if the authenticated user has access to it
router.get('/:boardId', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { board, allowed } = await isBoardAccessibleByUser(req.params.boardId, String(authenticatedUser._id));
        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (!allowed) return res.status(403).json({ error: 'Forbidden' });

        return res.status(200).json(board);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// updates a board by id if the authenticated user has access to it
router.put('/:boardId', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { board, allowed } = await isBoardAccessibleByUser(req.params.boardId, String(authenticatedUser._id));
        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (!allowed) return res.status(403).json({ error: 'Forbidden' });

        const { title, boardData } = req.body;
        if (typeof title === 'string') board.title = title;
        if (boardData) board.boardData = boardData;

        await board.save();
        return res.status(200).json(board);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:boardId', async (req: Request, res: Response) => {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) return res.status(401).json({ error: 'Unauthorized' });

        const { board, allowed } = await isBoardAccessibleByUser(req.params.boardId, String(authenticatedUser._id));
        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (!allowed) return res.status(403).json({ error: 'Forbidden' });

        await board.deleteOne();
        return res.status(200).json({ message: 'Board deleted' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
