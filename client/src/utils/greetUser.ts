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