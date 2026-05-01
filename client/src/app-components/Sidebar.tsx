import { _useContext } from "../Context";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import "./layout.css";

export default function Sidebar({
	isAccountModalOpen,
	setIsAccountModalOpen,
	isSidebarCollapsed,
	setIsSidebarCollapsed,
}: {
	isAccountModalOpen: boolean;
	setIsAccountModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	isSidebarCollapsed: boolean;
	setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const { state } = _useContext();
	const { user } = state;

	function getActiveItem({ isActive }: { isActive: boolean }) {
		return isActive ? "navlink active" : "navlink";
	}

	const asideClassName = ["app-sidebar", isSidebarCollapsed ? "is-collapsed" : ""]
		.filter(Boolean)
		.join(" ");

	return (
		<aside className={asideClassName}>
			<div className="sidebar-header">
				<NavLink to="/" className="navlink navlink--brand">
					<Logo />
					<h3 className="mobilehidden sidebar-label">
						Co<strong>motion</strong>
					</h3>
				</NavLink>

				<button
					type="button"
					className="sidebar-desktop-toggle"
					onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
					aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isSidebarCollapsed ? ">" : "<"}
				</button>
			</div>

			<hr />

			<NavLink to="/board" className={getActiveItem}>
				<p className="mobilehidden sidebar-label">Board</p>
			</NavLink>

			<div
				className={`${getActiveItem({ isActive: isAccountModalOpen })} sidebar-account`}
				onClick={() => setIsAccountModalOpen(true)}
			>
				<span className="sidebar-avatar capitalize text-white bg-[var(--secondary)] rounded-sm my-1 w-8 h-8 flex items-center justify-center py-1">
					{user.username ? user.username.slice(0, 1) : "?"}
				</span>
				<p className="mobilehidden sidebar-label px-2">{user.username}</p>
			</div>
		</aside>
	);
}
