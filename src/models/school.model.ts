import { v4 as uuidv4 } from 'uuid';

export class School {
	id: string;
	name: string;
	address: string;
	isActive: boolean;
	deliveryDays: string[];
	scheduledDates?: string[]; // Assuming dates are stored as strings, adjust if necessary

	constructor(
		name: string = '',
		address: string = '',
		isActive: boolean = true,
		deliveryDays: string[] = [],
		scheduledDates: string[] = []
	) {
		this.id = uuidv4();
		this.name = name;
		this.address = address;
		this.isActive = isActive;
		this.deliveryDays = deliveryDays;
		this.scheduledDates = scheduledDates;
	}
}
