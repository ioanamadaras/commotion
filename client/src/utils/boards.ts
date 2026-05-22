import type { BoardType } from "@/types";

export type BoardFilter = "all" | "mine" | "other";

export const boardFilterOptions: Array<{ value: BoardFilter; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "mine", label: "Mine" },
	{ value: "other", label: "Other" },
];

export function matchesBoardFilter(board: BoardType, userId: string, filter: BoardFilter) {
	if (filter === "all") return true;

	const isMine = board.owner === userId;
	return filter === "mine" ? isMine : !isMine;
}

export function matchesBoardSearch(board: BoardType, query: string) {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) return true;

	return board.title.toLowerCase().includes(normalizedQuery);
}

export function filterBoards(boards: BoardType[], userId: string, filter: BoardFilter, query: string) {
	return boards.filter((board) => matchesBoardFilter(board, userId, filter) && matchesBoardSearch(board, query));
}
