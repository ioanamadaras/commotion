import type { UserType } from "@/types"
import UserBubble from "./UserBubble"
import "../pages/board.css"

export default function MultipleUsersBubble({ members }: { members: UserType[] }) {
    let membersToRender = members;

    // daca sunt prea multi, afiseaza primii 4 cei mai activi + un bubble cu cati mai sunt
    if (members.length > 4) {
        membersToRender = members
            .filter((u) => u.lastPulseTimeStamp)
            .sort((a, b) => b.lastPulseTimeStamp!.getTime() - a!.lastPulseTimeStamp!.getTime()).slice(0, 4);
        
        membersToRender.push({
            _id: 'more_members',
            username: `+${members.length - 4}`,
            email: '',
        })
    }

    return (
        <div className="board-page__members">
            {membersToRender.map((member, i) => (
                <div
                    className="board-page__member"
                    style={{ zIndex: i }}
                    onClick={() => {
                        // show details of user X
                    }}
                    key={"member_" + member.username}
                >
                    <UserBubble member={member} />
                </div>
            ))
            }
        </div>
    )
}