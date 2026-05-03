/** Returns whether the user is active based on the last pulse check timestamp */
export const isUserActive = (lastPulseTimeStamp: Date | undefined): boolean => {
	if (!lastPulseTimeStamp) return false;
	const now = new Date();
	const timeDiff = now.getTime() - lastPulseTimeStamp.getTime();
	return timeDiff < 70000; // 70 seconds bcs we'll do pulse checks every 60 seconds, so this gives a 10 second buffer for network delays, etc.
};

/** Greet the user depending on username availability, time of day, etc: */
export function getGreeting(username: string | null): string {
    const hour = new Date().getHours();
    if (hour < 5) {
        return `${hour % 2 === 0 ? "Hello" : "Hi"}${username ? `, ${username}` : ''}!` 
    }
    if (hour < 12) {
        return `Good morning${username ? `, ${username}` : ''}!`;
    } else if (hour < 18) {
        return `Good afternoon${username ? `, ${username}` : ''}!`;
    } else {
        return `Good evening${username ? `, ${username}` : ''}!`;
    }
}

/** 
 * Returns "47m ago", "4h ago", "now", "yesterday", "2 days ago", "16th May", "2 years ago" ...etc
 */ 
export function getLastActiveTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diff / 1000);
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const diffInYears = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

    if (diffInSeconds < 60) {
        return "now";
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
        return "yesterday";
    } else if (diffInDays < 30) {
        return `${diffInDays} days ago`;
    } else if (now.getFullYear() === date.getFullYear()) {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return `${day} ${month}`;
    } else if (diffInMonths < 12) {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return `${day} ${month}, ${date.getFullYear()}`;
    } else {
        return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
    }
}