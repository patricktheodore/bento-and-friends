import { v4 as uuidv4 } from 'uuid';
import { AddOn, Drink, Fruit, Main, Probiotic } from './item.model';
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
    probiotic?: Probiotic;
    fruit?: Fruit;
    drink?: Drink;
    child: Child;
    school: School;
    total: number;
    orderDate: string;

    constructor(main: Main, addOns: AddOn[], probiotic: Probiotic, fruit: Fruit, drink: Drink, child: Child, school: School, total: number, orderDate: string) {
        this.id = uuidv4();
        this.main = main;
        this.addOns = addOns;
        this.probiotic = probiotic || null;
        this.fruit = fruit || null;
        this.drink = drink || null;
        this.child = child;
        this.school = school;
        this.total = total;
        this.orderDate = orderDate;
    }
}