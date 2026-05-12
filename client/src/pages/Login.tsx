import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { _useContext } from "@/Context";

export default function Login() {
    const { setState } = _useContext();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setError("");

            // primim datele din db
			const data = await api("/user/login", {
				method: "PUT",
				body: JSON.stringify({
					email,
					password,
				}),
			});

            const { token, ...user } = data;

            // updatam obiectul react din context
            setState(prev => ({
                ...prev, 
                user: {
                    ...user,
                    selectedTeam: user.selectedTeamId ?? undefined,
                }
            }));

            // salvam doar tokenul in localStorage
            localStorage.setItem("token", token);

            navigate("/");
        } catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<div className="w-screen min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
			<form
				onSubmit={handleSubmit}
				className="w-[25rem] border rounded-lg py-4 px-5 bg-(--bg-darker) flex flex-col gap-4"
			>
				<h1 className="text-2xl font-bold">Login</h1>

                {error && <p className="text-red-400">{error}</p>}
                
				<input
					className="bg-(--bg) w-full px-3 h-12 rounded border outline-none"
					placeholder="Email"
					value={email}
                    required
					onChange={(e) => setEmail(e.target.value)}
				/>

				<input
					className="bg-(--bg) w-full px-3 h-12 rounded border outline-none"
					placeholder="Password"
					type="password"
					value={password}
                    required
					onChange={(e) => setPassword(e.target.value)}
				/>

                <button className="bg-(--text) w-full text-(--bg) h-12 rounded-md flex gap-2 items-center justify-center hover:bg-(--gray) cursor-pointer">
					Login
				</button>

				<p className="text-sm opacity-70">
					No account?{" "}
					<Link to="/register" className="underline">
						Register
					</Link>
				</p>
			</form>
		</div>
	);
}
