import { Order } from "../models/order.model";
import { v4 as uuidv4 } from 'uuid';

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orderHistory: Order[];
    constructor(displayName: string, email: string, isAdmin: boolean, children: Child[], orderHistory: Order[]) {
        this.id = uuidv4();
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
        this.children = children ?? [];
    }
}

export class Child {
    id: string;
    name: string;
    year: string;
    school: string;
    className: string;

    constructor(name: string = '', year: string = '', school: string = '', className: string = '') {
        this.id = uuidv4(); // Generate a unique ID
        this.name = name;
        this.year = year;
        this.school = school;
        this.className = className;
    }
}