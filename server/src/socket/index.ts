import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import boardModel from "../api/models/boardModel";
import { canEditPermission, permissionOf } from "../api/utils/boardAccess";

const shouldUseIncomingElement = (current: any, incoming: any) => {
    if (!current) return true;

    const currentVersion = Number(current.version ?? 0);
    const incomingVersion = Number(incoming.version ?? 0);

    if (incomingVersion !== currentVersion) {
        return incomingVersion > currentVersion;
    }

    const currentUpdated = Number(current.updated ?? 0);
    const incomingUpdated = Number(incoming.updated ?? 0);

    if (incomingUpdated !== currentUpdated) {
        return incomingUpdated > currentUpdated;
    }

    return incoming.versionNonce !== current.versionNonce;
};

const mergeElements = (currentElements: unknown[] = [], incomingElements: unknown[] = []) => {
    const byId = new Map<string, any>();
    const order: string[] = [];

    const remember = (element: any) => {
        if (!element?.id) return;
        if (!byId.has(element.id)) order.push(element.id);
        byId.set(element.id, element);
    };

    currentElements.forEach(remember);

    incomingElements.forEach((element: any) => {
        if (!element?.id) return;

        if (!byId.has(element.id)) {
            order.push(element.id);
            byId.set(element.id, element);
            return;
        }

        if (shouldUseIncomingElement(byId.get(element.id), element)) {
            byId.set(element.id, element);
        }
    });

    return order.map((id) => byId.get(id)).filter(Boolean);
};

const mergeBoardData = (
    currentData: any,
    incomingData: Pick<BoardUpdatePayload, "elements" | "appState" | "files">,
) => ({
    type: "excalidraw",
    version: 2,
    elements: mergeElements(currentData?.elements ?? [], incomingData.elements ?? []),
    appState: {
        ...(currentData?.appState ?? {}),
        ...(incomingData.appState ?? {}),
    },
    files: {
        ...(currentData?.files ?? {}),
        ...(incomingData.files ?? {}),
    },
});

type BoardJoinPayload = {
    boardId: string;
    userId: string;
    username: string;
    userType?: string;
};

type BoardUpdatePayload = {
    boardId: string;
    elements: unknown[];
    appState: Record<string, unknown>;
    files?: Record<string, unknown>;
};

type CursorUpdatePayload = {
    boardId: string;
    cursor: {
        x: number;
        y: number;
        userId?: string;
        username?: string;
    };
};

type CursorLeavePayload = {
    boardId: string;
};

export function initSocket(server: HttpServer) {
    try {
        const io = new Server(server, {
            transports: ["websocket", "polling"],
            cors: {
                origin: "http://localhost:5001",
                credentials: true,
            },
            allowEIO3: true,
        });

        const getRoomId = (boardId: string) => `board:${boardId}`;

        const getBoardUsers = async (boardId: string) => {
            const sockets = await io.in(getRoomId(boardId)).fetchSockets();

            return sockets.map((s) => ({
                socketId: s.id,
                userId: s.data.userId,
                username: s.data.username,
            }));
        };

        const emitUsersChanged = async (boardId: string) => {
            const roomId = getRoomId(boardId);
            const users = await getBoardUsers(boardId);

            io.in(roomId).emit("board:users-changed", users);
        };

        io.on("connection", (socket) => {
            socket.on("board:join",
                async ({ boardId, userId, username, userType }: BoardJoinPayload) => {
                    if (!boardId || !userId) return;

                    const board = await boardModel.findById(boardId);
                    const permission = board
                        ? await permissionOf(board, { _id: userId, userType })
                        : null;

                    if (!board || !permission) {
                        return;
                    }

                    const roomId = getRoomId(boardId);

                    await socket.join(roomId);

                    socket.data.boardId = boardId;
                    socket.data.userId = userId;
                    socket.data.userType = userType;
                    socket.data.username = username || "User";
                    socket.data.role = permission;
                    socket.data.permission = permission;

                    await emitUsersChanged(boardId);

                    socket.to(roomId).emit("board:user-joined", {
                        socketId: socket.id,
                        userId,
                        username: socket.data.username,
                    });
                },
            );

            socket.on("board:update", async ({
                boardId,
                elements,
                appState,
                files,
            }: BoardUpdatePayload) => {
                    if (!boardId) return;

                    if (socket.data.boardId !== boardId) {
                        return;
                    }

                    const board = await boardModel.findById(boardId);
                    const permission = board
                        ? await permissionOf(board, { _id: socket.data.userId, userType: socket.data.userType })
                        : null;

                    if (!board || !canEditPermission(permission)) {
                        return;
                    }

                    const boardData = mergeBoardData(board.boardData, {
                        elements,
                        appState,
                        files,
                    });

                    board.boardData = boardData;
                    await board.save();

                    const updatePayload = {
                        sourceSocketId: socket.id,
                        elements: boardData.elements,
                        appState: boardData.appState,
                        files: boardData.files,
                    };

                    socket.broadcast
                        .to(getRoomId(boardId))
                        .emit("board:update", updatePayload);

                    socket.emit("board:update", {
                        ...updatePayload,
                        sourceSocketId: "server",
                    });
                },
            );

            socket.on("cursor:update",
                async ({ boardId, cursor }: CursorUpdatePayload) => {
                    if (!boardId) return;

                    if (socket.data.boardId !== boardId) {
                        return;
                    }

                    if (!socket.data.userId) {
                        return;
                    }

                    socket.volatile
                        .to(getRoomId(boardId))
                        .emit("cursor:update", {
                            cursor: {
                                ...cursor,
                                socketId: socket.id,
                                userId: socket.data.userId,
                                username: socket.data.username ?? "User",
                            },
                        });
                },
            );

            socket.on("cursor:leave", ({ boardId }: CursorLeavePayload) => {
                if (!boardId) return;

                if (socket.data.boardId !== boardId) {
                    return;
                }

                socket.to(getRoomId(boardId)).emit("cursor:remove", {
                    socketId: socket.id,
                });
            });

            socket.on("disconnect", async () => {
                const boardId = socket.data.boardId;

                if (!boardId) return;

                const roomId = getRoomId(boardId);

                socket.to(roomId).emit("cursor:remove", {
                    socketId: socket.id,
                });

                socket.to(roomId).emit("board:user-left", {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    username: socket.data.username,
                });

                await emitUsersChanged(boardId);
            });
        });

        return io;
    } catch (err) {
        console.error("Error initializing socket.io:", err);
    }
}
