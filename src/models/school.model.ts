export class School {
    id: string;
    logo: string;
    name: string;
    address: string;
    contact: string;
    deliveryDays: string;
    scheduledDates: string[] = [];
    isActive: boolean = true;
    constructor(id: string, name: string, logo: string, address: string, contact: string, deliveryDays: string) {
        this.id = id;
        this.name = name;
        this.logo = logo;
        this.address = address;
        this.contact = contact;
        this.deliveryDays = deliveryDays;
        this.scheduledDates = [];
        this.isActive = true;
    }
}