import { api } from '@/api';
import { _useContext } from '@/Context';
import { useState } from 'react';
import type { AnchorRect, ModalPlacement } from '@/types';
import PopoverShell from './PopoverShell';
import { useNavigate } from 'react-router-dom';

type QuickBoardModalProps = {
	mode: 'create' | 'join';
	anchorRect: AnchorRect;
	placement: ModalPlacement;
};

export default function QuickBoardModal({
	mode,
	anchorRect,
	placement,
}: QuickBoardModalProps) {
	const { closeModal } = _useContext();
	const navigate = useNavigate();
	const [value, setValue] = useState('');
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit() {
		if (submitting) return;

		try {
			setSubmitting(true);

			if (mode === 'create') {
				const board = await api('/board/create', {
					method: 'POST',
					body: JSON.stringify({
						title: value.trim() || 'Untitled board',
						boardData: {
							elements: [],
							appState: {},
							files: {},
						},
					}),
				});

				window.dispatchEvent(new Event('boards:refresh'));
				closeModal();
				navigate(`/board/${board._id}`);
				return;
			}

			const code = value.trim();
			if (!/^\d{6}$/.test(code)) {
				return;
			}

			const board = await api('/board/joinUser', {
				method: 'PUT',
				body: JSON.stringify({ key: code }),
			});

			window.dispatchEvent(new Event('boards:refresh'));
			closeModal();
			navigate(`/board/${board._id}`);
		}
		catch (err) {
			console.error(err);
		}
		finally {
			setSubmitting(false);
		}
	}

	const isCreate = mode === 'create';

	return (
		<PopoverShell
			title={isCreate ? 'Create board' : 'Join board'}
			onClose={closeModal}
			anchorRect={anchorRect}
			placement={placement}
			className="w-[calc(min(50vw,17rem)-2rem)]"
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium opacity-70">
						{isCreate ? 'Board name' : '6-digit code'}
					</label>
					<input
						autoFocus
						value={value}
						onChange={(event) => {
							const nextValue = event.target.value;
							setValue(isCreate ? nextValue : nextValue.replace(/\D/g, '').slice(0, 6));
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								void handleSubmit();
							}
						}}
						inputMode={isCreate ? 'text' : 'numeric'}
						maxLength={isCreate ? 60 : 6}
						placeholder={isCreate ? 'Untitled board' : '123456'}
						className="rounded-md border border-[var(--text)]/20 bg-transparent px-3 py-2 text-sm outline-none"
					/>
				</div>

				<button
					type="button"
					disabled={submitting}
					onClick={() => void handleSubmit()}
					className="rounded-md bg-(--text) px-3 py-2 text-sm text-(--bg) disabled:opacity-60"
				>
					{isCreate ? 'Create board' : 'Join board'}
				</button>
			</div>
		</PopoverShell>
	);
}
