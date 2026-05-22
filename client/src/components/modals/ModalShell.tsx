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
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={onClose}
		>
			<div
				className={`w-full max-h-[min(90vh,58rem)] overflow-hidden rounded-xl border border-[var(--text)] bg-[var(--bg)] text-[var(--text)] shadow-2xl ${className}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-[var(--text)]/10 px-5 py-4">
					<h3 className="text-base font-semibold">{title}</h3>
					<button
						type="button"
						className="rounded-md p-1 opacity-70 transition hover:bg-[var(--bg-darker)] hover:opacity-100"
						onClick={onClose}
						aria-label="Close modal"
					>
						<svg fill="var(--text)" className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path d="M19 5L5 19" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M5 5L19 19" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<div className="h-full overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
}
