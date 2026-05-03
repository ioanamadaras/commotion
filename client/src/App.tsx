import { Route, Routes } from "react-router-dom";
import SettingsModal from "./components/SettingsModal";
import Board from "./pages/Board";
import Home from "./pages/Home";
import { _useContext } from "./Context";
import Sidebar from "./components/Sidebar";

function App() {
    const { state } = _useContext();
	return (
		<div className="w-screen h-full min-h-screen flex">
            <Sidebar />

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/board/:id" element={<Board />} />
			</Routes>

			{/* Account modal */}
			{state.isModalOpen && <SettingsModal />}
		</div>
	);
}

export default App;
