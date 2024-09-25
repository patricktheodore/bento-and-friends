import { Order } from "../models/order.model";
import { v4 as uuidv4 } from 'uuid';

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orderHistory: OrderHistorySummary[];
    constructor(displayName: string, email: string, isAdmin: boolean, children: Child[], orderHistory: OrderHistorySummary[]) {
        this.id = uuidv4();
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
        this.children = children ?? [];
    }
}

export class OrderHistorySummary {
    orderId: string;
    createdAt: string;
    total: number;
    items: number;

    constructor(orderId: string, createdAt: string, total: number, items: number) {
        this.orderId = orderId;
        this.createdAt = createdAt;
        this.total = total;
        this.items = items;
    }
}

export class Child {
    id: string;
    name: string;
    year: string;
    school: string;
    className: string;
    allergens: string;

    constructor(name: string = '', year: string = '', school: string = '', className: string = '', allergens: string = '') {
        this.id = uuidv4(); // Generate a unique ID
        this.name = name;
        this.year = year;
        this.school = school;
        this.className = className;
        this.allergens = allergens;
    }
}