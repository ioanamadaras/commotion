import type { BoardRoomUser } from "@/types";
import { getUserColor, getUserInitials } from "@/utils/user";

export default function UserBubble({
	member,
	bg,
}: {
	member: BoardRoomUser;
	bg: string;
}) {
	return (
		<div
			className="cursor-pointer relative rounded-full w-11 h-11 flex items-center justify-center p-0.75"
			style={{ background: bg }}
			title={member.username}
			aria-label={member.username}
		>
			<span
				className="capitalize text-white! rounded-full w-full h-full flex items-center justify-center text-sm font-semibold"
				style={{ backgroundColor: getUserColor(member.username) }}
			>
				{getUserInitials(member.username)}
			</span>
		</div>
	);
}
