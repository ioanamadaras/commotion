import { useState } from "react";
import { _useContext } from "../Context";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import { getUserColor, getUserInitials } from "@/utils/user";
import { formatDateLocale } from "@/utils/time";

export default function Sidebar() {
	const { state, setState } = _useContext();
	const { teams, isSidebarOpen, isModalOpen, user } = state;
	const [searchQuery, setSearchQuery] = useState("");
	const [boardFilter, setBoardFilter] = useState<"all" | "mine" | "shared">("all");

	if (!user) {
		return null;
	}

	function toggleSidebar(newValue: boolean) {
		setState((prev) => ({ ...prev, isSidebarOpen: newValue }));
	}

	const selectedTeam = teams.find((team) => team._id === user.selectedTeamId) ?? teams[0];
    
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const teamBoards = selectedTeam
		? state.selectedTeamBoards.filter((board) => {
				const matchesTeam = board.teamId === selectedTeam._id;
				const matchesFilter =
					boardFilter === "all"
						? true
						: boardFilter === "mine"
							? board.owner === user._id
							: board.boardData; //todo
				const matchesSearch =
					normalizedQuery.length === 0
						? true
						: board.title.toLowerCase().includes(normalizedQuery);

				return matchesTeam && matchesFilter && matchesSearch;
			})
		: [];

    const shouldShowSidebar = isSidebarOpen || isModalOpen;
	return (
		<div
			className="w-full h-screen bg-red-400 transition-all overflow-hidden"
			style={{ maxWidth: shouldShowSidebar ? "min(50vw, 17rem)" : "4rem" }}
		>
			<aside
				className="h-full w-full p-[var(--padding)] bg-[var(--bg)] border-r flex flex-col gap-3 overflow-hidden"
				onMouseOver={() => toggleSidebar(true)}
				onMouseLeave={() => toggleSidebar(false)}
			>
				<div
					className="pt-1 cursor-pointer w-full flex items-center gap-2"
				>
					<span className="py-1 min-w-[2rem] min-h-[2rem]">
						<Logo />
					</span>
					<span style={{ display: shouldShowSidebar ? "inline" : "none", fontSize: "1.5rem" }}>
						Co<strong>motion</strong>
					</span>
				</div>

				<div className="bg-(--text) text-(--bg) p-1 rounded-md flex gap-2 items-center justify-center h-8 cursor-pointer hover:bg-(--gray)">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
					</span>

					{shouldShowSidebar ? <span>New&nbsp;board</span> : null}
				</div>

				<hr />

				<div className="bg-(--bg) border border-(--text) pl-1 rounded-md flex gap-2 items-center h-8 hover:bg-(--bg-darker) focus-within:bg-(--bg-darker)">
					<span className="shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>

					{shouldShowSidebar ? (
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search boards"
							aria-label="Search boards"
							className="w-full min-w-0 bg-transparent outline-none text-(--text) placeholder:text-(--text) placeholder:opacity-60"
						/>
					) : null}
				</div>

				{shouldShowSidebar ? (
					<>
						<div className="flex flex-wrap gap-1">
							{(["all", "mine", "shared"] as const).map((filter) => (
								<button
									key={filter}
									type="button"
									onClick={() => setBoardFilter(filter)}
									className={`h-8 rounded-full border px-3 text-xs capitalize transition-colors cursor-pointer ${
										boardFilter === filter
											? "bg-(--text) text-(--bg)"
											: "border-(--text) bg-(--bg) hover:bg-(--bg-darker)"
									}`}
								>
									{filter}
								</button>
							))}
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto pr-1">
							<div className="flex flex-col">
								{!selectedTeam ? (
									<div className="p-3 text-sm opacity-70">
										No team selected yet.
									</div>
								) : teamBoards.length === 0 ? (
									<div className="p-3 text-sm opacity-70">
										No boards match these filters.
									</div>
								) : (
									teamBoards.map((board) => (
										<Link 
                                            to={`/board/${board._id}`}
											key={board._id}
											type="button"
											className="group cursor-pointer flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-(--bg-darker)"

										>
											<div className="min-w-0">
												<h5 className="truncate text-sm -mb-[5px]">{board.title}</h5>
												<span className="text-[0.7rem] opacity-60">{formatDateLocale(board.updatedAt)}</span>
											</div>

											<span
												className="shrink-0 rounded-full"
												aria-label={!board.isPersonal ? "Public board" : "Private board"}
												title={!board.isPersonal ? "Public board" : "Private board"}
											>
												{!board.isPersonal ? (
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
														<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
														<path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8" />
														<path strokeLinecap="round" strokeLinejoin="round" d="M3.6 15h16.8" />
														<path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.5 2.7 4 5.7 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.7-4-9s1.5-6.3 4-9z" />
													</svg>
												) : (
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
														<path strokeLinecap="round" strokeLinejoin="round" d="M16 11V8a4 4 0 10-8 0v3" />
														<path strokeLinecap="round" strokeLinejoin="round" d="M7 11h10v9H7z" />
														<path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2" />
													</svg>
												)}
											</span>
										</Link>
									))
								)}
							</div>
						</div>
					</>
				) : null}

				<button
					type="button"
					className="mt-auto flex h-12 w-full items-center gap-3 rounded-md text-left cursor-pointer hover:bg-(--bg-darker) transition-all"
                    style={{ padding: shouldShowSidebar ? "0.4rem" : "0"}}
					aria-label="Open account settings"
                    onClick={(e) => {
                        e.preventDefault();
                        setState(prev => ({...prev, isModalOpen: true }))
                    }}
				>
					<span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--text)"
                        style={{background: getUserColor(user.username)}}
                    >
						<span className="text-sm font-semibold text-white!">{getUserInitials(user.username)}</span>
					</span>

					{shouldShowSidebar ? (
						<span className="min-w-0">
							<span className="block truncate text-sm font-medium">{user.username}</span>
							<span className="block truncate text-[0.7rem] opacity-60">{selectedTeam?.name ?? "No team selected"}</span>
						</span>
					) : null}
				</button>
			</aside>
		</div>
	);
}
