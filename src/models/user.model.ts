import { Order } from "../models/order.model";

export class User {
    id: string;
    displayName: string;
    email: string;
    schoolId: string;
    isAdmin: boolean;
    orderHistory: Order[];
    constructor(id: string, displayName: string, email: string, schoolId: string, isAdmin: boolean, orderHistory: Order[]) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.schoolId = schoolId;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
    }
}