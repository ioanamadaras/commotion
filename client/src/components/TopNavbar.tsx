// import { useEffect, useState } from "react";
// import { NavLink } from "react-router-dom";
// import { _useContext } from "../Context";
// import Logo from "./Logo";

// function getSystemTheme() {
// 	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
// }

// function getInitialTheme() {
// 	const current = document.documentElement.getAttribute("data-theme");
// 	if (current === "dark" || current === "light") {
// 		return current;
// 	}
// 	return getSystemTheme();
// }

// function ThemeSwitch() {
// 	const [isDarkMode, setIsDarkMode] = useState(false);

// 	useEffect(() => {
// 		setIsDarkMode(getInitialTheme() === "dark");
// 	}, []);

// 	useEffect(() => {
// 		const theme = isDarkMode ? "dark" : "light";

// 		document.documentElement.setAttribute("data-theme", theme);
// 		document.documentElement.classList.toggle("dark", isDarkMode);
// 		document.querySelector('meta[name="theme-color"]')
// 			?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
// 	}, [isDarkMode]);

// 	return (
// 		<button
// 			type="button"
// 			className="topnav-icon-button"
// 			onClick={() => setIsDarkMode((current) => !current)}
// 			aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
// 		>
// 			{/* {isDarkMode ? <SunIcon className="topnav-icon" /> : <MoonStarIcon className="topnav-icon" />} */}
// 		</button>
// 	);
// }

// export default function TopNavbar() {
// 	const { state, setState } = _useContext();
//     const { isSidebarOpen } = state;

// 	return (
// 		<header className="h-[var(--nav-height)] flex px-[var(--side-padding)] items-center gap-6">
// 			<NavLink to="/" className="flex h-full items-center">
// 				<Logo />
// 				<span className="">
// 					Co<strong>motion</strong>
// 				</span>
// 			</NavLink>

// 			<nav className="">
//                 <NavLink
//                     key={"board"}
//                     to="/board"
//                     className={({ isActive }) => `topnav-link ${isActive ? "active" : ""}`}
//                 >
//                     Board
//                 </NavLink>
// 			</nav>

// 			<div className="">
// 				{/* <div className=""
// 					{team.members.slice(0, 4).map((member) => (
// 						<span
// 							key={member._id}
// 							className=""
// 							title={member.username}
// 							aria-label={member.username}
// 						>
// 							{member.avatarURL ? (
// 								<img src={member.avatarURL} alt={member.username} />
// 							) : (
// 								member.username.slice(0, 1)
// 							)}
// 						</span>
// 					))}
// 					{team.members.length > 4 && (
// 						<span className="">
// 					)}
// 				</div> */}

// 				<ThemeSwitch />

// 				<button
// 					type="button"
// 					className=""
// 					onClick={() => setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))}
// 					aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
// 					aria-expanded={isSidebarOpen}
// 				>
// 					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M4 6h16" />
//                         <path d="M4 12h16" />
//                         <path d="M4 18h16" />
//                     </svg>
// 				</button>
// 			</div>
// 		</header>
// 	);
// }
