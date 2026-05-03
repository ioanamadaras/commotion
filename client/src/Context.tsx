import React, { createContext, useContext, useState } from 'react';
import type { ContextType, StateType, UserType } from './types';

const MockUser: UserType = {
	_id: 'feanfoianfae1r',
	username: 'Nana',
	email: 'mioana123@gmail.com',
	avatarURL: 'https://lh3.googleusercontent.com/ogw/AF2bZyhvmgVKbFGZoyxIAIO0yJeg3go9pOH_AH9OqhwlAgKiqAM=s64-c-mo',
	lastPulseTimeStamp: new Date(Date.now()),
	selectedTeam: 'team1',
};

const initialTeams = [
	{
		_id: 'team1',
		name: 'Deiu&Nana',
		members: [
			MockUser,
			{
				_id: '1213i1no31inadaaaccaacac',
				username: 'Ioana Maria',
				email: 'ioanamadaras2000@gmail.com',
				lastPulseTimeStamp: new Date(Date.now() - 47 * 60 * 1000), // - 47min ago
			},
			{
				_id: '1n23oin23',
				username: 'Andrei Vascul',
				email: 'andrei@gmail.com',
				avatarURL: 'https://lh3.googleusercontent.com/ogw/AF2bZyjfE881yO68aeEEGaQi9UYU7Wr0ZmWjgJy0FXp1mfZV=s64-c-mo',
				lastPulseTimeStamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // - 4h ago
			},
		],
	},
	{
		_id: 'team123',
		name: 'SciChart',
		members: [
			{
				_id: '1n23oin23',
				username: 'Andrei',
				email: 'andrei@gmail.com',
				avatarURL: 'https://lh3.googleusercontent.com/ogw/AF2bZyhvmgVKbFGZoyxIAIO0yJeg3go9pOH_AH9OqhwlAgKiqAM=s64-c-mo',
				lastPulseTimeStamp: new Date(Date.now() - 12 * 60 * 1000), // - 12min ago
			},
			MockUser,
		],
	},
] satisfies StateType['teams'];

const defaultSelectedTeam = initialTeams[0]._id;

function getInitialUser(): UserType {
	const storedUser = localStorage.getItem('user');

	if (!storedUser) {
		return {
			// id: '', username: '', email: '', // un-comment on prod
			...MockUser,
			selectedTeam: defaultSelectedTeam,
		};
	}

	const parsedUser = JSON.parse(storedUser) as UserType;

	return {
		...parsedUser,
		selectedTeam: parsedUser.selectedTeam ?? defaultSelectedTeam,
	};
}

const initialState: StateType = {
	isSidebarOpen: false,
	isModalOpen: false,
	fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize) ?? 14,
	theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
	user: getInitialUser(),
	teams: initialTeams,
};

const Context = createContext<ContextType>({
	state: initialState,
	setState: () => {},
}) as React.Context<ContextType>;

export function _useContext() {
	const ctx = useContext(Context);
	if (!ctx) throw new Error('_useContext must be used within a StateProvider');
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
