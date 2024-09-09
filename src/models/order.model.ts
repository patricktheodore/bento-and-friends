import { v4 as uuidv4 } from 'uuid';
import { AddOn, Fruit, Main, Probiotic } from './item.model';

export class Order {
    id: string;
    userId: string;
    orderDate: string;
    deliveryDate: string;
    meals: Meal[];
    total: number;
    status: string;
    note: string;
    constructor(userId: string, orderDate:string, deliveryDate:string, meals: Meal[], total: number, status: string, note: string) {
        this.id = uuidv4();
        this.userId = userId;
        this.orderDate = orderDate;
        this.deliveryDate = deliveryDate;
        this.meals = meals;
        this.total = total;
        this.status = status;
        this.note = note;
    }
}

export class Meal {
    id: string;
    studentName: string;
    main: Main;
    addOns: AddOn[];
    probiotic: Probiotic;
    fruit: Fruit;
    allergens: string[];
    note: string;
    price: number;
    constructor(studentName: string, main: Main, addOns: AddOn[], probiotic: Probiotic, fruit: Fruit, allergens: string[], note: string, price: number) {
        this.id = uuidv4();
        this.studentName = studentName;
        this.main = main;
        this.addOns = addOns;
        this.probiotic = probiotic;
        this.fruit = fruit;
        this.allergens = allergens;
        this.note = note;
        this.price = price;
    }
}