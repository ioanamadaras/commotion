/** Returns whether the user is active based on the last pulse check timestamp */
export const isUserActive = (lastPulseTimeStamp: Date | undefined): boolean => {
	if (!lastPulseTimeStamp) return false;
	const now = new Date();
	const timeDiff = now.getTime() - lastPulseTimeStamp.getTime();
	return timeDiff < 70000; // 70 seconds bcs we'll do pulse checks every 60 seconds, so this gives a 10 second buffer for network delays, etc.
};