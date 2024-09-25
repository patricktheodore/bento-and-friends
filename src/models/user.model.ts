import { v4 as uuidv4 } from 'uuid';

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orderHistory: OrderHistorySummary[];
    activeCoupons: Coupon[];
    constructor(displayName: string, email: string, isAdmin: boolean, children: Child[], orderHistory: OrderHistorySummary[]) {
        this.id = uuidv4();
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
        this.children = children ?? [];
        this.activeCoupons = [];
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

export class Coupon {
    id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountAmount: number;
    expiryDate: string;
    isSingleUse: boolean = false;
    isActive: boolean = true;
    constructor(code: string, discountType: "percentage" | "fixed", discountAmount: number, expiryDate: string, isSingleUse: boolean = false, isActive: boolean = true) {
        this.id = uuidv4();
        this.code = code;
        this.discountType = discountType;
        this.discountAmount = discountAmount;
        this.expiryDate = expiryDate;
        this.isSingleUse = isSingleUse;
        this.isActive = isActive;
    }
}