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
	 * Opens a modal by type
	 */
	openModal: (modal: Exclude<ModalState, null>) => void;
	/**
	 * Closes any active modal
	 */
	closeModal: () => void;
	/**
	 * Changes the theme color
	 */
	toggleTheme: () => void;
	/**
	 * Adds a toast notification to the global queue
	 */
	addToast: (toast: Omit<ToastItem, 'id'>) => void;
	/**
	 * Removes a toast notification from the global queue
	 */
	removeToast: (toastId: string) => void;
};

export type StateType = {
	isSidebarOpen: boolean;
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
	boards: BoardType[];
	boardsLoading: boolean;
	activeModal: ModalState;
	toasts: ToastItem[];
};

export type AnchorRect = {
	top: number;
	left: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
};

export type ModalPlacement = 'top' | 'bottom';

export type ToastLevel = 'error' | 'warning' | 'info' | 'success';

export type ToastItem = {
	id: string;
	level: ToastLevel;
	message: string;
};

export type ModalState =
	| { type: 'settings'; anchorRect: AnchorRect; placement: ModalPlacement }
	| { type: 'board'; boardId: string }
	| { type: 'confirm-delete-board'; boardId: string }
	| {
			type: 'create-board';
			anchorRect: AnchorRect;
			placement: ModalPlacement;
	  }
	| { type: 'join-board'; anchorRect: AnchorRect; placement: ModalPlacement }
	| null;

export type UserType = {
	_id: string;
	username: string;
	email: string;
	userType?: 'user' | 'guest';
};

export type BoardRoomUser = {
	socketId: string;
	userId: string;
	username: string;
};

export type BoardType = {
	_id: string;
	title: string;
	owner: string;
	joinKey?: string;
	permissionLevel?: 'owner' | 'editor' | 'viewer';
	editorUserIds?: string[];
	viewerUserIds?: string[];
	boardData: {
		type: string;
		version: number;
		elements: unknown[];
		appState: Record<string, unknown>;
		files: Record<string, unknown>;
	};
	createdAt: Date;
	updatedAt: Date;
};
