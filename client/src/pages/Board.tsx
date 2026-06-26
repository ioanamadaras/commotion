import { useCallback, useEffect, useRef, useState } from 'react';
import { _useContext } from '../Context';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Excalidraw,
	sceneCoordsToViewportCoords,
	viewportCoordsToSceneCoords,
} from '@excalidraw/excalidraw';
import { socket } from '@/lib/socket';
import { api } from '@/api';
import '@excalidraw/excalidraw/index.css';
import './board.css';
import Cursor from '@/components/Cursor';
import type { BoardRoomUser, BoardType } from '@/types';
import MultipleUsersBubble from '@/components/MultipleUsersBubble';

type CursorState = {
	socketId: string;
	userId: string;
	username: string;
	x: number;
	y: number;
};

type CanvasViewport = Parameters<typeof viewportCoordsToSceneCoords>[1];

type SceneSnapshot = {
	elements: any[];
	appState: Record<string, any>;
	files: Record<string, any>;
};

type RemoteScenePayload = SceneSnapshot & {
	sourceSocketId?: string;
};

const EMPTY_SCENE: SceneSnapshot = {
	elements: [],
	appState: {},
	files: {},
};

function getDocumentTheme() {
	const currentTheme = document.documentElement.getAttribute('data-theme');

	if (currentTheme === 'dark' || currentTheme === 'light') {
		return currentTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
}

function getCleanAppState(appState: Record<string, any> = {}) {
	return {
		...appState,
		collaborators: undefined,
		selectedElementIds: undefined,
		selectedGroupIds: undefined,
		editingElement: undefined,
		editingGroupId: undefined,
	};
}

function shouldUseIncomingElement(current: any, incoming: any) {
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
}

function mergeElements(currentElements: readonly any[] = [], incomingElements: readonly any[] = []) {
	const byId = new Map<string, any>();
	const order: string[] = [];

	const remember = (element: any) => {
		if (!element?.id) return;
		if (!byId.has(element.id)) order.push(element.id);
		byId.set(element.id, element);
	};

	currentElements.forEach(remember);

	incomingElements.forEach((element) => {
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
}

function getElementsSignature(elements: readonly any[] = []) {
	return elements
		.map((element) => {
			if (!element?.id) return '';
			return [
				element.id,
				element.version ?? 0,
				element.versionNonce ?? '',
				element.isDeleted ? 1 : 0,
			].join(':');
		})
		.join('|');
}

function toScene(board?: BoardType | null): SceneSnapshot {
	return {
		elements: [...(board?.boardData?.elements ?? [])],
		appState: getCleanAppState(board?.boardData?.appState ?? {}),
		files: board?.boardData?.files ?? {},
	};
}

function getCanvasViewport(appState?: Partial<CanvasViewport> | null): CanvasViewport | null {
	const zoom = appState?.zoom;
	const zoomValue = Number(zoom?.value);
	const offsetLeft = Number(appState?.offsetLeft);
	const offsetTop = Number(appState?.offsetTop);
	const scrollX = Number(appState?.scrollX);
	const scrollY = Number(appState?.scrollY);

	if (
		!zoom ||
		!Number.isFinite(zoomValue) ||
		!Number.isFinite(offsetLeft) ||
		!Number.isFinite(offsetTop) ||
		!Number.isFinite(scrollX) ||
		!Number.isFinite(scrollY)
	) {
		return null;
	}

	return {
		zoom,
		offsetLeft,
		offsetTop,
		scrollX,
		scrollY,
	};
}

function areCanvasViewportsEqual(left: CanvasViewport | null, right: CanvasViewport | null) {
	return (
		left?.zoom.value === right?.zoom.value &&
		left?.offsetLeft === right?.offsetLeft &&
		left?.offsetTop === right?.offsetTop &&
		left?.scrollX === right?.scrollX &&
		left?.scrollY === right?.scrollY
	);
}

export default function Board() {
	const { state } = _useContext();
	const navigate = useNavigate();
	const { id: boardId } = useParams();
	const user = state.user;
	const userId = user?._id;
	const username = user?.username ?? 'User';

	const [board, setBoard] = useState<BoardType | null>(null);
	const [boardError, setBoardError] = useState<string | null>(null);
	const [boardReady, setBoardReady] = useState(false);
	const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme());
	const [remoteCursors, setRemoteCursors] = useState<CursorState[]>([]);
	const [, refreshRemoteCursors] = useState(0);
	const [roomUsers, setRoomUsers] = useState<BoardRoomUser[]>([]);

	const excalidrawApiRef = useRef<any>(null);
	const canvasViewportRef = useRef<CanvasViewport | null>(null);
	const latestSceneRef = useRef<SceneSnapshot>(EMPTY_SCENE);
	const isApplyingRemoteUpdateRef = useRef(false);
	const emitTimerRef = useRef<number | null>(null);
	const lastCursorEmitRef = useRef(0);
	const elementsSignatureRef = useRef('');

	const canEdit = board?.permissionLevel !== 'viewer';

	useEffect(() => {
		const root = document.documentElement;
		const observer = new MutationObserver(() => setTheme(getDocumentTheme()));

		observer.observe(root, {
			attributes: true,
			attributeFilter: ['data-theme', 'class'],
		});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!boardId) {
			setBoard(null);
			setBoardError('Missing board id');
			setBoardReady(true);
			return;
		}

		let cancelled = false;

		async function loadBoard() {
			try {
				setBoardReady(false);
				setBoardError(null);

				const data = await api(`/board/${boardId}`);

				if (cancelled) return;

				setBoard(data);
				const scene = toScene(data);
				latestSceneRef.current = scene;
				elementsSignatureRef.current = getElementsSignature(scene.elements);
			}
			catch (err) {
				console.error(err);
				if (!cancelled) {
					setBoard(null);
					setBoardError('Board not found or you do not have access.');
				}
			}
			finally {
				if (!cancelled) setBoardReady(true);
			}
		}

		loadBoard();

		return () => {
			cancelled = true;
		};
	}, [boardId]);

	const emitBoardUpdate = useCallback(() => {
		if (!boardId || !userId || !canEdit || !socket.connected) return;
		if (isApplyingRemoteUpdateRef.current) return;

		const scene = latestSceneRef.current;

		socket.emit('board:update', {
			boardId,
			elements: scene.elements,
			appState: {},
			files: scene.files,
		});
	}, [boardId, canEdit, userId]);

	const scheduleBoardUpdate = useCallback(() => {
		if (emitTimerRef.current) {
			window.clearTimeout(emitTimerRef.current);
		}

		emitTimerRef.current = window.setTimeout(() => {
			emitTimerRef.current = null;
			emitBoardUpdate();
		}, 250);
	}, [emitBoardUpdate]);

	const applyRemoteScene = useCallback((payload: RemoteScenePayload) => {
		const api = excalidrawApiRef.current;
		if (!api) return;

		const currentElements = api.getSceneElements?.() ?? latestSceneRef.current.elements;
		const currentFiles = api.getFiles?.() ?? latestSceneRef.current.files;
		const mergedScene: SceneSnapshot = {
			elements: mergeElements(currentElements, payload.elements),
			appState: {},
			files: {
				...currentFiles,
				...(payload.files ?? {}),
			},
		};

		isApplyingRemoteUpdateRef.current = true;

		if (payload.files && api.addFiles) {
			api.addFiles(Object.values(payload.files));
		}

		api.updateScene({
			elements: mergedScene.elements,
			appState: mergedScene.appState,
		});

		latestSceneRef.current = mergedScene;
		elementsSignatureRef.current = getElementsSignature(mergedScene.elements);

		window.setTimeout(() => {
			isApplyingRemoteUpdateRef.current = false;
		}, 0);
	}, []);

	useEffect(() => {
		if (!boardId || !userId || !boardReady || !board) return;

		const joinBoard = () => {
			socket.emit('board:join', {
				boardId,
				userId,
				username,
				userType: user?.userType,
			});
		};

		const handleBoardUpdate = (payload: RemoteScenePayload) => {
			if (payload.sourceSocketId === socket.id) return;
			applyRemoteScene(payload);
		};

		const handleCursorUpdate = ({ cursor }: { cursor: CursorState }) => {
			if (!cursor.socketId || cursor.socketId === socket.id) return;

			setRemoteCursors((prev) => [
				...prev.filter((c) => c.socketId !== cursor.socketId),
				cursor,
			]);
		};

		const handleCursorRemove = ({ socketId }: { socketId: string }) => {
			setRemoteCursors((prev) => prev.filter((c) => c.socketId !== socketId));
		};

		const handleUsersChanged = (users: BoardRoomUser[]) => {
			setRoomUsers(users);
		};

		socket.connect();
		socket.on('connect', joinBoard);
		socket.on('board:update', handleBoardUpdate);
		socket.on('board:users-changed', handleUsersChanged);
		socket.on('cursor:update', handleCursorUpdate);
		socket.on('cursor:remove', handleCursorRemove);

		if (socket.connected) joinBoard();

		return () => {
			socket.emit('cursor:leave', { boardId });
			socket.off('connect', joinBoard);
			socket.off('board:update', handleBoardUpdate);
			socket.off('board:users-changed', handleUsersChanged);
			socket.off('cursor:update', handleCursorUpdate);
			socket.off('cursor:remove', handleCursorRemove);

			if (emitTimerRef.current) {
				window.clearTimeout(emitTimerRef.current);
				emitTimerRef.current = null;
			}

			socket.disconnect();
			setRemoteCursors([]);
			setRoomUsers([]);
			canvasViewportRef.current = null;
			latestSceneRef.current = EMPTY_SCENE;
			elementsSignatureRef.current = '';
			isApplyingRemoteUpdateRef.current = false;
		};
	}, [applyRemoteScene, board, boardId, boardReady, userId, username]);

    const emitCursor = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!boardId || !userId || !socket.connected) return;

        const appState = excalidrawApiRef.current?.getAppState?.();
        const viewport = getCanvasViewport(appState);
        if (!viewport) return;

        const now = Date.now();
        if (now - lastCursorEmitRef.current < 50) return;
        lastCursorEmitRef.current = now;

        const sceneCursor = viewportCoordsToSceneCoords(
            {
                clientX: event.clientX,
                clientY: event.clientY,
            },
            viewport,
        );

        socket.volatile.emit('cursor:update', {
            boardId,
            cursor: {
                userId,
                username,
                x: sceneCursor.x,
                y: sceneCursor.y,
            },
        });
    }, [boardId, userId, username]);

	if (!user) return null;

	if (!boardReady) {
		return <main style={{ padding: 0 }} />;
	}

	if (boardError) {
		return (
			<main className="w-full min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-xl font-semibold">{boardError}</h1>
					<button
						type="button"
						className="rounded-md border border-[var(--text)] px-4 py-2"
						onClick={() => navigate('/')}
					>
						Go home
					</button>
				</div>
			</main>
		);
	}

	const boardScene = toScene(board);
	const visibleRemoteCursors = canvasViewportRef.current
		? remoteCursors.map((cursor) => ({
			...cursor,
			...sceneCoordsToViewportCoords(
				{
					sceneX: cursor.x,
					sceneY: cursor.y,
				},
				canvasViewportRef.current!,
			),
		}))
		: [];

	return (
		<main style={{ padding: 0 }}>
			<section className="w-full flex flex-col justify-between items-center">
				<div
					className={`w-full h-screen excalidraw-wrapper flex justify-center theme--${theme}`}
					onPointerMove={emitCursor}
				>
					{visibleRemoteCursors.map((cursor) => (
						<Cursor
							key={cursor.socketId}
							socketId={cursor.socketId}
							username={cursor.username}
							x={cursor.x}
							y={cursor.y}
						/>
					))}

                    {roomUsers.length > 1 ?
					<div className="absolute mx-auto bottom-3 z-10">
						<MultipleUsersBubble
							members={roomUsers}
							bg="var(--bg)"
                            />
					</div>
                    : null}

					<Excalidraw
						initialData={{
							...boardScene,
							appState: {
								...boardScene.appState,
								gridSize: 100,
								gridModeEnabled: true,
								gridStep: 1,
								theme,
							},
						}}
						theme={state.theme}
						isCollaborating={canEdit}
						viewModeEnabled={!canEdit}
						excalidrawAPI={(api) => {
							excalidrawApiRef.current = api;
						}}
						onChange={(elements, appState, files) => {
							const nextViewport = getCanvasViewport(appState);
							if (
								nextViewport &&
								!areCanvasViewportsEqual(canvasViewportRef.current, nextViewport)
							) {
								canvasViewportRef.current = nextViewport;
								refreshRemoteCursors((version) => version + 1);
							}

							if (!canEdit || isApplyingRemoteUpdateRef.current) return;

							const signature = getElementsSignature(elements);
							if (signature === elementsSignatureRef.current) return;
							elementsSignatureRef.current = signature;

							latestSceneRef.current = {
								elements: [...elements],
								appState: {},
								files: files ?? {},
							};
							scheduleBoardUpdate();
						}}
						UIOptions={{
							canvasActions: {
								changeViewBackgroundColor: true,
							},
						}}
					/>
				</div>
			</section>
		</main>
	);
}
