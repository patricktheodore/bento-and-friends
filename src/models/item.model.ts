import { v4 as uuidv4 } from 'uuid';

export class Main {
    id: string;
    display: string;
    image?: string;
    allergens?: string[];
    isNew?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    isVegetarian?: boolean;
    addOns?: AddOn[];
    constructor(display?: string, image?: string, allergens?: string[], isNew?: boolean, isActive?: boolean, isFeatured?: boolean, isVegetarian?: boolean, addOns?: AddOn[]) {
        this.id = uuidv4();
        this.display = display || '';
        this.image = image || '';
        this.allergens = allergens || [];
        this.isNew = isNew || false;
        this.isActive = isActive || true;
        this.isFeatured = isFeatured || false;
        this.isVegetarian = isVegetarian || false;
        this.addOns = addOns || [];
    }
}

export class AddOn {
    id: string;
    display: string;
    price: number;
    constructor(display: string, price: number) {
        this.id = uuidv4();
        this.display = display || '';
        this.price = price || 0;
    }
}

export class Probiotic {
    id: string;
    image?: string;
    display: string;
    constructor(display: string, image: string) {
        this.id = uuidv4();
        this.image = image || '';
        this.display = display || '';
    }
}

export class Fruit {
    id: string;
    image?: string;
    display: string;
    constructor(display: string, image: string) {
        this.id = uuidv4();
        this.image = image || '';
        this.display = display || '';
    }
}