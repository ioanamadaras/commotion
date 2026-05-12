import { api } from '@/api';
import { _useContext } from '@/Context';
import type { BoardType, UserType } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import Toggle from '../Toggle';

type UserRole = 'editor' | 'viewer';

const emptyBoard = {
	title: 'Untitled board',
	isPersonal: true,
	editorUsersIds: [] as string[],
	viewerUserIds: [] as string[],
};

export default function BoardModal({ boardId }: { boardId: string }) {
	const { closeModal, openModal } = _useContext();
	const [board, setBoard] = useState<BoardType | null>(null);
	const [title, setTitle] = useState(emptyBoard.title);
	const [isPersonal, setIsPersonal] = useState(emptyBoard.isPersonal);
	const [editorUsersIds, setEditorUsersIds] = useState<string[]>([]);
	const [viewerUserIds, setViewerUserIds] = useState<string[]>([]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<UserType[]>([]);
	const [knownUsers, setKnownUsers] = useState<Record<string, UserType>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const canEditBoard = board?.permissionLevel !== 'viewer';
	const canManagePermissions = board?.permissionLevel === 'owner';

	useEffect(() => {
		let cancelled = false;

		async function loadBoard() {
			try {
				setLoading(true);
				const data = await api(`/board/${boardId}`);

				if (cancelled) return;

				setBoard(data);
				setTitle(data.title ?? emptyBoard.title);
				setIsPersonal(!!data.isPersonal);
				setEditorUsersIds(data.editorUsersIds ?? []);
				setViewerUserIds(data.viewerUserIds ?? []);

				const userIds = [
					...(data.editorUsersIds ?? []),
					...(data.viewerUserIds ?? []),
				];

				if (userIds.length > 0) {
					const users = await api(`/user/lookup?ids=${encodeURIComponent(userIds.join(','))}`);
					if (!cancelled) {
						rememberUsers(users);
					}
				}
			}
			catch (err) {
				console.error(err);
			}
			finally {
				if (!cancelled) setLoading(false);
			}
		}

		loadBoard();
		return () => {
			cancelled = true;
		};
	}, [boardId]);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < 2) {
			setResults([]);
			return;
		}

		let cancelled = false;
		const timeout = window.setTimeout(async () => {
			try {
				const users = await api(`/user/search?query=${encodeURIComponent(trimmed)}`);
				if (!cancelled) {
					setResults(users);
					setKnownUsers((prev) => {
						const next = { ...prev };
						for (const user of users) next[user._id] = user;
						return next;
					});
				}
			}
			catch (err) {
				console.error(err);
			}
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(timeout);
		};
	}, [query]);

	const currentEditors = useMemo(
		() => editorUsersIds.map((id) => knownUsers[id]).filter(Boolean),
		[editorUsersIds, knownUsers],
	);

	const currentViewers = useMemo(
		() => viewerUserIds.map((id) => knownUsers[id]).filter(Boolean),
		[viewerUserIds, knownUsers],
	);

	function rememberUsers(users: UserType[]) {
		setKnownUsers((prev) => {
			const next = { ...prev };
			for (const user of users) next[user._id] = user;
			return next;
		});
	}

	async function saveMeta(nextTitle = title, nextPersonal = isPersonal) {
		setSaving(true);
		try {
			await api(`/board/${boardId}`, {
				method: 'PUT',
				body: JSON.stringify({
					title: nextTitle,
					isPersonal: nextPersonal,
				}),
			});
			window.dispatchEvent(new Event('boards:refresh'));
		}
		catch (err) {
			console.error(err);
		}
		finally {
			setSaving(false);
		}
	}

	async function savePermissions(nextEditors: string[], nextViewers: string[]) {
		setSaving(true);
		try {
			await api(`/board/${boardId}/permissions`, {
				method: 'PATCH',
				body: JSON.stringify({
					editorUsersIds: nextEditors,
					viewerUserIds: nextViewers,
				}),
			});
			window.dispatchEvent(new Event('boards:refresh'));
		}
		catch (err) {
			console.error(err);
		}
		finally {
			setSaving(false);
		}
	}

	function addUser(user: UserType, role: UserRole) {
		rememberUsers([user]);

		const nextEditors = editorUsersIds.filter((id) => id !== user._id);
		const nextViewers = viewerUserIds.filter((id) => id !== user._id);

		if (role === 'editor') {
			nextEditors.push(user._id);
		}
		else {
			nextViewers.push(user._id);
		}

		setEditorUsersIds(nextEditors);
		setViewerUserIds(nextViewers);
		void savePermissions(nextEditors, nextViewers);
	}

	function removeUser(userId: string) {
		const nextEditors = editorUsersIds.filter((id) => id !== userId);
		const nextViewers = viewerUserIds.filter((id) => id !== userId);

		setEditorUsersIds(nextEditors);
		setViewerUserIds(nextViewers);
		void savePermissions(nextEditors, nextViewers);
	}

	if (loading || !board) {
		return (
			<ModalShell title="Board settings" onClose={closeModal} className="max-w-3xl">
				<div className="py-6 text-sm opacity-70">Loading board settings...</div>
			</ModalShell>
		);
	}

	return (
		<ModalShell title="Board settings" onClose={closeModal} className="max-w-3xl">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium">Name</label>
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						disabled={!canEditBoard}
						className="rounded-md border border-[var(--text)]/20 bg-transparent px-3 py-2 outline-none"
						placeholder="Board name"
					/>
				</div>

				<div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--text)]/10 px-4 py-3">
					<div>
						<p className="font-medium">Personal board</p>
						<p className="text-sm opacity-70">Turn this off to make it shared.</p>
					</div>
					<Toggle
						checked={isPersonal}
						handleClick={() => {
							if (canEditBoard) {
								setIsPersonal((prev) => !prev);
							}
						}}
					/>
				</div>

				{canEditBoard ? (
					<button
						type="button"
						disabled={saving}
						onClick={() => void saveMeta(title, isPersonal)}
						className="rounded-md bg-(--text) px-4 py-2 text-(--bg) disabled:opacity-60"
					>
						Save name and sharing
					</button>
				) : null}

				{board.permissionLevel === 'viewer' ? (
					<p className="text-sm opacity-70">
						You can view this board, but only editors and owners can change it.
					</p>
				) : null}

				{canManagePermissions ? (
					<>
						<hr className="border-[var(--text)]/10" />

						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Add people by username</label>
								<input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									className="rounded-md border border-[var(--text)]/20 bg-transparent px-3 py-2 outline-none"
									placeholder="Search username"
								/>
							</div>

							{results.length > 0 ? (
								<div className="flex flex-col gap-2">
									{results.map((user) => (
										<div
											key={user._id}
											className="flex items-center justify-between gap-3 rounded-md border border-[var(--text)]/10 px-3 py-2"
										>
											<div>
												<p className="font-medium">{user.username}</p>
												<p className="text-xs opacity-60">{user.email}</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													className="rounded-md border border-[var(--text)]/20 px-3 py-1 text-sm"
													onClick={() => addUser(user, 'viewer')}
												>
													Viewer
												</button>
												<button
													type="button"
													className="rounded-md bg-(--text) px-3 py-1 text-sm text-(--bg)"
													onClick={() => addUser(user, 'editor')}
												>
													Editor
												</button>
											</div>
										</div>
									))}
								</div>
							) : null}
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-lg border border-[var(--text)]/10 p-3">
								<p className="mb-3 font-medium">Editors</p>
								<div className="flex flex-col gap-2">
									{currentEditors.length === 0 ? (
										<p className="text-sm opacity-60">No editors yet.</p>
									) : currentEditors.map((user) => (
										<div key={user._id} className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-darker)] px-3 py-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">{user.username}</p>
												<p className="truncate text-xs opacity-60">{user.email}</p>
											</div>
											<button
												type="button"
												className="rounded-md border border-[var(--text)]/20 px-2 py-1 text-xs"
												onClick={() => removeUser(user._id)}
											>
												Remove
											</button>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-lg border border-[var(--text)]/10 p-3">
								<p className="mb-3 font-medium">Viewers</p>
								<div className="flex flex-col gap-2">
									{currentViewers.length === 0 ? (
										<p className="text-sm opacity-60">No viewers yet.</p>
									) : currentViewers.map((user) => (
										<div key={user._id} className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-darker)] px-3 py-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">{user.username}</p>
												<p className="truncate text-xs opacity-60">{user.email}</p>
											</div>
											<button
												type="button"
												className="rounded-md border border-[var(--text)]/20 px-2 py-1 text-xs"
												onClick={() => removeUser(user._id)}
											>
												Remove
											</button>
										</div>
									))}
								</div>
							</div>
						</div>
					</>
				) : null}

				<div className="flex justify-between gap-2">
					<button
						type="button"
						className="rounded-md border border-red-500 px-4 py-2 text-red-500"
						onClick={() => closeModal()}
					>
						Close
					</button>
					{canEditBoard ? (
						<button
							type="button"
							className="rounded-md bg-red-600 px-4 py-2 text-white"
							onClick={() => {
								void saveMeta(title, isPersonal);
							}}
						>
							Save changes
						</button>
					) : null}
				</div>

				{canManagePermissions ? (
					<button
						type="button"
						className="rounded-md border border-red-500 px-4 py-2 text-red-500"
						onClick={() => openModal({ type: 'confirm-delete-board', boardId })}
					>
						Delete board
					</button>
				) : null}
			</div>
		</ModalShell>
	);
}
