import type { BoardRoomUser } from "@/types";
import UserBubble from "./UserBubble";
import "./components.css";

const USER_LIMIT = 5;

export default function MultipleUsersBubble({
	members,
	bg = "var(--bg)",
}: {
	members: BoardRoomUser[];
	bg?: string;
}) {
	const visibleMembers = members.slice(0, USER_LIMIT);
	const hiddenCount = Math.max(0, members.length - USER_LIMIT);

	const membersToRender =
		hiddenCount > 0
			? [
				...visibleMembers,
				{
					socketId: "more_members",
					userId: "more_members",
					username: `+${hiddenCount}`,
				},
			]
			: visibleMembers;

	return (
		<div className="board-page__members">
			{membersToRender.map((member, index) => (
				<div
					className="board-page__member"
					style={{ zIndex: USER_LIMIT - index }}
					key={member.socketId}
				>
					<UserBubble member={member} bg={bg} />
				</div>
			))}
		</div>
	);
}
