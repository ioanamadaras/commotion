import { _useContext } from '@/Context';
import type { ToastItem } from '@/types';

const toastStyles: Record<ToastItem['level'], string> = {
	error: 'border-red-500/40 bg-red-500/15 text-red-100',
	warning: 'border-amber-400/40 bg-amber-400/15 text-amber-50',
	info: 'border-sky-400/40 bg-sky-400/15 text-sky-50',
	success: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-50',
};

export default function ToastHost() {
	const { state, removeToast } = _useContext();

	if (state.toasts.length === 0) {
		return null;
	}

	return (
		<div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex w-full -translate-x-1/2 justify-center px-4">
			<div className="flex w-full max-w-md flex-col items-center gap-2">
				{state.toasts.map((toast) => (
					<div
						key={toast.id}
						className={`pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${toastStyles[toast.level]}`}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-semibold uppercase tracking-wide opacity-70">
									{toast.level}
								</p>
								<p className="text-sm leading-5">{toast.message}</p>
							</div>
							<button
								type="button"
								className="shrink-0 rounded-md px-2 py-1 text-xs opacity-70 transition hover:bg-white/10 hover:opacity-100"
								onClick={() => removeToast(toast.id)}
							>
								Dismiss
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
