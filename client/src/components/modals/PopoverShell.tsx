import { useEffect } from 'react';
import type { AnchorRect, ModalPlacement } from '@/types';

type PopoverShellProps = {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
	anchorRect: AnchorRect;
	placement: ModalPlacement;
	className?: string;
};

const GAP = 8;
const EDGE = 8;

export default function PopoverShell({
	title,
	children,
	onClose,
	anchorRect,
	placement,
	className = '',
}: PopoverShellProps) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	const top =
		placement === 'bottom'
			? anchorRect.bottom + GAP
			: Math.max(EDGE, anchorRect.top - GAP);

	const left = Math.max(
		EDGE,
		Math.min(anchorRect.left, window.innerWidth - 18 * 16 - EDGE),
	);

	return (
		<div
			className="fixed inset-0 z-50"
			onClick={onClose}
		>
			<div
				className={`fixed rounded-xl border border-[var(--text)] bg-[var(--bg)] text-[var(--text)] shadow-2xl ${className}`}
				style={{
					top,
					left,
					transform: placement === 'top' ? 'translateY(-100%)' : undefined,
					maxWidth: 'calc(100vw - 1rem)',
				}}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-[var(--text)]/10 px-3 py-2">
					<h3 className="text-sm font-semibold">{title}</h3>
					<button
						type="button"
						className="rounded-md text-xs opacity-70 p-1 cursor-pointer transition hover:bg-[var(--bg-darker)] hover:opacity-100"
						onClick={onClose}
					>
						<svg fill="var(--text)" className='size-5' viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 5L5 19" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M5 5L19 19" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
					</button>
				</div>

				<div className="px-3 py-3">{children}</div>
			</div>
		</div>
	);
}
