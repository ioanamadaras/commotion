import type { UserType } from "../types";
import { getUserColor } from "../utils/colors";
import { isUserActive } from "../utils/time";

export default function UserBubble({member}: {member: UserType}) {
    let isUserActiveStatus = isUserActive(member.lastPulseTimeStamp);

    return (
        <div className="bg-[var(--bg)] cursor-pointer relative rounded-full w-12 h-12 flex items-center justify-center p-1">
            <span
                key={member._id}
                className="capitalize text-white rounded-full w-full h-full flex items-center justify-center"
                style={{ backgroundColor: getUserColor(member._id) }}
            >
                {member.avatarURL 
                    ? <img src={member.avatarURL} alt={member.username} className="rounded-full w-full h-full object-cover" />
                    : member.username 
                        ? member.username.slice(0, 1) 
                        : '?'
                }
            </span>
            <div className="absolute rounded-full bottom-0.5 right-0.5 w-4 h-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 36 36" fill="none" className="w-full h-full">
                    <circle cx="12" cy="12" r="12" fill={isUserActiveStatus ? '#11bb33' : '#cc8811' } />
                    {isUserActiveStatus 
                        ? <path d="M4 11l5 6L19 6" stroke="black" strokeWidth={4} />
                        : <path d="M10 5v7l7 5" stroke="black" strokeWidth={4} />
                    }
                    <path d="M 22 1A 1 1 0 0 0 1.8 22.762" strokeWidth={6} stroke="var(--bg)" fill="none" />
                </svg>
            </div>
        </div>
    )
}