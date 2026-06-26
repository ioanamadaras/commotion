import express, { Response } from "express";
import boardModel from "../models/boardModel";
import boardMemberModel from "../models/boardMemberModel";
import { getAuthenticatedUser } from "../utils/auth";
import {
    canEditPermission,
    decorateBoard,
    permissionOf,
    setBoardPermissions,
} from "../utils/boardAccess";
import { IUser } from "../models/userModel";

const router = express.Router();

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
    if (!board) res.status(404).json({ error: "Board not found" });
    return board ? ensureJoinKey(board as any) : (board as any);
};

const isGuestUser = (user: IUser) => user?.userType === "guest";

// Creates a new board for the logged-in user.
router.post("/create", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (isGuestUser(user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { title, boardData } = req.body;
        const key = await createUniqueJoinKey();

        const board = new boardModel({
            title: title ?? "Untitled board",
            owner: user._id,
            joinKey: key,
            boardData,
        });
        await board.save();

        return res.status(201).json(await decorateBoard(board, user));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Returns every board the logged-in user can access.
router.get("/mine", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = String(user._id);
        const [ownedBoards, memberships] = await Promise.all([
            boardModel.find({ owner: user._id }),
            boardMemberModel.find({ userId }),
        ]);

        const memberBoardIds = memberships.map((membership) =>
            String(membership.boardId),
        );
        const sharedBoards =
            memberBoardIds.length > 0
                ? await boardModel.find({ _id: { $in: memberBoardIds } })
                : [];

        const boardById = new Map<string, any>();
        ownedBoards.forEach((board) => boardById.set(String(board._id), board));
        sharedBoards.forEach((board) =>
            boardById.set(String(board._id), board),
        );

        const boards = [...boardById.values()];
        return res
            .status(200)
            .json(
                await Promise.all(
                    boards.map((board) => decorateBoard(board, user)),
                ),
            );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Joins a shared board by its join key.
router.put("/joinUser", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const board = await boardModel.findOne({
            joinKey: req.body.key,
        });
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        const userId = String(user._id);
        if (String(board.owner) !== userId) {
            const existingMembership = await boardMemberModel.findOne({
                boardId: board._id,
                userId,
            });

            if (!existingMembership) {
                await boardMemberModel.create({
                    boardId: board._id,
                    userId,
                    role: "viewer",
                });
            } else if (existingMembership.role === "viewer") {
                // already has the expected role
            } else {
                // keep higher permissions if the user was already invited as editor
            }
        }

        return res.status(200).json(await decorateBoard(board, user));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// returneaza boardul daca userul are acces, asta e endpointul pe care il folosesc cand deschid un board
router.get("/:boardId", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const board = await loadBoard(req.params.boardId, res);
        if (!board) return;

        const permission = await permissionOf(board, user);
        if (!permission) return res.status(403).json({ error: "Forbidden" });

        return res.status(200).json(await decorateBoard(board, user));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Updates title, board data if the user can edit.
router.put("/:boardId", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (isGuestUser(user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const board = await loadBoard(req.params.boardId, res);
        if (!board) return;

        const permission = await permissionOf(board, user);
        if (!canEditPermission(permission)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { title, boardData } = req.body;

        if (typeof title === "string") board.title = title;
        if (boardData) board.boardData = boardData;

        await board.save();

        return res.status(200).json(await decorateBoard(board, user));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Updates editor and viewer lists if the user is the owner.
router.patch("/:boardId/permissions", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (isGuestUser(user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const board = await loadBoard(req.params.boardId, res);
        if (!board) return;
        if ((await permissionOf(board, user)) !== "owner") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { editorUserIds, viewerUserIds } = req.body;
        const nexteditorUserIds = Array.isArray(editorUserIds)
            ? editorUserIds.filter((id) => String(id) !== String(board.owner))
            : [];
        const nextViewerUsersIds = Array.isArray(viewerUserIds)
            ? viewerUserIds.filter((id) => String(id) !== String(board.owner))
            : [];
        const accessLists = await setBoardPermissions(
            board._id,
            nexteditorUserIds,
            nextViewerUsersIds,
            board.owner,
        );

        return res.status(200).json({
            ...(await decorateBoard(board, user)),
            ...accessLists,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Deletes a board if the user is the owner.
router.delete("/:boardId", async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (isGuestUser(user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const board = await loadBoard(req.params.boardId, res);
        if (!board) return;

        if ((await permissionOf(board, user)) !== "owner") {
            return res.status(403).json({ error: "Forbidden" });
        }

        await boardMemberModel.deleteMany({ boardId: board._id });
        await board.deleteOne();

        return res.status(200).json({ message: "Board deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
