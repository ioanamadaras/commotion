import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ContextType, StateType, ToastItem } from './types';
import type { ToastEventDetail } from './utils/toast';

const initialState: StateType = {
	isSidebarOpen: false,
	fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize) ?? 14,
	theme: localStorage.getItem("theme") as StateType["theme"] 
        ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
	user: null,
	boards: [],
	boardsLoading: true,
    activeModal: null,
    toasts: [],
};

const Context = createContext<ContextType>({
	state: initialState,
	setState: () => {},
    openModal: () => {},
    closeModal: () => {},
	toggleTheme: () => {},
    addToast: () => {},
    removeToast: () => {},
});

export const StateProvider = (props: React.PropsWithChildren<{}>) => {
	const [state, setState] = useState<StateType>(initialState);
    const toastTimersRef = useRef<Record<string, number>>({});

    function openModal(modal: Exclude<StateType["activeModal"], null>) {
        setState((prev) => ({ ...prev, activeModal: modal }));
    }

    function closeModal() {
        setState((prev) => ({ ...prev, activeModal: null }));
    }

    function removeToast(toastId: string) {
        const timer = toastTimersRef.current[toastId];
        if (timer) {
            window.clearTimeout(timer);
            delete toastTimersRef.current[toastId];
        }

        setState((prev) => ({
            ...prev,
            toasts: prev.toasts.filter((toast) => toast.id !== toastId),
        }));
    }

    function addToast(toast: Omit<ToastItem, 'id'>) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const nextToast: ToastItem = { ...toast, id };

        setState((prev) => ({
            ...prev,
            toasts: [...prev.toasts, nextToast],
        }));

        toastTimersRef.current[id] = window.setTimeout(() => {
            removeToast(id);
        }, 3800);
    }

	function toggleTheme() {
		const nextTheme = state.theme === 'dark' ? 'light' : 'dark';

		document.documentElement.setAttribute('data-theme', nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute(
				'content',
				getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
			);
        localStorage.setItem("theme", nextTheme);

		setState((prev) => ({ ...prev, theme: nextTheme }));
	}

    useEffect(() => {
        const handleToast = (event: Event) => {
            const detail = (event as CustomEvent<ToastEventDetail>).detail;
            if (!detail?.message) return;

            addToast({
                level: detail.level ?? 'info',
                message: detail.message,
            });
        };

        window.addEventListener('app:toast', handleToast);

        return () => {
            window.removeEventListener('app:toast', handleToast);
            Object.values(toastTimersRef.current).forEach((timer) => window.clearTimeout(timer));
            toastTimersRef.current = {};
        };
    }, []);

	return (
		<Context.Provider value={{ state, setState, openModal, closeModal, toggleTheme, addToast, removeToast }}>
			{props.children}
		</Context.Provider>
	);
};

export function _useContext() {
	const ctx = useContext(Context);
	if (!ctx) {
		throw new Error('_useContext must be used within a StateProvider');
	}
	return ctx;
}
