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
        id?: string
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
        this.addOns = addOns;
        this.price = price;
    }
}

export class AddOn {
    id: string;
    display: string;
    price: number;

    constructor(display: string = '', price: number = 0, id?: string
    ) {
        this.id = id || uuidv4();
        this.display = display;
        this.price = price;
    }
}

export class Probiotic {
    id: string;
    display: string;

    constructor(display: string = '', id?: string) {
        this.id = id || uuidv4();
        this.display = display;
    }
}

export class Fruit {
    id: string;
    display: string;

    constructor(display: string = '', id?: string) {
        this.id = id || uuidv4();
        this.display = display;
    }
}

export class Drink {
    id: string;
    display: string;
    image?: string;
    price: number;

    constructor(display: string = '', image: string = '', price: number = 0, id?: string) {
        this.id = id || uuidv4();
        this.display = display;
        this.image = image;
        this.price = price;
    }
}