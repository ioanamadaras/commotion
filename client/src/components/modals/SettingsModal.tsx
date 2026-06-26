import { _useContext } from '@/Context';
import PopoverShell from './PopoverShell';
import { useNavigate } from 'react-router-dom';
import type { AnchorRect, ModalPlacement } from '@/types';
import ThemeToggle from '../ThemeToggle';
import { api } from '@/api';
import { useEffect, useState } from 'react';

type SettingsModalProps = {
	anchorRect: AnchorRect;
	placement: ModalPlacement;
};

export default function SettingsModal({anchorRect, placement}: SettingsModalProps) {
	const { state, setState, closeModal, toggleTheme } = _useContext();
	const navigate = useNavigate();
	const [username, setUsername] = useState(state.user?.username ?? '');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setUsername(state.user?.username ?? '');
	}, [state.user?.username]);

	async function saveUsername() {
		const nextUsername = username.trim();
		if (!nextUsername || nextUsername === state.user?.username) return;

		setSaving(true);
		try {
			const updatedUser = await api('/user/username', {
				method: 'PATCH',
				body: JSON.stringify({ username: nextUsername }),
			});

			setState((prev) => ({ ...prev, user: updatedUser }));
		} catch (error) {
			console.error(error);
		} finally {
			setSaving(false);
		}
	}

	function handleLogout() {
		localStorage.removeItem('token');
		setState((prev) => ({ ...prev, user: null }));
		closeModal();
		navigate('/login');
	}

	return (
		<PopoverShell
			title="Settings"
			onClose={closeModal}
			anchorRect={anchorRect}
			placement={placement}
			className="w-[calc(min(50vw,17rem)-2rem)]"
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div>
						<p className="font-medium">Username</p>
					</div>
					<div className="flex gap-2">
						<input
							value={username}
							onChange={(event) =>
								setUsername(event.target.value)
							}
							className="min-w-0 flex-1 rounded-md border border-[var(--text)]/20 bg-transparent px-3 py-2 outline-none"
							placeholder="Choose a username"
							autoComplete="username"
						/>
						<button
							type="button"
							disabled={
								saving ||
								!username.trim() ||
								username.trim() === state.user?.username
							}
							onClick={() => void saveUsername()}
							className="rounded-md bg-(--text) px-4 text-(--bg) transition hover:bg-(--gray) disabled:opacity-60"
						>
							Save
						</button>
					</div>
				</div>

				<hr className="border-[var(--text)]/10" />

				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="font-medium">Light / Dark Theme</p>
					</div>
					<ThemeToggle
						checked={state.theme === 'light'}
						handleClick={toggleTheme}
					/>
				</div>

				<hr className="border-[var(--text)]/10" />

				<button
					type="button"
					onClick={handleLogout}
					className="flex h-10 items-center justify-center rounded-md bg-(--text) px-4 text-(--bg) transition hover:bg-(--gray)"
				>
					Log out
				</button>
			</div>
		</PopoverShell>
	);
}
