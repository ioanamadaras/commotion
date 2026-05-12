import type { ToastLevel } from '@/types';

export type ToastEventDetail = {
	level?: ToastLevel;
	message: string;
};

export function emitToast(message: string, level: ToastLevel = 'info') {
	window.dispatchEvent(
		new CustomEvent<ToastEventDetail>('app:toast', {
			detail: { message, level },
		}),
	);
}

export function emitError(message: string) {
	emitToast(message, 'error');
}

export function emitWarning(message: string) {
	emitToast(message, 'warning');
}

export function emitSuccess(message: string) {
	emitToast(message, 'success');
}
