import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

type BoardJoinPayload = {
    boardId: string;
    userId: string;
    username: string;
};

type BoardUpdatePayload = {
    boardId: string;
    elements: unknown[];
    appState: Record<string, unknown>;
    files?: Record<string, unknown>;
};

type BoardSyncRequestPayload = {
    requesterSocketId: string;
};

type BoardSyncResponsePayload = {
    requesterSocketId: string;
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
            console.log("Socket connected:", socket.id);

            socket.on(
                "board:join",
                async ({ boardId, userId, username }: BoardJoinPayload) => {
                    if (!boardId || !userId) return;

                    const roomId = getRoomId(boardId);

                    await socket.join(roomId);

                    socket.data.boardId = boardId;
                    socket.data.userId = userId;
                    socket.data.username = username || "User";

                    console.log("board:join", {
                        socketId: socket.id,
                        boardId,
                        userId,
                        username,
                        rooms: Array.from(socket.rooms),
                    });

                    await emitUsersChanged(boardId);

                    socket.to(roomId).emit("board:user-joined", {
                        socketId: socket.id,
                        userId,
                        username: socket.data.username,
                    });

                    socket.to(roomId).emit("board:sync-request", {
                        requesterSocketId: socket.id,
                    } satisfies BoardSyncRequestPayload);
                },
            );

            socket.on("board:update", ({
                boardId,
                elements,
                appState,
                files,
            }: BoardUpdatePayload) => {
                    if (!boardId) return;

                    if (socket.data.boardId !== boardId) {
                        console.log(
                            "Rejected board:update because boardId mismatch",
                            {
                                socketId: socket.id,
                                socketBoardId: socket.data.boardId,
                                payloadBoardId: boardId,
                            },
                        );
                        return;
                    }

                    console.log("board:update", {
                        from: socket.id,
                        boardId,
                        lastEl: elements?.[elements.length - 1],
                    });

                    socket.broadcast
                        .to(getRoomId(boardId))
                        .emit("board:update", {
                            sourceSocketId: socket.id,
                            elements,
                            appState,
                            files,
                        });
                },
            );

            socket.on(
                "board:sync-response",
                ({
                    requesterSocketId,
                    elements,
                    appState,
                    files,
                }: BoardSyncResponsePayload) => {
                    if (!requesterSocketId) return;

                    console.log("board:sync-response", {
                        from: socket.id,
                        to: requesterSocketId,
                        elementsCount: elements?.length ?? 0,
                    });

                    io.to(requesterSocketId).emit("board:sync-response", {
                        sourceSocketId: socket.id,
                        elements,
                        appState,
                        files,
                    });
                },
            );

            socket.on(
                "cursor:update",
                ({ boardId, cursor }: CursorUpdatePayload) => {
                    if (!boardId) return;

                    if (socket.data.boardId !== boardId) {
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

                console.log("Socket disconnected:", socket.id);

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
