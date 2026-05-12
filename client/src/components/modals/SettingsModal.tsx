import { _useContext } from '@/Context';
import PopoverShell from './PopoverShell';
import { useNavigate } from 'react-router-dom';
import type { AnchorRect, ModalPlacement } from '@/types';
import ThemeToggle from '../ThemeToggle';

type SettingsModalProps = {
	anchorRect: AnchorRect;
	placement: ModalPlacement;
};

export default function SettingsModal({ anchorRect, placement }: SettingsModalProps) {
	const { state, closeModal, toggleTheme } = _useContext();
	const navigate = useNavigate();

	function handleLogout() {
		localStorage.removeItem('token');
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
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="font-medium">Light / Dark Theme</p>
					</div>
					<ThemeToggle checked={state.theme === 'light'} handleClick={toggleTheme} />
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
