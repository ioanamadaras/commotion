export type UserType = {
	_id: string;
	username: string;
	email: string;
	lastPulseTimeStamp?: Date;
	isAdmin?: boolean;
	avatarURL?: string;
};

export type ContextType = {
	/**
	 * App's global state object
	 */
	state: StateType;
	/**
	 * Sets the app's global state object via dispatch
	 */
	setState: React.Dispatch<React.SetStateAction<StateType>>;
};

export type StateType = {
	/**
	 * The current font size of the app
	 * @remarks Use "rem" over "px" for everything except border-widths, shadows, specific margins/paddings to keep stuff responsive
	 */
	fontSize: number;
	theme: 'light' | 'dark';
	/**
	 * The currently logged in user
	 */
	user: UserType;
	/**
	 * The teams the user is a part of
	 */
	team: TeamType;
};

export type TeamType = {
	_id: string;
	name: string;
	members: UserType[];
};
