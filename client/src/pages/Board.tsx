import { _useContext } from "../Context";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import "./board.css";
import MultipleUsersBubble from "@/app-components/MultipleUsersBubble";

export default function Board() {
	const { state } = _useContext();
	const { team } = state;

	return (
		<main className="board-page">
			<MultipleUsersBubble members={team.members} />

			<section className="board-page__editor-section">
				<div className="board-page__editor-shell">
					<SimpleEditor />
				</div>
			</section>
		</main>
	);
}
