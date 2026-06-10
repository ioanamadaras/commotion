import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { exportToSvg } from "@excalidraw/excalidraw";
import type { AppState as ExcalidrawAppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, NonDeleted } from "@excalidraw/excalidraw/element/types";
import { _useContext } from "../Context";
import { api } from "../api";
import { formatDateLocale, getGreeting } from "../utils/time";
import { boardFilterOptions, filterBoards, type BoardFilter } from "@/utils/boards";
import type { BoardType } from "@/types";

export default function Home() {
	const { state } = _useContext();
	const user = state.user;
	const userId = user?._id;
    const isGuest = user?.role === 'guest';

	const [searchQuery, setSearchQuery] = useState("");
	const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
	const [boards, setBoards] = useState<BoardType[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function loadBoards() {
			if (!userId) {
				setBoards([]);
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const data = await api("/board/mine");
				if (!cancelled) {
					setBoards(data);
				}
			}
			catch (error) {
				console.error(error);
				if (!cancelled) {
					setBoards([]);
				}
			}
			finally {
				if (!cancelled) {
					setLoading(false);
				}
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

		window.addEventListener("boards:refresh", handleRefresh);
		return () => window.removeEventListener("boards:refresh", handleRefresh);
	}, [userId]);

	const filteredBoards = filterBoards(boards, userId ?? "", boardFilter, searchQuery);

	return (
		<main className="flex-1 overflow-y-auto bg-[var(--bg)] px-4 py-5 text-[var(--text)] sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full flex-col gap-6">
				<section className="">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-2xl">
							<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
								{getGreeting(user?.username ?? "")}
							</h1>
						</div>
					</div>
				</section>

				<section className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h2 className="text-lg font-semibold">Recent boards</h2>
							<p className="text-sm opacity-65">
								{loading
									? "Loading your boards..."
									: `${filteredBoards.length} board${filteredBoards.length === 1 ? "" : "s"} shown from ${boards.length} available`}
							</p>
						</div>

						<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-3xl">
							<div className="flex h-11 flex-1 items-center gap-2 rounded-[0.5rem] border border-[var(--text)]/10 bg-[var(--bg)] px-3 focus-within:shadow-sm">
								<span className="shrink-0 opacity-60">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</span>

								<input
									type="text"
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Search boards"
									aria-label="Search boards"
									className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-55"
								/>
							</div>

							<div className="flex flex-wrap gap-2">
								{!isGuest && boardFilterOptions.map((filter) => (
									<button
										key={filter.value}
										type="button"
										onClick={() => setBoardFilter(filter.value)}
										className={`h-11 rounded-[0.5rem] border px-4 text-sm font-medium transition-colors ${
											boardFilter === filter.value
												? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
												: "border-[var(--text)]/10 bg-[var(--bg)] hover:bg-[var(--bg-darker)]"
										}`}
									>
										{filter.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{loading ? (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={index}
									className="h-[22rem] animate-pulse rounded-[1.75rem] border border-[var(--text)]/10 bg-[var(--bg)]"
								/>
							))}
						</div>
					) : filteredBoards.length === 0 ? (
						<div className="rounded-[1.75rem] border border-dashed border-[var(--text)]/15 bg-[var(--bg)] px-6 py-12 text-center">
							<p className="text-lg font-medium">No boards match these filters.</p>
							<p className="mt-2 text-sm opacity-65">
								Try a different search term or switch to another scope.
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
							{filteredBoards.map((board) => (
								<BoardCard
									key={board._id}
									board={board}
									theme={state.theme}
								/>
							))}
						</div>
					)}
				</section>
			</div>
		</main>
	);
}

function BoardCard({
	board,
	theme,
}: {
	board: BoardType;
	theme: "light" | "dark";
}) {
	const permissionLabel = (board.permissionLevel === "owner" ? "mine" : board.permissionLevel) ?? "viewer";

	return (
		<Link
			to={`/board/${board._id}`}
			className="group flex h-full flex-col overflow-hidden rounded-[1rem] border border-[var(--text)]/10 bg-[var(--bg)] shadow-sm transition duration-200 hover:shadow-[0_24px_70px_-48px_rgba(0,0,0,0.55)]"
		>
			<div className="relative aspect-[4/3] overflow-hidden border-b border-[var(--text)]/10 bg-[var(--bg-darker)]">
				<BoardPreviewThumbnail board={board} theme={theme} />

				<div className="absolute right-0 top-0 flex items-start justify-between gap-2 p-3">
					<span className="rounded-[0.4rem] bg-(--text) text-(--bg)! px-3 py-1 text-[0.75rem] uppercase">
						{permissionLabel}
					</span>
				</div>

				<div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-(--bg)/90 to-(--bg)/10 group-hover:opacity-0 transition-all" />
			</div>

			<div className="flex flex-1 justify-between items-center gap-3 p-4 py-2">
                <h4 className="truncate m-0! font-semibold">{board.title}</h4>
                <p className="mt-1 text-sm opacity-65">{formatDateLocale(board.updatedAt)}</p>
			</div>
		</Link>
	);
}

function BoardPreviewThumbnail({ board, theme }: { board: BoardType; theme: "light" | "dark" }) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const elements = useMemo(
		() =>
			Array.isArray(board.boardData.elements)
				? (board.boardData.elements as readonly NonDeleted<ExcalidrawElement>[])
				: [],
		[board.boardData.elements],
	);

	useEffect(() => {
		let cancelled = false;
		let objectUrl: string | null = null;

		async function buildPreview() {
			setPreviewUrl(null);

			if (elements.length === 0) {
				return;
			}

			try {
				const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#ffffff";
				const appState = board.boardData.appState as Partial<ExcalidrawAppState>;
				const svg = await exportToSvg({
					elements,
					appState: {
						...appState,
						theme,
						viewBackgroundColor: background,
					},
					files: (board.boardData.files ?? {}) as BinaryFiles,
					exportPadding: 18,
					skipInliningFonts: true,
				});

				if (cancelled) return;

				const svgMarkup = new XMLSerializer().serializeToString(svg);
				objectUrl = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));

				if (!cancelled) {
					setPreviewUrl(objectUrl);
				}
			}
			catch (error) {
				console.error(error);
				if (!cancelled) {
					setPreviewUrl(null);
				}
			}
		}

		void buildPreview();

		return () => {
			cancelled = true;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [board._id, board.updatedAt, board.boardData.version, board.boardData.appState, board.boardData.files, elements, theme]);

	if (!previewUrl) {
		return (
			<div
				className="flex h-full w-full items-center justify-center"
				style={{
					backgroundImage:
						"radial-gradient(circle at 1px 1px, rgba(127,127,127, 0.2) 1px, var(--bg) 0)",
					backgroundSize: "16px 16px",
				}}
			>
			</div>
		);
	}

	return (
		<div className="absolute inset-0">
			<img
				src={previewUrl}
				alt={`${board.title} preview`}
				loading="lazy"
				draggable={false}
				className="h-full w-full object-contain"
			/>
		</div>
	);
}
