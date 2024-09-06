import { Order } from "../models/order.model";

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orderHistory: Order[];
    constructor(id: string, displayName: string, email: string, isAdmin: boolean, children: Child[], orderHistory: Order[]) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
        this.children = [];
    }
}

export class Child {
    name: string;
    age: string;
    schoolId: string;
    classId: string;

    constructor(name: string, age: string, schoolId: string, classId: string) {
        this.name = name;
        this.age = age;
        this.schoolId = schoolId;
        this.classId = classId;
    }
}