import { Route, Routes, Navigate } from "react-router-dom";
import Board from "./pages/Board";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { _useContext } from "./Context";
import Sidebar from "./components/Sidebar";
import ModalHost from "./components/modals/ModalHost";
import ToastHost from "./components/ToastHost";
import { useEffect, useState } from "react";
import { api } from "./api";

function App() {
	const { state, setState } = _useContext();
	const [authReady, setAuthReady] = useState(false);
	const isLoggedIn = !!state.user?.username;

	useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }

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
	}, []);

	if (!authReady) {
		return <div className="w-screen min-h-screen bg-[var(--bg)]"/>;
	}
	return (
		<div className="w-screen h-full min-h-screen max-h-screen flex">
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

			{isLoggedIn ? <ModalHost /> : null}
			<ToastHost />
		</div>
	);
}

export default App;
