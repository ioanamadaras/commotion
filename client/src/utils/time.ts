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

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function formatTime(date: Date): string {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSameDay(left: Date, right: Date): boolean {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function getYesterday(date: Date): Date {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
}

function formatLongDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month}${year !== new Date().getFullYear() ? `, ${year}` : ''}`;
}

/**
 * Returns a clean localized date string that feels human:
 * - Today, 14:32
 * - Yesterday, 14:32
 * - Mon, 14:32
 * - 16 May, 14:32
 * - 16 May 2024, 14:32
 */
export function formatDateLocale(date: Date | string | number): string {
    const inputDate = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(inputDate.getTime())) return '';

    const now = new Date();
    const yesterday = getYesterday(now);

    if (isSameDay(inputDate, now)) {
        return `Today, ${formatTime(inputDate)}`;
    }
    if (isSameDay(inputDate, yesterday)) {
        return `Yesterday, ${formatTime(inputDate)}`;
    }

    const diffInDays = Math.floor((now.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
        const weekday = inputDate.toLocaleDateString('default', { weekday: 'short' });
        return `${weekday}, ${formatTime(inputDate)}`;
    }

    return `${formatLongDate(inputDate)}, ${formatTime(inputDate)}`;
}
