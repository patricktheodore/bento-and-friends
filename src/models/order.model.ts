import { v4 as uuidv4 } from 'uuid';
import { AddOn, Drink, Fruit, Main, Side } from './item.model';
import { Child } from './user.model';
import { School } from './school.model';

export class Order {
    id: string;
    customOrderNumber?: string;
    userId: string;
    userEmail: string;
    meals: Meal[];
    total: number;
    status: string;
    constructor(userId: string, userEmail:string, meals: Meal[], total: number, status: string, id?: string, customOrderNumber?: string) {
        this.id = id ?? uuidv4();
        this.customOrderNumber = customOrderNumber;
        this.userId = userId;
        this.userEmail = userEmail;
        this.meals = meals;
        this.total = total;
        this.status = status;
    }
}

export class Meal {
    id: string;
    main: Main;
    addOns: AddOn[];
    side?: Side;
    fruit?: Fruit;
    drink?: Drink;
    child: Child;
    school: School;
    total: number;
    deliveryDate: string;

    constructor(main: Main, addOns: AddOn[], side: Side, fruit: Fruit, drink: Drink, child: Child, school: School, total: number, deliveryDate: string) {
        this.id = uuidv4();
        this.main = main;
        this.addOns = addOns;
        this.side = side || null;
        this.fruit = fruit || null;
        this.drink = drink || null;
        this.child = child;
        this.school = school;
        this.total = total;
        this.deliveryDate = deliveryDate;
    }
}

export interface OrderRecord {
    orderId: string;
    userId: string;
    userEmail: string;
    meals: MealRecord[];

    pricing: {
        subtotal: number;
        finalTotal: number;
        appliedCoupon?: { code: string; discountAmount: number };
    };

    payment: {
        stripeSessionId: string;
        paidAt?: string;
        amount: number;
    };

    // Order-level metadata
    itemCount: number;
    totalAmount: number;
    status: "pending" | "paid";
    createdAt: string;
    updatedAt: string;
}

export interface MealRecord {
    mealId: string;
    orderId: string;
    userId: string;

    deliveryDate: string;
    schoolId: string;
    schoolName: string;
    schoolAddress: string;

    childId: string;
    childName: string;
    childIsTeacher: boolean;
    childYear?: string;
    childClass?: string;

    mainId: string;
    mainName: string;
    addOns: Array<{ id: string; display: string }>;
    fruitId: string | null;
    fruitName: string | null;
    sideId: string | null;
    sideName: string | null;

    totalAmount: number;
    orderedOn: string;
    createdAt: string;
    updatedAt: string;
}