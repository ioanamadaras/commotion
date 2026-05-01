import { Route, Routes } from "react-router-dom";
import Board from "./pages/Board";
import Sidebar from "./app-components/Sidebar";
import Home from "./pages/Home";
import { useState } from "react";
import SettingsModal from "./app-components/SettingsModal";

function App() {
	const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	return (
		<div>
			<Sidebar
				isAccountModalOpen={isAccountModalOpen}
				setIsAccountModalOpen={setIsAccountModalOpen}
				isSidebarCollapsed={isSidebarCollapsed}
				setIsSidebarCollapsed={setIsSidebarCollapsed}
			/>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/board" element={<Board />} />
			</Routes>

			{/* Account modal */}
			{isAccountModalOpen && <SettingsModal setIsAccountModalOpen={setIsAccountModalOpen} />}
		</div>
	);
}

export default App;
