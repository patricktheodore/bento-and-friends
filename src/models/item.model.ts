import { v4 as uuidv4 } from 'uuid';

export class Main {
    id: string;
    display: string;
    description: string;
    image?: string;
    allergens?: string[];
    isNew?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    isVegetarian?: boolean;
    isPromo?: boolean; // New property
    addOns?: AddOn[];
    price: number;

    constructor(
        display: string = '',
        image: string = '',
        description: string = '',
        allergens: string[] = [],
        isNew: boolean = false,
        isActive: boolean = true,
        isFeatured: boolean = false,
        isVegetarian: boolean = false,
        addOns: AddOn[] = [],
        price: number = 0,
        id?: string,
        isPromo: boolean = false // Default to false
    ) {
        this.id = id || uuidv4();
        this.display = display;
        this.image = image;
        this.description = description;
        this.allergens = allergens;
        this.isNew = isNew;
        this.isActive = isActive;
        this.isFeatured = isFeatured;
        this.isVegetarian = isVegetarian;
        this.isPromo = isPromo;
        this.addOns = addOns;
        this.price = price;
    }
}

export class AddOn {
    id: string;
    display: string;
    price: number;
    isActive?: boolean;

    constructor(display: string = '', price: number = 0, id?: string, isActive: boolean = true
    ) {
        this.id = id || uuidv4();
        this.display = display;
        this.price = price;
        this.isActive = isActive;
    }
}

export class Probiotic {
    id: string;
    display: string;
    code: string;
    isActive: boolean;

    constructor(display: string = '', id?: string, code: string = '', isActive: boolean = true) {
        this.id = id || uuidv4();
        this.display = display;
        this.code = code;
        this.isActive = isActive;
    }
}

export class Fruit {
    id: string;
    display: string;
    code: string;
    isActive: boolean;

    constructor(display: string = '', id?: string, code: string = '', isActive: boolean = true) {
        this.id = id || uuidv4();
        this.display = display;
        this.code = code;
        this.isActive = isActive;
    }
}

export class Drink {
    id: string;
    display: string;
    image?: string;
    price: number;
    isActive?: boolean;

    constructor(display: string = '', image: string = '', price: number = 0, id?: string, isActive: boolean = true) {
        this.id = id || uuidv4();
        this.display = display;
        this.image = image;
        this.price = price;
        this.isActive = isActive;
    }
}

export class Platter {
    id: string;
    display: string;
    description: string;
    image?: string;
    price: number;
    isActive?: boolean;

    constructor(display: string = '', image: string = '', description: string = '',  price: number = 0, id?: string, isActive: boolean = true) {
        this.id = id || uuidv4();
        this.display = display;
        this.description = description;
        this.image = image;
        this.price = price;
        this.isActive = isActive;
    }
}