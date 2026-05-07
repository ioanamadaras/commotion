import { useCallback, useEffect, useRef, useState } from 'react';
import MultipleUsersBubble from '@/components/MultipleUsersBubble';
import { _useContext } from '../Context';
import { useParams } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import { socket } from '@/lib/socket';
import '@excalidraw/excalidraw/index.css';
import './board.css';
import { getUserColor } from '@/utils/colors';

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
	const params = useParams();

	const boardId = params.id;
	const userId = state.user._id;
	const username = state.user.username ?? 'User';

	const selectedTeam =
		state.teams.find((team) => team._id === state.user.selectedTeam) ??
		state.teams[0];

	const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme());
	const [remoteCursors, setRemoteCursors] = useState<Cursor[]>([]);

	const excalidrawApiRef = useRef<any>(null);
	const latestSceneRef = useRef<SceneSnapshot | null>(null);
	const isApplyingRemoteUpdateRef = useRef(false);
	const emitTimerRef = useRef<number | null>(null);

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

	const getCleanAppState = useCallback((appState: any) => {
		return {
			...appState,

			// Nu vrem să sincronizăm stări locale de UI.
			collaborators: undefined,
			selectedElementIds: undefined,
			selectedGroupIds: undefined,
			editingElement: undefined,
			editingGroupId: undefined,
		};
	}, []);

	const saveLatestScene = useCallback(
		(
			elements: readonly any[],
			appState: any,
			files?: Record<string, any>,
		) => {
			latestSceneRef.current = {
				elements: [...elements],
				appState: getCleanAppState(appState),
				files,
			};
		},
		[getCleanAppState],
	);

	const emitBoardUpdate = useCallback(() => {
		if (!boardId || !userId) return;
		if (!socket.connected) return;
		if (isApplyingRemoteUpdateRef.current) return;

		const scene = latestSceneRef.current;
		if (!scene) return;

		socket.emit('board:update', {
			boardId,
			elements: scene.elements,
			appState: scene.appState,
			files: scene.files,
		});
	}, [boardId, userId]);

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
			appState: payload.appState,
		});

		latestSceneRef.current = {
			elements: payload.elements,
			appState: payload.appState,
			files: payload.files,
		};

		window.setTimeout(() => {
			isApplyingRemoteUpdateRef.current = false;
		}, 0);
	}, []);

	useEffect(() => {
		if (!boardId || !userId) {
			console.log('No board id or user id found');
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
			const appState = getCleanAppState(api.getAppState());
			const files = api.getFiles?.();

			socket.emit('board:sync-response', {
				requesterSocketId,
				elements,
				appState,
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
	}, [boardId, userId, username, applyRemoteScene, getCleanAppState]);

	return (
		<main>
			<section className="w-full flex flex-col justify-between items-center">
				<div className="flex">
					<h3>hi: {boardId}</h3>

					{selectedTeam ? (
						<MultipleUsersBubble members={selectedTeam.members} />
					) : null}
				</div>

				<div
					className={`w-full h-screen excalidraw-wrapper theme--${theme}`}
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
						<div
							key={cursor.socketId}
							style={{
								position: 'fixed',
								left: cursor.x,
								top: cursor.y,
								pointerEvents: 'none',
								background: getUserColor(cursor.username),
								color: 'white',
								padding: '4px 8px',
								borderRadius: '8px',
								fontSize: '12px',
								zIndex: 9999,
								transform: 'translate(8px, 8px)',
								whiteSpace: 'nowrap',
							}}
						>
							{cursor.username}
						</div>
					))}

					<Excalidraw
						theme={theme}
						isCollaborating={true}
						excalidrawAPI={(api) => {
							excalidrawApiRef.current = api;
						}}
						onChange={(elements, appState, files) => {
							if (isApplyingRemoteUpdateRef.current) return;

							saveLatestScene(elements, appState, files);
							scheduleBoardUpdate();
						}}
						renderTopRightUI={() => null}
						UIOptions={{
							canvasActions: {
								changeViewBackgroundColor: false,
								clearCanvas: false,
								export: false,
								loadScene: false,
								saveAsImage: false,
								saveToActiveFile: false,
								toggleTheme: null,
							},
						}}
					/>
				</div>
			</section>
		</main>
	);
}
