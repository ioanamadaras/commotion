import { useState } from "react";
import { _useContext } from "../Context";
import Logo from "./Logo";
import { Link } from "react-router-dom";

type SidebarNote = {
	_id: string;
	title: string;
	teamId: string;
	ownerId: string;
	shared: boolean;
	updatedAt: string;
};

const sidebarNotes: SidebarNote[] = [
	{
		_id: "note-1",
		title: "Weekly planning",
		teamId: "team1",
		ownerId: "feanfoianfae1r",
		shared: true,
		updatedAt: "2h ago",
	},
	{
		_id: "note-2",
		title: "Sprint retro",
		teamId: "team1",
		ownerId: "1213i1no31inadaaaccaacac",
		shared: true,
		updatedAt: "Yesterday",
	},
	{
		_id: "note-3",
		title: "Personal sketch",
		teamId: "team1",
		ownerId: "feanfoianfae1r",
		shared: false,
		updatedAt: "Just now",
	},
	{
		_id: "note-4",
		title: "Board outline",
		teamId: "team123",
		ownerId: "1n23oin23",
		shared: true,
		updatedAt: "4d ago",
	},
	{
		_id: "note-5",
		title: "Private idea dump",
		teamId: "team123",
		ownerId: "feanfoianfae1r",
		shared: false,
		updatedAt: "1w ago",
	},
];

export default function Sidebar() {
	const { state, setState } = _useContext();
	const { teams, isSidebarOpen, user } = state;
	const [searchQuery, setSearchQuery] = useState("");
	const [noteFilter, setNoteFilter] = useState<"all" | "mine" | "shared">("all");

	function toggleSidebar(newValue: boolean) {
		setState((prev) => ({ ...prev, isSidebarOpen: newValue }));
	}

	const selectedTeam = teams.find((team) => team._id === user.selectedTeam) ?? teams[0];
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const teamNotes = selectedTeam
		? sidebarNotes.filter((note) => {
				const matchesTeam = note.teamId === selectedTeam._id;
				const matchesFilter =
					noteFilter === "all"
						? true
						: noteFilter === "mine"
							? note.ownerId === user._id
							: note.shared;
				const matchesSearch =
					normalizedQuery.length === 0
						? true
						: note.title.toLowerCase().includes(normalizedQuery);

				return matchesTeam && matchesFilter && matchesSearch;
			})
		: [];

	return (
		<div
			className="w-full h-screen bg-red-400 transition-all overflow-hidden"
			style={{ maxWidth: isSidebarOpen ? "min(50vw, 17rem)" : "4rem" }}
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
					<span style={{ display: isSidebarOpen ? "inline" : "none", fontSize: "1.5rem" }}>
						Co<strong>motion</strong>
					</span>
				</div>

				<div className="bg-(--text) text-(--bg) p-1 rounded-md flex gap-2 items-center justify-center h-8 cursor-pointer hover:bg-(--gray)">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
					</span>

					{isSidebarOpen ? <span>New&nbsp;Note</span> : null}
				</div>

				<hr />

				<div className="bg-(--bg) border border-(--text) pl-1 rounded-md flex gap-2 items-center h-8 hover:bg-(--bg-darker) focus-within:bg-(--bg-darker)">
					<span className="shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>

					{isSidebarOpen ? (
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search notes"
							aria-label="Search notes"
							className="w-full min-w-0 bg-transparent outline-none text-(--text) placeholder:text-(--text) placeholder:opacity-60"
						/>
					) : null}
				</div>

				{isSidebarOpen ? (
					<>
						<div className="flex flex-wrap gap-1">
							{(["all", "mine", "shared"] as const).map((filter) => (
								<button
									key={filter}
									type="button"
									onClick={() => setNoteFilter(filter)}
									className={`h-8 rounded-full border px-3 text-xs capitalize transition-colors cursor-pointer ${
										noteFilter === filter
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
								) : teamNotes.length === 0 ? (
									<div className="p-3 text-sm opacity-70">
										No notes match these filters.
									</div>
								) : (
									teamNotes.map((note) => (
										<Link 
                                            to={`/board/${note._id}`}
											key={note._id}
											type="button"
											className="group cursor-pointer flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-(--bg-darker)"

										>
											<div className="min-w-0">
												<h5 className="truncate text-sm -mb-[5px]">{note.title}</h5>
												<span className="text-[0.7rem] opacity-60">{note.updatedAt}</span>
											</div>

											<span
												className="shrink-0 rounded-full"
												aria-label={note.shared ? "Public note" : "Private note"}
												title={note.shared ? "Public note" : "Private note"}
											>
												{note.shared ? (
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
					className="mt-auto flex h-10 w-full items-center gap-3 rounded-md text-left cursor-pointer"
					aria-label="Open account settings"
				>
					<span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--text)">
						{user.avatarURL ? (
							<img src={user.avatarURL} alt={user.username} className="h-full w-full object-cover" />
						) : (
							<span className="text-sm font-semibold">{user.username.slice(0, 1)}</span>
						)}
					</span>

					{isSidebarOpen ? (
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
