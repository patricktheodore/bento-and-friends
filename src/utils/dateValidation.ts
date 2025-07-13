export const isValidDateCheck = (date: Date, validDates: string[]): boolean => {
    if (validDates.length === 0) {
        return false; // No valid dates defined for the school
    }

    const today = new Date();
    const inputDate = new Date(date);
    const inputDateString = inputDate.toISOString(); // Format as YYYY-MM-DD
    const isValid = validDates.some(validDate => {
        const validDateString = new Date(validDate).toISOString(); // Format as YYYY-MM-DD
        return validDateString === inputDateString;
    });
    const isInFuture = inputDate >= today || (inputDate.toDateString() === today.toDateString() && inputDate.getHours() < 7);
    return isValid && isInFuture;
}