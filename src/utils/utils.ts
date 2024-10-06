export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });

    const getOrdinalSuffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    };

    return `${dayOfWeek} ${day}${getOrdinalSuffix(day)} ${month}`;
};