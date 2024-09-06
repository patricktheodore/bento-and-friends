export interface School {
    id: string;
    name: string;
    address: string;
    classes: Class[];
    deliveryDays: string[];
    isActive: boolean;
    scheduledDates: string[]; // Assuming dates are stored as strings, adjust if necessary
  }
  
  export interface Class {
    id: string;
    name: string;
    // Add other class properties as needed
  }