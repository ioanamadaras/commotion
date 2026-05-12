import { _useContext } from "../Context";
import { getGreeting } from "../utils/time";

export default function Home() {
    const { state } = _useContext();

    return (
        <main className="flex-1 bg-[var(--bg)] p-6 text-[var(--text)]">
            <div className="flex w-full justify-between items-center">
                <div>
                    <h1 className="mobilehidden text-2xl font-semibold">{getGreeting(state?.user?.username ?? "")}</h1>
                    <h1 className="mobileonly text-2xl font-semibold">Hi, {state.user?.username}!</h1>
                    <p className="mt-2 text-sm opacity-70">Create a board or open one from the sidebar.</p>
                </div>
            </div>
        </main>
    )
}
