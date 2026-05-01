import React, { createContext, useContext, useState } from 'react';
import type { ContextType, StateType } from './types';

const MockUser = 
	{
		// 	_id: '',
		// 	username: '',
		// 	email: '',
		_id: 'feanfoianfae1r',
		username: 'iOANa',
		email: 'mioana123@gmail.com',
		isAdmin: true,
		avatarURL: "https://lh3.googleusercontent.com/ogw/AF2bZyjfE881yO68aeEEGaQi9UYU7Wr0ZmWjgJy0FXp1mfZV=s64-c-mo"
	}

const initialState: StateType = {
	fontSize:
		parseFloat(getComputedStyle(document.documentElement).fontSize) ?? 14,
	theme:
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light',
	user: localStorage.getItem('user')
		? JSON.parse(localStorage.getItem('user') as string)
		: {
			// id: '',
			// username: '',
			// email: '',
			...MockUser
		},
	team: {
		_id: 'team1',
		name: 'Team Alpha',
		members: [
			{
				_id: 'feanfoianfae1r',
				username: 'iOANa',
				email: 'mioana123@gmail.com',
				avatarURL: "https://lh3.googleusercontent.com/ogw/AF2bZyjfE881yO68aeEEGaQi9UYU7Wr0ZmWjgJy0FXp1mfZV=s64-c-mo",
				lastPulseTimeStamp: new Date() // for testing purposes, set the user as active by giving them a recent pulse timestamp
			},
			{
				_id: '1213i1no31inadaaaccaacac',
				username: 'Ioana',
				email: 'ioanamadaras2000@gmail.com',
				lastPulseTimeStamp: new Date(Date.now() - 120000) // for testing purposes, set the user as inactive by giving them an old pulse timestamp (2 minutes ago)
			},
			{
				_id: '1n23oin23',
				username: 'Andrei',
				email: 'andrei@gmail.com'
			}
		],
	}
};

const Context = createContext<ContextType>({
	state: initialState,
	setState: () => {},
}) as React.Context<ContextType>;

export function _useContext() {
	const ctx = useContext(Context);
	if (!ctx) throw new Error("_useContext must be used within a StateProvider");
	return ctx;
}

export const StateProvider = (props: React.PropsWithChildren<{}>) => {
	const [state, setState] = useState<StateType>(initialState);

	return (
		<Context.Provider value={{ state, setState }}>
			{props.children}
		</Context.Provider>
	);
};