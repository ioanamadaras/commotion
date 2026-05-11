import React, { createContext, useContext, useState } from 'react';
import type { ContextType, StateType } from './types';

const initialState: StateType = {
	isSidebarOpen: false,
	isModalOpen: false,
	fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize) ?? 14,
	theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
	user: null,
	teams: [],
	selectedTeamBoards: [],
	personalBoards: [],
};

const Context = createContext<ContextType>({
	state: initialState,
	setState: () => {},
	toggleTheme: () => {},
});

export const StateProvider = (props: React.PropsWithChildren<{}>) => {
	const [state, setState] = useState<StateType>(initialState);

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

		setState((prev) => ({ ...prev, theme: nextTheme }));
	}

	return (
		<Context.Provider value={{ state, setState, toggleTheme }}>
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
