import { api } from '@/api';
import { _useContext } from '@/Context';
import type { BoardType, UserType } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';

type UserRole = 'editor' | 'viewer';

const emptyBoard = {
	title: 'Untitled board',
	editorUsersIds: [] as string[],
	viewerUserIds: [] as string[],
};

export default function BoardModal({ boardId }: { boardId: string }) {
	const { closeModal, openModal } = _useContext();
	const [board, setBoard] = useState<BoardType | null>(null);
	const [title, setTitle] = useState(emptyBoard.title);
	const [editorUsersIds, setEditorUsersIds] = useState<string[]>([]);
	const [viewerUserIds, setViewerUserIds] = useState<string[]>([]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<UserType[]>([]);
	const [knownUsers, setKnownUsers] = useState<Record<string, UserType>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const canEditBoard = board?.permissionLevel !== 'viewer';
	const canManagePermissions = board?.permissionLevel === 'owner';
	const joinCode = board?.joinKey ?? '';

	useEffect(() => {
		let cancelled = false;

		async function loadBoard() {
			try {
				setLoading(true);
				const data = await api(`/board/${boardId}`);

				if (cancelled) return;

				setBoard(data);
				setTitle(data.title ?? emptyBoard.title);
				setEditorUsersIds(data.editorUsersIds ?? []);
				setViewerUserIds(data.viewerUserIds ?? []);

				const userIds = [
					data.owner,
					...(data.editorUsersIds ?? []),
					...(data.viewerUserIds ?? []),
				].filter(Boolean);

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

	const owner = board?.owner ? knownUsers[board.owner] : null;

	function rememberUsers(users: UserType[]) {
		setKnownUsers((prev) => {
			const next = { ...prev };
			for (const user of users) next[user._id] = user;
			return next;
		});
	}

	async function saveChanges() {
		setSaving(true);
		try {
			if (canEditBoard) {
				await api(`/board/${boardId}`, {
					method: 'PUT',
					body: JSON.stringify({
						title,
					}),
				});
			}

			if (canManagePermissions) {
				await api(`/board/${boardId}/permissions`, {
					method: 'PATCH',
					body: JSON.stringify({
						editorUsersIds,
						viewerUserIds,
					}),
				});
			}

			window.dispatchEvent(new Event('boards:refresh'));
			closeModal();
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
		setQuery('');
		setResults([]);
	}

	function removeUser(userId: string) {
		const nextEditors = editorUsersIds.filter((id) => id !== userId);
		const nextViewers = viewerUserIds.filter((id) => id !== userId);

		setEditorUsersIds(nextEditors);
		setViewerUserIds(nextViewers);
	}

	if (loading || !board) {
		return (
			<ModalShell title="Board settings" onClose={closeModal} className="max-w-3xl h-[80vh]">
				<div className="p-6 text-sm opacity-70">Loading board settings...</div>
			</ModalShell>
		);
	}

	return (
		<ModalShell title="Board settings" onClose={closeModal} className="max-w-3xl">
			<div className="relative flex h-[calc(100%-4.5rem)] flex-col">
				<div className="min-h-0 flex-1 overflow-y-auto p-4">
					<div className="flex flex-col gap-5">
						<div className="flex w-full">
							<p className="text-sm opacity-70 pr-3">Owner:</p>
							<p>{owner?.username ?? 'Board owner'}</p>
							{owner?.email ? <p>&nbsp;&nbsp;/&nbsp;&nbsp;{owner.email}</p> : null}
						</div>
						
						<div className="grid gap-4 grid-cols-[1fr_10rem]">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Name</label>
								<input
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									disabled={!canEditBoard}
									className="rounded-md border border-[var(--text)]/20 bg-transparent h-[3rem] px-3 outline-none"
									placeholder="Board name"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Join code</label>
								<div className="group relative flex items-center justify-center rounded-md border border-[var(--text)]/20 bg-[var(--bg-darker)] px-3 h-[3rem] text-center font-mono text-lg tracking-[0.3em]">
									<span className='opacity-0 group-hover:opacity-100'>
										{joinCode || '------'}
									</span>
									<span className='absolute group-hover:opacity-0 select-none'>
										{'------'}
									</span>
								</div>
							</div>
						</div>


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
										<label className="text-sm font-medium">Add users by username</label>
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
										<div className="flex max-h-[min(28vh,16rem)] flex-col gap-2 overflow-y-auto pr-1">
											{currentEditors.length === 0 ? (
												<p className="text-sm opacity-60">No editors yet.</p>
											) : currentEditors.map((user) => (
												<div key={user._id} className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-darker)] px-2 py-1">
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
										<div className="flex max-h-[min(28vh,16rem)] flex-col gap-2 overflow-y-auto pr-1">
											{currentViewers.length === 0 ? (
												<p className="text-sm opacity-60">No viewers yet.</p>
											) : currentViewers.map((user) => (
												<div key={user._id} className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-darker)] px-2 py-1">
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
					</div>
				</div>

				<div className="sticky bottom-0 min-w-full left-0 p-4 flex items-center justify-between gap-3 border-t border-[var(--text)]/10 bg-[var(--bg)]">
					{canManagePermissions ? (
						<button
							type="button"
							className="rounded-md border border-red-500 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white"
							onClick={() => openModal({ type: 'confirm-delete-board', boardId })}
						>
							Delete board
						</button>
					) : <span />}

					<button
						type="button"
						disabled={saving || !canEditBoard}
						className="rounded-md bg-(--text) px-5 py-2 text-(--bg) transition hover:bg-(--gray) disabled:opacity-60"
						onClick={() => void saveChanges()}
					>
						Save
					</button>
				</div>
			</div>
		</ModalShell>
	);
}
