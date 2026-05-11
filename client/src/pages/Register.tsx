import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { _useContext } from "@/Context";

export default function Register() {
    const { setState } = _useContext();
	const navigate = useNavigate();

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setError("");

			const data = await api("/user/register", {
				method: "POST",
				body: JSON.stringify({
					username,
					email,
					password,
				}),
			});

			localStorage.setItem("token", data.token);

            // updatam obiectul react din context
            setState(prev => ({
                ...prev, 
                user: {
                    ...data,
                    selectedTeam: data.selectedTeam ?? data.selectedTeamId ?? undefined,
                }
            }));

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
				<h1 className="text-2xl font-bold">Register</h1>

				{error && <p className="text-red-400">{error}</p>}

				<input
					className="w-full h-12 px-3 rounded bg-(--bg) border outline-none"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>

				<input
					className="w-full h-12 px-3 rounded bg-(--bg) border outline-none"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				<input
					className="w-full h-12 px-3 rounded bg-(--bg) border outline-none"
					placeholder="Password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

                <button className="bg-(--text) w-full text-(--bg) h-12 rounded-md flex gap-2 items-center justify-center hover:bg-(--gray) cursor-pointer">
					Register
				</button>

				<p className="mt-4 text-sm opacity-70">
                    Already a user?{" "}
					<Link to="/login" className="underline opacity-100">
						Login
					</Link>
				</p>
			</form>
		</div>
	);
}