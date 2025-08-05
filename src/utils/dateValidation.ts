export const isValidDateCheck = (date: Date, validDates: string[]): boolean => {
    if (validDates.length === 0) {
        return false;
    }

    const today = new Date();
    
    // Normalize input date to start of day in local timezone
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Create normalized valid dates for comparison
    const normalizedValidDates = validDates.map(validDate => {
        const d = new Date(validDate);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
    
    // Check if input date matches any valid date
    const isValid = normalizedValidDates.some(validDate => 
        inputDate.getTime() === validDate.getTime()
    );
    
    // Check if date is in future OR if it's today and current time is before 7am
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isInFuture = inputDate.getTime() > todayStart.getTime() || 
                      (inputDate.getTime() === todayStart.getTime() && today.getHours() < 7);
    
    return isValid && isInFuture;
}