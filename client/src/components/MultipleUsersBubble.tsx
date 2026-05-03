import type { UserType } from "@/types"
import UserBubble from "./UserBubble"
import "./components.css";

const USER_LIMIT = 5;

export default function MultipleUsersBubble({ members, bg = "var(--bg)" }: { members: UserType[]; bg?: string }) {
    let membersToRender = members;

    // daca sunt prea multi, afiseaza primii 4 cei mai activi + un bubble cu cati mai sunt
    if (members.length > USER_LIMIT - 1) {
        membersToRender = members
            .filter((u) => u.lastPulseTimeStamp)
            .sort((a, b) => b.lastPulseTimeStamp!.getTime() - a.lastPulseTimeStamp!.getTime())
            .slice(0, USER_LIMIT - 1);
        
        membersToRender.push({
            _id: 'more_members',
            username: `+${members.length - USER_LIMIT + 1}`,
            email: '',
        })
    }

    return (
        <div className="board-page__members">
            {membersToRender.map((member, i) => (
                <div
                    className="board-page__member"
                    style={{ zIndex: USER_LIMIT - i }}
                    onClick={() => {
                        // show details of user X
                    }}
                    key={"member_" + member.username}
                >
                    <UserBubble member={member} bg={bg} />
                    {/* <h1>{getLastActiveTime(member.lastPulseTimeStamp!)}</h1> */}
                </div>
            ))
            }
        </div>
    )
}