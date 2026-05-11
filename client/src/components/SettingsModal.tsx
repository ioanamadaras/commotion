import { _useContext } from "@/Context";
import Toggle from "./Toggle";
import { useNavigate } from "react-router-dom";

// todo here:
// light/dark mode toggle
// switch teams (selectedTeamId & teamBoards from context state)
// -----
// logout

export default function SettingsModal() {
    const { state, setState, toggleTheme } = _useContext();

    const navigate = useNavigate()

    function handleLogout() {
        if (localStorage.getItem("token")) {
            localStorage.removeItem("token");
        }
        setState(prev => ({
            ...prev,
            user: {
                username: "",
                email: "",
                _id: ""
            }
        }))

        navigate("/login");
    }

    return (
        <div className="fixed inset-0 bg-[#0006] z-100 flex"
            onClick={() => setState(prev => ({ ...prev, isModalOpen: false }))}
        >
            <div
                className="w-[calc(min(50vw,17rem)-2rem)] flex flex-col gap-2 mx-[var(--padding)] mt-auto mb-[4.5rem] bg-[var(--bg)] pt-2 px-3 pb-3 rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >	
                <div className="flex w-full justify-between items-center">
                    <h4 className="font-bold mb-4">Settings</h4>
                    <div 
                        onClick={() => setState(prev => ({ ...prev, isModalOpen: false }))}
                        className="cursor-pointer text-[var(--text)] hover:text-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                <div className="flex w-full justify-between items-center">
                    <p>Theme:</p>

                    <Toggle checked={state.theme === "light"} handleClick={() => toggleTheme()} />
                </div>

                <hr />

                <div 
                    onClick={handleLogout}
                    className="bg-(--text) text-(--bg) p-1 rounded-md flex gap-2 items-center justify-center h-8 hover:bg-(--gray) cursor-pointer"
                >
                    <span>Log&nbsp;out</span>
				</div>
            </div>
		</div>
    )
}
