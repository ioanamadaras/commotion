import { useCallback, useEffect, useRef, useState } from 'react';
import MultipleUsersBubble from '@/components/MultipleUsersBubble';
import { _useContext } from '../Context';
import { useNavigate, useParams } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import { socket } from '@/lib/socket';
import { api } from '@/api';
import '@excalidraw/excalidraw/index.css';
import './board.css';
import Cursor from '@/components/Cursor';
import type { BoardType } from '@/types';

function getDocumentTheme() {
	const currentTheme = document.documentElement.getAttribute('data-theme');

	if (currentTheme === 'dark' || currentTheme === 'light') {
		return currentTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
}

type Cursor = {
	socketId: string;
	userId: string;
	username: string;
	x: number;
	y: number;
};

type RemoteScenePayload = {
	sourceSocketId?: string;
	elements: any[];
	appState: any;
	files?: Record<string, any>;
};

type SceneSnapshot = {
	elements: any[];
	appState: any;
	files?: Record<string, any>;
};

export default function Board() {
	const { state } = _useContext();
	const navigate = useNavigate();
	const params = useParams();
	const user = state.user;
	const boardId = params.id;
	const userId = user?._id;
	const username = user?.username ?? 'User';
	const [board, setBoard] = useState<BoardType | null>(null);
	const [boardError, setBoardError] = useState<string | null>(null);
	const [boardReady, setBoardReady] = useState(false);

	const selectedTeam =
		user
			? state.teams.find((team) => team._id === user.selectedTeamId) ??
			state.teams[0]
		: null;
	const canEdit = board?.permissionLevel !== 'viewer';

	const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme());
	const [remoteCursors, setRemoteCursors] = useState<Cursor[]>([]);

	const excalidrawApiRef = useRef<any>(null);
	const latestSceneRef = useRef<SceneSnapshot | null>(null);
	const isApplyingRemoteUpdateRef = useRef(false);
	const emitTimerRef = useRef<number | null>(null);

	const getCleanAppState = useCallback((appState: any) => {
		return {
			...appState,

			// Nu vrem sa sincronizam stari locale de UI.
			collaborators: undefined,
			selectedElementIds: undefined,
			selectedGroupIds: undefined,
			editingElement: undefined,
			editingGroupId: undefined,
		};
	}, []);

	useEffect(() => {
		const root = document.documentElement;

		const observer = new MutationObserver(() => {
			setTheme(getDocumentTheme());
		});

		observer.observe(root, {
			attributes: true,
			attributeFilter: ['data-theme', 'class'],
		});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!boardId) {
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
				latestSceneRef.current = {
					elements: data.boardData?.elements ?? [],
					appState: getCleanAppState(data.boardData?.appState ?? {}),
					files: data.boardData?.files ?? {},
				};
			}
			catch (err) {
				console.error(err);
				if (!cancelled) {
					setBoard(null);
					setBoardError('Board not found or you do not have access.');
				}
			}
			finally {
				if (!cancelled) {
					setBoardReady(true);
				}
			}
		}

		loadBoard();

		return () => {
			cancelled = true;
		};
	}, [boardId, getCleanAppState]);

	const saveLatestScene = useCallback(
		(elements: readonly any[], appState: any, files?: Record<string, any>) => {
			latestSceneRef.current = {
				elements: [...elements],
				appState: {},
				files,
			};
		},
		[getCleanAppState],
	);

	const emitBoardUpdate = useCallback(() => {
		if (!boardId || !userId || !canEdit) return;
		if (!socket.connected) return;
		if (isApplyingRemoteUpdateRef.current) return;

		const scene = latestSceneRef.current;
		if (!scene) return;

		const boardData = {
			type: 'excalidraw',
			version: 2,
			elements: scene.elements,
			appState: {},
			files: scene.files ?? {},
		};

		socket.emit('board:update', {
			boardId,
			elements: scene.elements,
			appState: {},
			files: scene.files,
		});

		void api(`/board/${boardId}`, {
			method: 'PUT',
			body: JSON.stringify({ boardData }),
		}).catch((err) => {
			console.error(err);
		});
	}, [boardId, canEdit, userId]);

	const scheduleBoardUpdate = useCallback(() => {
		if (emitTimerRef.current) {
			window.clearTimeout(emitTimerRef.current);
		}

		emitTimerRef.current = window.setTimeout(() => {
			emitBoardUpdate();
			emitTimerRef.current = null;
		}, 80);
	}, [emitBoardUpdate]);

	const applyRemoteScene = useCallback((payload: RemoteScenePayload) => {
		if (!excalidrawApiRef.current) return;

		isApplyingRemoteUpdateRef.current = true;

		if (payload.files && excalidrawApiRef.current.addFiles) {
			excalidrawApiRef.current.addFiles(Object.values(payload.files));
		}

		excalidrawApiRef.current.updateScene({
			elements: payload.elements,
			appState: {},
		});

		latestSceneRef.current = {
			elements: payload.elements,
			appState: {},
			files: payload.files,
		};

		window.setTimeout(() => {
			isApplyingRemoteUpdateRef.current = false;
		}, 0);
	}, []);

	useEffect(() => {
		if (!boardId || !userId || !boardReady || !board) {
			return;
		}

		const handleConnect = () => {
			console.log('Connected to socket:', socket.id);

			socket.emit('board:join', {
				boardId,
				userId,
				username,
			});
		};

		const handleBoardUpdate = (payload: RemoteScenePayload) => {
			if (payload.sourceSocketId === socket.id) return;
			applyRemoteScene(payload);
		};

		const handleSyncRequest = ({
			requesterSocketId,
		}: {
			requesterSocketId: string;
		}) => {
				const api = excalidrawApiRef.current;

				if (!api) return;

				const elements = api.getSceneElements();
				const files = api.getFiles?.();
				const appState = api.getAppState ? getCleanAppState(api.getAppState()) : {};

			socket.emit('board:sync-response', {
				requesterSocketId,
				elements,
				// appState,
				files,
			});
		};

		const handleSyncResponse = (payload: RemoteScenePayload) => {
			applyRemoteScene(payload);
		};

		const handleCursorUpdate = ({ cursor }: { cursor: Cursor }) => {
			if (!cursor.socketId) return;
			if (cursor.socketId === socket.id) return;

			setRemoteCursors((prev) => {
				const otherCursors = prev.filter(
					(c) => c.socketId !== cursor.socketId,
				);
				return [...otherCursors, cursor];
			});
		};

		const handleCursorRemove = ({ socketId }: { socketId: string }) => {
			setRemoteCursors((prev) =>
				prev.filter((c) => c.socketId !== socketId),
			);
		};

		const handleUsersChanged = (users: unknown[]) => {
			console.log('board:users-changed', users);
		};

		socket.connect();

		socket.on('connect', handleConnect);
		socket.on('board:update', handleBoardUpdate);
		socket.on('board:sync-request', handleSyncRequest);
		socket.on('board:sync-response', handleSyncResponse);
		socket.on('board:users-changed', handleUsersChanged);
		socket.on('cursor:update', handleCursorUpdate);
		socket.on('cursor:remove', handleCursorRemove);

		if (socket.connected) {
			handleConnect();
		}

		return () => {
			socket.emit('cursor:leave', {
				boardId,
			});

			socket.off('connect', handleConnect);
			socket.off('board:update', handleBoardUpdate);
			socket.off('board:sync-request', handleSyncRequest);
			socket.off('board:sync-response', handleSyncResponse);
			socket.off('board:users-changed', handleUsersChanged);
			socket.off('cursor:update', handleCursorUpdate);
			socket.off('cursor:remove', handleCursorRemove);

			if (emitTimerRef.current) {
				window.clearTimeout(emitTimerRef.current);
				emitTimerRef.current = null;
			}

			socket.disconnect();

			setRemoteCursors([]);
			latestSceneRef.current = null;
			isApplyingRemoteUpdateRef.current = false;
		};
	}, [board, boardId, boardReady, userId, username, applyRemoteScene, getCleanAppState]);

	if (!user) {
		return null;
	}

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

	const boardScene = board?.boardData ?? {
		type: 'excalidraw',
		version: 2,
		elements: [],
		appState: {},
		files: {},
	};

	return (
		<main style={{padding: 0}}>
			<section className="w-full flex flex-col justify-between items-center">
				<div
					className={`w-full h-screen excalidraw-wrapper flex justify-center theme--${theme}`}
					onPointerMove={(event) => {
						if (!boardId || !userId) return;
						if (!socket.connected) return;

						socket.emit('cursor:update', {
							boardId,
							cursor: {
								userId,
								username,
								x: event.clientX,
								y: event.clientY,
							},
						});
					}}
				>
					{remoteCursors.map((cursor) => (
						<Cursor
							key={cursor.socketId}
							socketId={cursor.socketId}
							username={cursor.username}
							x={cursor.x}
							y={cursor.y}
						/>
					))}

					{selectedTeam ? (
						<div className="absolute mx-auto bottom-4 z-10">
							<MultipleUsersBubble
								members={selectedTeam.members}
								bg="var(--bg)"
							/>
						</div>
					) : null}

					<Excalidraw
						initialData={{
							...boardScene,
							appState: {
								...boardScene.appState,
								gridSize: 100,
								gridModeEnabled: true,
								gridStep: 1,
								theme: theme,
								// snapLines: true
							},
						}}
						theme={state.theme}
						isCollaborating={canEdit}
						viewModeEnabled={!canEdit}
						excalidrawAPI={(api) => {
							excalidrawApiRef.current = api;
						}}
						onChange={(elements, appState, files) => {
							if (!canEdit) return;
							if (isApplyingRemoteUpdateRef.current) return;

							saveLatestScene(elements, appState, files);
							scheduleBoardUpdate();
						}}
						// renderTopRightUI={() => null}
						UIOptions={{
							canvasActions: {
								changeViewBackgroundColor: true,

								//   clearCanvas: false,
								//   export: false,
								//   loadScene: false,
								//   saveAsImage: false,
								//   saveToActiveFile: false,
								//   toggleTheme: null,
							},
						}}
					/>
				</div>
			</section>
		</main>
	);
}
