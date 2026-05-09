import { getUserColor } from "@/utils/colors";

export default function Cursor({
	socketId,
	userId,
	username,
	x,
	y,
}: {
	socketId: string;
	userId: string;
	username: string;
	x: number;
	y: number;
}) {
    const userColor = getUserColor(username);

    console.log("Rendering cursor for user", username, "at position", x, y, "with color", userColor);
	return (
		<div
			key={socketId}
			style={{
				position: 'fixed',
				left: x,
				top: y,
				pointerEvents: 'none',
				zIndex: 9999,
				transform: 'translate(-0.6rem, -0.6rem)',
                width: '2.6rem',
                height: '2.6rem',
			}}
		>
            {/* <div className="w-[1px] h-[1px] bg-red-500"></div> */}

            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="2.6rem" height="2.6rem" viewBox="0 0 28 28" enable-background="new 0 0 28 28">
                <polygon fill={userColor} points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6 "/>
            </svg>

            <div
                style={{
                    position: 'relative',
                    left: "1.5rem",
                    top: "-0.4rem",
                    background: userColor,
                    color: 'var(--text)',
                    padding: '2px 10px',
                    borderRadius: "99px",
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    width: 'max-content',
                }}
            >
                {username}
            </div>
		</div>
	);
}
