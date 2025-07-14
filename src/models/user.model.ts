import { v4 as uuidv4 } from 'uuid';

export class User {
    id: string;
    displayName: string;
    email: string;
    isAdmin: boolean;
    children: Child[];
    orders: OrderHistory[];
    activeCoupons: Coupon[];
    phone?: string;
    hasReviewedTermDetails?: boolean;
    constructor(displayName: string, email: string, isAdmin: boolean, children: Child[], orders: OrderHistory[], phone?: string, hasReviewedTermDetails?: boolean) {
        this.id = uuidv4();
        this.displayName = displayName;
        this.email = email;
        this.isAdmin = isAdmin ?? false;
        this.orders = orders ?? [];
        this.children = children ?? [];
        this.activeCoupons = [];
        this.phone = phone ?? '';
        this.hasReviewedTermDetails = hasReviewedTermDetails ?? false;
    }
}

export interface OrderHistory {
    orderId: string;
    itemCount: number;
    orderedOn: string;
    totalPaid: number;
    mealIds: string[];
}

export class Child {
    id: string;
    name: string;
    schoolId: string;
    allergens: string;
    isTeacher: boolean;
    year: string;
    className: string;

    constructor(name: string = '', year: string = '', isTeacher: boolean = false, schoolId: string = '', className: string = '', allergens: string = '') {
        this.id = uuidv4(); // Generate a unique ID
        this.name = name;
        this.year = year;
        this.schoolId = schoolId;
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