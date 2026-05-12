import { useEffect, useState } from "react";
import { _useContext } from "../Context";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import { getUserColor, getUserInitials } from "@/utils/user";
import { formatDateLocale } from "@/utils/time";
import { api } from "../api";
import type { AnchorRect, ModalPlacement, ModalState, StateType } from "@/types";

export default function Sidebar() {
	const { state, setState, openModal } = _useContext();
	const { teams, isSidebarOpen, activeModal, user } = state;

	const [searchQuery, setSearchQuery] = useState("");
	const [boardFilter, setBoardFilter] = useState<"all" | "mine" | "shared">("all");
	const [boards, setBoards] = useState<any[]>([]);

	if (!user) return null;

	type AnchoredModal = Extract<Exclude<ModalState, null>, { anchorRect: AnchorRect; placement: ModalPlacement }>;

	function toAnchorRect(rect: DOMRect) {
		return {
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
		};
	}

	function getPlacement(rect: DOMRect, estimatedHeight: number) {
		return rect.bottom + estimatedHeight + 12 <= window.innerHeight ? 'bottom' : 'top';
	}

	function openAnchoredModal(
		type: 'settings' | 'create-board' | 'join-board',
		element: HTMLElement,
		estimatedHeight: number,
	) {
		const rect = element.getBoundingClientRect();
		openModal({
			type,
			anchorRect: toAnchorRect(rect),
			placement: getPlacement(rect, estimatedHeight),
		} as AnchoredModal);
	}

	function toggleSidebar(newValue: boolean) {
		setState((prev: StateType) => ({ ...prev, isSidebarOpen: newValue }));
	}

	async function loadBoards() {
		try {
			const data = await api("/board/mine");
			setBoards(data);
		} catch (err) {
			console.error(err);
		}
	}

	useEffect(() => {
		loadBoards();
	}, []);

	useEffect(() => {
		const handleRefresh = () => {
			loadBoards();
		};

		window.addEventListener('boards:refresh', handleRefresh);
		return () => window.removeEventListener('boards:refresh', handleRefresh);
	}, []);

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filteredBoards = boards.filter((board) => {
		const matchesFilter =
			boardFilter === "all"
				? true
				: boardFilter === "mine"
					? board.owner === user._id
					: !board.isPersonal;

		const matchesSearch =
			normalizedQuery.length === 0
				? true
				: board.title.toLowerCase().includes(normalizedQuery);

		return matchesFilter && matchesSearch;
	});

	const shouldShowSidebar = isSidebarOpen || !!activeModal;

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
				<div className="pt-1 cursor-pointer w-full flex items-center gap-2">
					<span className="py-1 min-w-[2rem] min-h-[2rem]">
						<Logo />
					</span>

					<span style={{ display: shouldShowSidebar ? "inline" : "none", fontSize: "1.5rem" }}>
						Co<strong>motion</strong>
					</span>
				</div>

				<button
					type="button"
					onClick={(event) => openAnchoredModal('create-board', event.currentTarget, 180)}
					className="bg-(--text) text-(--bg) p-1 rounded-md flex gap-2 items-center justify-center h-8 cursor-pointer hover:bg-(--gray)"
				>
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
					</span>

					{shouldShowSidebar ? <span>Create&nbsp;board</span> : null}
				</button>

                <button
					type="button"
					onClick={(event) => openAnchoredModal('join-board', event.currentTarget, 180)}
					className="bg-(--text) text-(--bg) p-1 rounded-md flex gap-2 items-center justify-center h-8 cursor-pointer hover:bg-(--gray)"
				>
					<span>
						<svg strokeWidth={2} stroke="currentColor" className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 4L7 20M17 4L14 20M5 8H20M4 16H19" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                        </svg>
					</span>

					{shouldShowSidebar ? <span>Join&nbsp;board</span> : null}
				</button>

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
								{filteredBoards.length === 0 ? (
									<div className="p-3 text-sm opacity-70">
										No boards match these filters.
									</div>
								) : (
									filteredBoards.map((board) => (
										<div
											key={board._id}
											className="group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left hover:bg-(--bg-darker)"
										>
											<Link to={`/board/${board._id}`} className="min-w-0 flex-1">
												<h5 className="truncate text-sm -mb-[5px]">{board.title}</h5>
												<span className="text-[0.7rem] opacity-60">
													{formatDateLocale(board.updatedAt)}
												</span>
											</Link>

											<div className="flex items-center gap-2">
												<span
													className="shrink-0 rounded-full"
													aria-label={!board.isPersonal ? "Shared board" : "Personal board"}
													title={!board.isPersonal ? "Shared board" : "Personal board"}
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

												{board.permissionLevel !== 'viewer' ? (
													<button
														type="button"
														className="rounded-md border border-[var(--text)]/20 px-2 py-1 text-xs opacity-70 hover:opacity-100"
														onClick={() => openModal({ type: "board", boardId: board._id })}
													>
														Edit
													</button>
												) : null}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</>
				) : null}

				<button
					type="button"
					className="mt-auto flex h-12 w-full items-center gap-3 rounded-md text-left cursor-pointer hover:bg-(--bg-darker) transition-all"
					style={{ padding: shouldShowSidebar ? "0.4rem" : "0" }}
					aria-label="Open account settings"
					onClick={(e) => {
						e.preventDefault();
						openAnchoredModal('settings', e.currentTarget, 220);
					}}
				>
					<span
						className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--text)"
						style={{ background: getUserColor(user.username) }}
					>
						<span className="text-sm font-semibold text-white!">
							{getUserInitials(user.username)}
						</span>
					</span>

					{shouldShowSidebar ? (
						<span className="min-w-0">
							<span className="block truncate text-sm font-medium">
								{user.username}
							</span>
						</span>
					) : null}
				</button>
			</aside>
		</div>
	);
}
