import { Route, Routes, Navigate } from "react-router-dom";
import SettingsModal from "./components/SettingsModal";
import Board from "./pages/Board";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { _useContext } from "./Context";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { api } from "./api";

function App() {
	const { state, setState } = _useContext();
	const [authReady, setAuthReady] = useState(false);
	const isLoggedIn = !!state.user?.username;

	useEffect(() => {
		const token = localStorage.getItem("token");
		
        if (!token) { // daca nu exista token
			setAuthReady(true);
			return;
		}

		async function fetchUser() {
			try {
				const data = await api("/user/me", {
					method: "GET",
				});
				setState((prev) => ({ ...prev, user: data }));
			}
			catch {
				localStorage.removeItem("token");
				setState((prev) => ({ ...prev, user: null }));
			}
			finally {
				setAuthReady(true);
			}
		}

		fetchUser();
	}, [setState]);

	if (!authReady) {
		return <div className="w-screen min-h-screen bg-[var(--bg)]"/>;
	}
	return (
		<div className="w-screen h-full min-h-screen flex">
			{isLoggedIn && <Sidebar />}
            
			<Routes>
				<Route path="/register" element={isLoggedIn ? <Navigate to="/" /> : <Register />} />
				<Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login />} />

				<Route
					path="/"
					element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
				/>

				<Route
					path="/board/:id"
					element={isLoggedIn ? <Board /> : <Navigate to="/login" />}
				/>
			</Routes>

			{isLoggedIn && state.isModalOpen && <SettingsModal />}
		</div>
	);
}

export default App;
