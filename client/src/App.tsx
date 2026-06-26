import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
	const location = useLocation();
	const [authReady, setAuthReady] = useState(false);
	const isGuest = state.user?.userType === 'guest';
	const isLoggedIn = !!state.user?.username && !isGuest;
	const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

	useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }

		const token = localStorage.getItem("token");

		async function fetchUser() {
			try {
				if (!token) {
					setState((prev) => ({ ...prev, user: null }));
					return;
				}

				const data = await api("/user/me", {
					method: "GET",
					silent: true,
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
			{state.user && !isAuthRoute && <Sidebar />}
            
			<Routes>
				<Route path="/register" element={isLoggedIn ? <Navigate to="/" /> : <Register />} />
				<Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login />} />

				<Route
					path="/"
					element={state.user ? <Home /> : <Navigate to="/login" replace />}
				/>

				<Route
					path="/board/:id"
					element={state.user ? <Board /> : <Navigate to="/login" replace />}
				/>
			</Routes>

			{state.user && !isAuthRoute ? <ModalHost /> : null}
			<ToastHost />
		</div>
	);
}

export default App;
