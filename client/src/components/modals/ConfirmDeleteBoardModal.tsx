import { api } from '@/api';
import { _useContext } from '@/Context';
import { useNavigate } from 'react-router-dom';
import ModalShell from './ModalShell';

export default function ConfirmDeleteBoardModal({
	boardId,
}: {
	boardId: string;
}) {
	const { closeModal } = _useContext();
	const navigate = useNavigate();

	async function handleDelete() {
		try {
			await api(`/board/${boardId}`, {
				method: 'DELETE',
			});

			window.dispatchEvent(new Event('boards:refresh'));
			closeModal();
			navigate('/');
		}
		catch (err) {
			console.error(err);
		}
	}

	return (
		<ModalShell title="Delete board" onClose={closeModal} className="max-w-sm">
			<div className="flex flex-col gap-4">
				<p className="text-sm opacity-80">
					Are you sure? This will permanently delete the board and everyone will lose access.
				</p>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={closeModal}
						className="flex-1 rounded-md border border-[var(--text)] px-4 py-2"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleDelete}
						className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white"
					>
						Delete
					</button>
				</div>
			</div>
		</ModalShell>
	);
}
