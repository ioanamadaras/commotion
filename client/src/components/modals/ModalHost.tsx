import { _useContext } from '@/Context';
import BoardModal from './BoardModal';
import ConfirmDeleteBoardModal from './ConfirmDeleteBoardModal';
import QuickBoardModal from './QuickBoardModal';
import SettingsModal from './SettingsModal';

export default function ModalHost() {
	const { state } = _useContext();

	if (!state.activeModal) {
		return null;
	}

	switch (state.activeModal.type) {
		case 'settings':
			return (
				<SettingsModal
					anchorRect={state.activeModal.anchorRect}
					placement={state.activeModal.placement}
				/>
			);
		case 'board':
			return <BoardModal boardId={state.activeModal.boardId} />;
		case 'confirm-delete-board':
			return <ConfirmDeleteBoardModal boardId={state.activeModal.boardId} />;
		case 'create-board':
			return (
				<QuickBoardModal
					mode="create"
					anchorRect={state.activeModal.anchorRect}
					placement={state.activeModal.placement}
				/>
			);
		case 'join-board':
			return (
				<QuickBoardModal
					mode="join"
					anchorRect={state.activeModal.anchorRect}
					placement={state.activeModal.placement}
				/>
			);
		default:
			return null;
	}
}
