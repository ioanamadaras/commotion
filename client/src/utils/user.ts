/**
 * Returns the initials of a username. If the username has multiple words, it takes the first letter of the first two words.
 * 
 * Examples:
 * "" -> "?"
 * "Andrew" -> "A"
 * "John Doe" -> "JD"
 * "+2" -> "+2" 
 * "Mary Jane Watson" -> "MJ"
 */
export const getUserInitials = (username: string = ""): string => {
    if (username[0] === '+') {
        return username.slice(0, 3);
    }

    const nameParts = username.trim().split(' ');
    if (nameParts.length === 0) return '?';

    const firstInitial = nameParts[0][0] || '';
    const secondInitial = nameParts.length > 1 ? nameParts[1][0] : '';

    return (firstInitial + secondInitial).toUpperCase() || '?';
};

/** Constructs a color for a user's avatar, using their USERNAME as a seed */
export function getUserColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 45%)`;
}