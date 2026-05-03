import { _useContext } from "../Context";
import { getGreeting } from "../utils/time";

export default function Home() {
    const { state } = _useContext();
    // const { team } = state;

    return (
        <main>
            <div className="flex w-full justify-between items-center px-2">
                <h1 className="mobilehidden">{getGreeting(state.user.username)}</h1>
                <h1 className="mobileonly">Hi, {state.user.username}!</h1>

            </div>
        </main>
    )
}
