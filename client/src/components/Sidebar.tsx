import { useEffect, useState } from "react";
import { _useContext } from "../Context";
import Logo from "./Logo";
import { Link, useLocation } from "react-router-dom";
import { getUserColor, getUserInitials } from "@/utils/user";
import { formatDateLocale } from "@/utils/time";
import { boardFilterOptions, filterBoards, type BoardFilter } from "@/utils/boards";
import { api } from "../api";
import type { AnchorRect, BoardType, ModalPlacement, ModalState, StateType } from "@/types";

export default function Sidebar() {
	const { state, setState, openModal } = _useContext();
	const { isSidebarOpen, activeModal, user } = state;
	const location = useLocation();
	const userId = user?._id ?? "";

	const [searchQuery, setSearchQuery] = useState("");
	const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
	const [boards, setBoards] = useState<BoardType[]>([]);

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

	useEffect(() => {
		let cancelled = false;

		async function loadBoards() {
			if (!userId) {
				setBoards([]);
				return;
			}

			try {
				const data = await api("/board/mine");
				if (!cancelled) {
					setBoards(data);
				}
			}
			catch (error) {
				console.error(error);
			}
		}

		void loadBoards();

		return () => {
			cancelled = true;
		};
	}, [userId]);

	useEffect(() => {
		const handleRefresh = () => {
			if (!userId) return;

			void (async () => {
				try {
					const data = await api("/board/mine");
					setBoards(data);
				}
				catch (error) {
					console.error(error);
				}
			})();
		};

		window.addEventListener('boards:refresh', handleRefresh);
		return () => window.removeEventListener('boards:refresh', handleRefresh);
	}, [userId]);

	const filteredBoards = filterBoards(boards, userId, boardFilter, searchQuery);
	const activeBoardId = location.pathname.match(/^\/board\/([^/]+)$/)?.[1] ?? null;

	const shouldShowSidebar = isSidebarOpen || !!activeModal;

	if (!user) return null;

	return (
		<div
			className="w-full h-screen bg-red-400 transition-all overflow-hidden z-[20]"
			style={{ maxWidth: shouldShowSidebar ? "min(50vw, 17rem)" : "4rem" }}
		>
			<aside
				className="h-full w-full p-[var(--padding)] bg-[var(--bg)] border-r flex flex-col gap-3 overflow-hidden"
				onMouseOver={() => toggleSidebar(true)}
                onMouseOut={() => toggleSidebar(false)}
			>
				<Link to="/" className="pt-1 cursor-pointer w-full flex items-center gap-2">
					<span className="py-1 min-w-[2rem] min-h-[2rem]">
						<Logo />
					</span>

					<span style={{ display: shouldShowSidebar ? "inline" : "none", fontSize: "1.5rem" }}>
						Co<strong>motion</strong>
					</span>
				</Link>

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
							{boardFilterOptions.map((filter) => (
								<button
									key={filter.value}
									type="button"
									onClick={() => setBoardFilter(filter.value)}
									className={`h-8 rounded-full border px-3 text-xs capitalize transition-colors cursor-pointer ${
										boardFilter === filter.value
											? "bg-(--text) text-(--bg)"
											: "border-(--text) bg-(--bg) hover:bg-(--bg-darker)"
									}`}
								>
									{filter.label}
								</button>
							))}
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto pr-1">
							<div className="flex flex-col gap-[5px]">
								{filteredBoards.length === 0 ? (
									<div className="p-3 text-sm opacity-70">
										No boards match these filters.
									</div>
								) : (
									filteredBoards.map((board) => (
										<div
											key={board._id}
											className={`group flex w-full items-center justify-between gap-2 rounded-md px-3 py-1 text-left transition-colors ${
												activeBoardId === board._id
													? "bg-(--bg-darker) ring-1 ring-[var(--text)]/10"
													: "hover:bg-(--bg-darker)"
											}`}
										>
											<Link
												to={`/board/${board._id}`}
												className="min-w-0 flex-1 rounded-md outline-none"
												aria-current={activeBoardId === board._id ? "page" : undefined}
											>
												<h5 className="truncate text-sm -mb-[5px]">{board.title}</h5>
												<span className="text-[0.7rem] opacity-60">
													{formatDateLocale(board.updatedAt)}
												</span>
											</Link>

											<div className="flex items-center">
												<span
													className="shrink-0 px-2 py-1 text-[0.67rem] uppercase opacity-70"
													aria-label={`Your role is ${board.permissionLevel ?? 'viewer'}`}
													title={`Your role is ${board.permissionLevel ?? 'viewer'}`}
												>
													{board.permissionLevel ?? 'viewer'}
												</span>

												{board.permissionLevel !== 'viewer' ? (
													<button
														type="button"
														className="rounded-md pt-1 pb-2 pl-2 opacity-50 hover:opacity-100"
														onClick={() => openModal({ type: "board", boardId: board._id })}
													>
														<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="var(--text)" className="size-[1.15rem]">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
													</button>
												) : (
                                                    <div className="rounded-md p-1 pr-[0.1rem] pl-2 opacity-50">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-[1.15rem]">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    </div>

                                                )}
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
