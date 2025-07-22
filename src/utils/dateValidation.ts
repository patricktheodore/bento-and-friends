export const isValidDateCheck = (date: Date, validDates: string[]): boolean => {
    if (validDates.length === 0) {
        return false;
    }

    const today = new Date();
    const inputDate = new Date(date);
    
    // Compare just the date parts (YYYY-MM-DD) in local timezone
    const inputDateString = inputDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
    
    const isValid = validDates.some(validDate => {
        const validDateObj = new Date(validDate);
        const validDateString = validDateObj.toLocaleDateString('en-CA');
        return validDateString === inputDateString;
    });
    
    // Check if date is in future OR if it's today and current time is before 7am
    const isInFuture = inputDate.toDateString() > today.toDateString() || 
                      (inputDate.toDateString() === today.toDateString() && today.getHours() < 7);
    
    return isValid && isInFuture;
}