import { emitError } from '@/utils/toast';

const API_URL = 'http://localhost:8081';

export async function api(path: string, options: RequestInit = {}) {
	const token = localStorage.getItem('token');

	try {
		const res = await fetch(`${API_URL}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...options.headers,
			},
		});

		const data = await res.json();

		if (!res.ok) {
			throw new Error(data.error || 'Request failed');
		}

		return data;
	}
	catch (error) {
		if (error instanceof Error) {
			emitError(error.message || 'Network error');
		}

		throw error;
	}
}
