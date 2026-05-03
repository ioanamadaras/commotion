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