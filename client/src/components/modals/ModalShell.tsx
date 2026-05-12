import { useEffect } from 'react';

type ModalShellProps = {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
	className?: string;
};

export default function ModalShell({
	title,
	children,
	onClose,
	className = '',
}: ModalShellProps) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
		>
			<div
				className={`w-full max-h-[min(90vh,48rem)] overflow-hidden rounded-xl border border-[var(--text)] bg-[var(--bg)] text-[var(--text)] shadow-2xl ${className}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-[var(--text)]/10 px-5 py-4">
					<h3 className="text-base font-semibold">{title}</h3>
					<button
						type="button"
						className="rounded-md px-2 py-1 text-sm opacity-70 transition hover:bg-[var(--bg-darker)] hover:opacity-100"
						onClick={onClose}
						aria-label="Close modal"
					>
						Close
					</button>
				</div>

				<div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-5 py-4">
					{children}
				</div>
			</div>
		</div>
	);
}
