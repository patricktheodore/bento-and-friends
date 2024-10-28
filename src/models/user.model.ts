import { v4 as uuidv4 } from 'uuid';

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orderHistory: OrderHistorySummary[];
    activeCoupons: Coupon[];
    phone?: string;
    constructor(displayName: string, email: string, isAdmin: boolean, children: Child[], orderHistory: OrderHistorySummary[], phone?: string) {
        this.id = uuidv4();
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orderHistory = orderHistory;
        this.children = children ?? [];
        this.activeCoupons = [];
        this.phone = phone ?? '';
    }
}

export class OrderHistorySummary {
    orderId: string;
    customOrderNumber?: string;
    createdAt: string;
    originalTotal: number;
    total: number;
    items: number;

    constructor(orderId: string, createdAt: string, originalTotal: number, total: number, items: number, customOrderNumber?: string) {
        this.orderId = orderId;
        this.customOrderNumber = customOrderNumber ?? '';
        this.createdAt = createdAt;
        this.total = total;
        this.originalTotal = originalTotal;
        this.items = items;
    }
}

export class Child {
    id: string;
    name: string;
    school: string;
    allergens: string;
    isTeacher: boolean;
    year?: string;
    className?: string;

    constructor(name: string = '', year: string = '', isTeacher: boolean = false, school: string = '', className: string = '', allergens: string = '') {
        this.id = uuidv4(); // Generate a unique ID
        this.name = name;
        this.year = year;
        this.school = school;
        this.className = className;
        this.allergens = allergens;
        this.isTeacher = isTeacher;
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
    useCount: number = 0;
    constructor(code: string, discountType: "percentage" | "fixed", discountAmount: number, expiryDate: string, isSingleUse: boolean = false, isActive: boolean, useCount: number = 0) {
        this.id = uuidv4();
        this.code = code;
        this.discountType = discountType;
        this.discountAmount = discountAmount;
        this.expiryDate = expiryDate;
        this.isSingleUse = isSingleUse;
        this.isActive = isActive;
        this.useCount = useCount;
    }
}