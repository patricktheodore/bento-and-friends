export class Order {
    id: string;
    userId: string;
    orderDate: string;
    deliveryDate: string;
    items: OrderItem[] = [];
    total: number;
    status: string;
    note: string;
    constructor(id: string, userId: string, orderDate:string, deliveryDate:string, items: OrderItem[], total: number, status: string, note: string) {
        this.id = id;
        this.userId = userId;
        this.orderDate = orderDate;
        this.deliveryDate = deliveryDate;
        this.items = items;
        this.total = total;
        this.status = status;
        this.note = note;
    }
}

export class OrderItem {
    id: string;
    studentName: string;
    mealItems: Item[];
    note: string;
    totalPrice: number;
    constructor(id: string, studentName: string, mealItems: Item[], note: string, totalPrice: number) {
        this.id = id;
        this.studentName = studentName;
        this.mealItems = mealItems;
        this.note = note;
        this.totalPrice = totalPrice;
    }
}

export class Item {
    id: string;
    name: string;
    image?: string;
    type: string;
    allergens?: string[];
    isNew?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    isVegetarian?: boolean;
    price: number;
    addOns?: AddOn[];
    constructor(id: string, name: string, image: string, type: string, allergens: string[], price: number, isNew: boolean, isActive: boolean, isFeatured: boolean, isVegetarian: boolean, addOns: AddOn[]) {
        this.id = id;
        this.name = name;
        this.image = image || '';
        this.type = type;
        this.allergens = allergens || [];
        this.isNew = isNew || false;
        this.isActive = isActive || true;
        this.isFeatured = isFeatured || false;
        this.isVegetarian = isVegetarian || false;
        this.price = price;
        this.addOns = addOns || [];
    }
}

export class AddOn {
    id: string;
    name: string;
    price: number;
    constructor(id: string, name: string, price: number) {
        this.id = id;
        this.name = name;
        this.price = price;
    }
}