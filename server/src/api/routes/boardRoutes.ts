import express, { Request, Response } from 'express';
import boardModel from '../models/boardModel';
import { getAuthenticatedUser } from '../utils/auth';

const router = express.Router();

type PermissionLevel = 'owner' | 'editor' | 'viewer';

const permissionOf = (board: any, userId: string): PermissionLevel | null => {
    if (String(board.owner) === userId) return 'owner';
    if (board.editorUsersIds?.includes(userId)) return 'editor';
    if (board.viewerUserIds?.includes(userId)) return 'viewer';
    return null;
};

const withPermission = (board: any, userId: string) => ({
    ...board.toObject(),
    permissionLevel: permissionOf(board, userId)
});

const createJoinKey = () => Math.random().toString(36).substring(2, 8);

const createUniqueJoinKey = async () => {
    let joinKey = createJoinKey();

    while (await boardModel.exists({ joinKey })) {
        joinKey = createJoinKey();
    }

    return joinKey;
};

const ensureJoinKey = async (board: any) => {
    if (board.joinKey) return board;

    board.joinKey = await createUniqueJoinKey();
    await board.save();
    return board;
};

const loadBoard = async (boardId: string, res: Response) => {
    const board = await boardModel.findById(boardId);
    if (!board) res.status(404).json({ error: 'Board not found' });
    return board ? ensureJoinKey(board as any) : board as any;
};

const load = loadBoard;

// Creates a new board for the logged-in user.
router.post('/create', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { title, boardData } = req.body;
        const key = await createUniqueJoinKey();

        const board = new boardModel({
            title: title ?? 'Untitled board',
            owner: user._id,
            editorUsersIds: [],
            viewerUserIds: [],
            joinKey: key,
            boardData
        });
        await board.save();

        return res.status(201).json({ ...board.toObject(), permissionLevel: 'owner' });
    } 
    catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Returns every board the logged-in user can access.
router.get('/mine', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = String(user._id);

        const boards = await boardModel.find({
            $or: [
                { owner: user._id },
                { editorUsersIds: userId },
                { viewerUserIds: userId }
            ]
        });
        return res.status(200).json(boards.map((board) => withPermission(board, userId)));
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

// Joins a shared board by its join key.
router.put('/joinUser', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const board = await boardModel.findOne({
            joinKey: req.body.key
        });
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const userId = String(user._id);
        if (!board.viewerUserIds.includes(userId)) {
            board.viewerUserIds = [...board.viewerUserIds, userId];
            await board.save();
        }

        return res.status(200).json(withPermission(board, userId));
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

// Returns one board if the user has any access to it.
router.get('/:boardId', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const board = await load(req.params.boardId, res);
        if (!board) return;

        const userId = String(user._id);
        if (!permissionOf(board, userId)) return res.status(403).json({ error: 'Forbidden' });

        return res.status(200).json(withPermission(board, userId));
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

// Updates title, board data if the user can edit.
router.put('/:boardId', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const board = await load(req.params.boardId, res);
        if (!board) return;

        const userId = String(user._id);
        const permission = permissionOf(board, userId);
        if (permission !== 'owner' && permission !== 'editor') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { title, boardData } = req.body;

        if (typeof title === 'string') board.title = title;
        if (boardData) board.boardData = boardData;

        await board.save();

        return res.status(200).json(withPermission(board, userId));
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

// Updates editor and viewer lists if the user is the owner.
router.patch('/:boardId/permissions', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const board = await load(req.params.boardId, res);
        if (!board) return;
        if (permissionOf(board, String(user._id)) !== 'owner') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { editorUsersIds, viewerUserIds } = req.body;

        if (Array.isArray(editorUsersIds)) board.editorUsersIds = editorUsersIds;
        if (Array.isArray(viewerUserIds)) board.viewerUserIds = viewerUserIds;

        await board.save();

        return res.status(200).json(withPermission(board, String(user._id)));
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

// Deletes a board if the user is the owner.
router.delete('/:boardId', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const board = await load(req.params.boardId, res);
        if (!board) return;

        if (permissionOf(board, String(user._id)) !== 'owner') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await board.deleteOne();

        return res.status(200).json({ message: 'Board deleted' });
    } 
    catch (err) { 
        console.error(err); 
        return res.status(500).json({ error: 'Server error' }); 
    }
});

export default router;
