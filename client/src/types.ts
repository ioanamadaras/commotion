export type ContextType = {
	/**
	 * App's global state object
	 */
	state: StateType;
	/**
	 * Sets the app's global state object via dispatch
	 */
	setState: React.Dispatch<React.SetStateAction<StateType>>;
    /**
     * Changes the theme color
     */
    toggleTheme: () => void;
};

export type StateType = {
    isSidebarOpen: boolean;
    isModalOpen: boolean;
	/**
	 * The current font size of the app
	 * @remarks Use "rem" over "px" for everything except border-widths, shadows, specific margins/paddings to keep stuff responsive
	 */
	fontSize: number;
	theme: 'light' | 'dark';
	/**
	 * The currently logged in user
	 */
	user: UserType | null;
	/**
	 * The teams the user is a part of
	 */
	teams: TeamType[];

    selectedTeamBoards: BoardType[];
    personalBoards: BoardType[];
};

export type UserType = {
	_id: string;
	username: string;
	email: string;
	lastPulseTimeStamp?: Date;
	selectedTeamId?: string;
};

export type TeamType = {
	_id: string;
	name: string;
    owner: string;
	members: UserType[];
};

export type BoardType = {
    _id: string;
    title: string;
    owner: string;
    isPersonal: boolean;
    teamId: string | null;
    boardData: {
        type: string;
        version: number;
        elements: unknown[];
        appState: Record<string, unknown>;
        files: Record<string, unknown>;
    };
    createdAt: Date;
    updatedAt: Date;
}