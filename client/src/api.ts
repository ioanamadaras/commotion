import { emitError } from '@/utils/toast';

const API_URL = 'http://localhost:8081';

export async function api(path: string, options: RequestInit & { silent?: boolean } = {}) {
	const { silent, ...requestOptions } = options;
	const token = localStorage.getItem('token');

	try {
		const res = await fetch(`${API_URL}${path}`, {
			...requestOptions,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...requestOptions.headers,
			},
		});

		const data = await res.json();

		if (!res.ok) {
			throw new Error(data.error || 'Request failed');
		}

		return data;
	}
	catch (error) {
		if (!silent && error instanceof Error) {
			emitError(error.message || 'Network error');
		}

		throw error;
	}
}
