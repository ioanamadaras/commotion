import boardMemberModel, { BoardMemberRole } from "../models/boardMemberModel";

export type PermissionLevel = "owner" | "editor" | "viewer";

const getUserId = (user: { _id?: unknown } | null | undefined) => {
    const userId = user?._id ? String(user._id) : "";

    return userId || null;
};

const getMemberRole = async (boardId: unknown, userId: string) => {
    const membership = await boardMemberModel.findOne({ boardId, userId });

    return membership?.role ?? null;
};

export const permissionOf = async (
    board: { _id?: unknown; owner?: unknown },
    user: { _id?: unknown; userType?: string } | null | undefined,
): Promise<PermissionLevel | null> => {
    const userId = getUserId(user);
    if (!userId || !board?._id) return null;

    if (String(board.owner) === userId) return "owner";

    const role = await getMemberRole(board._id, userId);
    if (!role) return null;

    if (user?.userType === "guest" && role !== "viewer") {
        return null;
    }

    return role;
};

export const canEditPermission = (permission: PermissionLevel | null) =>
    permission === "owner" || permission === "editor";

export const getBoardAccessLists = async (boardId: unknown) => {
    const memberships = await boardMemberModel.find({ boardId });

    return {
        editorUserIds: memberships
            .filter((membership) => membership.role === "editor")
            .map((membership) => String(membership.userId)),
        viewerUserIds: memberships
            .filter((membership) => membership.role === "viewer")
            .map((membership) => String(membership.userId)),
    };
};

export const decorateBoard = async (
    board: any,
    user: { _id?: unknown; userType?: string } | null | undefined,
) => {
    const [permissionLevel, accessLists] = await Promise.all([
        permissionOf(board, user),
        getBoardAccessLists(board._id),
    ]);

    return {
        ...board.toObject(),
        ...accessLists,
        permissionLevel,
    };
};

export const setBoardPermissions = async (
    boardId: unknown,
    editorUserIds: string[],
    viewerUserIds: string[],
    ownerId?: unknown,
) => {
    const ownerValue = ownerId != null ? String(ownerId) : null;
    const normalizedEditors = [
        ...new Set(
            editorUserIds
                .map(String)
                .map((id) => id.trim())
                .filter(Boolean),
        ),
    ].filter((userId) => userId !== ownerValue);
    const normalizedViewers = [
        ...new Set(
            viewerUserIds
                .map(String)
                .map((id) => id.trim())
                .filter(Boolean),
        ),
    ].filter((userId) => !normalizedEditors.includes(userId));

    const desiredByUserId = new Map<string, BoardMemberRole>();
    normalizedEditors.forEach((userId) =>
        desiredByUserId.set(userId, "editor"),
    );
    normalizedViewers.forEach((userId) =>
        desiredByUserId.set(userId, "viewer"),
    );

    await boardMemberModel.deleteMany({
        boardId,
        userId: { $nin: [...desiredByUserId.keys()] },
    });

    await Promise.all(
        [...desiredByUserId.entries()].map(([userId, role]) =>
            boardMemberModel.findOneAndUpdate(
                { boardId, userId },
                { $set: { role } },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            ),
        ),
    );

    return {
        editorUserIds: normalizedEditors,
        viewerUserIds: normalizedViewers,
    };
};
