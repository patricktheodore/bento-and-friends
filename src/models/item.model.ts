// Utility function for generating unique IDs
const generateId = (): string => {
	return Date.now().toString() + Math.random().toString(36).slice(2, 11);
};

// Base interface for all menu items
interface BaseItem {
	id: string;
	display: string;
	isActive: boolean;
}

// Interface for items with pricing
interface PricedItem extends BaseItem {
	price: number;
}

// Interface for items with images
interface ImagedItem extends BaseItem {
	image?: string;
}

// Interface for items with descriptions
interface DescribedItem extends BaseItem {
	description?: string;
}

// Interface for items with codes (sides, fruits)
interface CodedItem extends BaseItem {
	code?: string;
}

export class Main implements PricedItem, ImagedItem, DescribedItem {
	public id: string;
	public display: string;
	public image?: string;
	public description?: string;
	public allergens?: string[];
	public isNew: boolean;
	public isActive: boolean;
	public isFeatured: boolean;
	public isVegetarian: boolean;
	public addOns: string[]; // Array of AddOn IDs
	public price: number;
	public isPromo: boolean;
    public disableSidesSelection?: boolean;
	public validDates?: string[];

	constructor(
		display?: string,
		image?: string,
		description?: string,
		allergens?: string[],
		isNew?: boolean,
		isActive?: boolean,
		isFeatured?: boolean,
		isVegetarian?: boolean,
		addOns?: string[],
		price?: number,
		id?: string,
		isPromo?: boolean,
        disableSidesSelection?: boolean,
		validDates?: string[]
	) {
		this.id = id || generateId();
		this.display = display || '';
		this.image = image;
		this.description = description;
		this.allergens = allergens || [];
		this.isNew = isNew ?? false;
		this.isActive = isActive ?? true;
		this.isFeatured = isFeatured ?? false;
		this.isVegetarian = isVegetarian ?? false;
		this.addOns = addOns || [];
		this.price = price || 0;
		this.isPromo = isPromo ?? false;
		this.disableSidesSelection = disableSidesSelection ?? false;
		this.validDates = validDates || [];
	}

	// Helper method to check if main has specific addon
	public hasAddOn(addOnId: string): boolean {
		return this.addOns.includes(addOnId);
	}

	// Helper method to add addon
	public addAddOn(addOnId: string): void {
		if (!this.hasAddOn(addOnId)) {
			this.addOns.push(addOnId);
		}
	}

	// Helper method to remove addon
	public removeAddOn(addOnId: string): void {
		this.addOns = this.addOns.filter((id) => id !== addOnId);
	}
}

export class Side implements CodedItem {
	public id: string;
	public display: string;
	public code?: string;
	public isActive: boolean;

	constructor(display?: string, id?: string, code?: string, isActive?: boolean) {
		this.id = id || generateId();
		this.display = display || '';
		this.code = code;
		this.isActive = isActive ?? true;
	}
}

export class AddOn implements PricedItem {
	public id: string;
	public display: string;
	public price: number;
	public isActive: boolean;

	constructor(display?: string, price?: number, id?: string, isActive?: boolean) {
		this.id = id || generateId();
		this.display = display || '';
		this.price = price || 0;
		this.isActive = isActive ?? true;
	}
}

export class Fruit implements CodedItem {
	public id: string;
	public display: string;
	public code?: string;
	public isActive: boolean;

	constructor(display?: string, id?: string, code?: string, isActive?: boolean) {
		this.id = id || generateId();
		this.display = display || '';
		this.code = code;
		this.isActive = isActive ?? true;
	}
}

export class Drink implements PricedItem, ImagedItem {
	public id: string;
	public display: string;
	public image?: string;
	public price: number;
	public isActive: boolean;

	constructor(display?: string, image?: string, price?: number, id?: string, isActive?: boolean) {
		this.id = id || generateId();
		this.display = display || '';
		this.image = image;
		this.price = price || 0;
		this.isActive = isActive ?? true;
	}
}

export class Platter implements PricedItem, ImagedItem, DescribedItem {
	public id: string;
	public display: string;
	public image?: string;
	public description?: string;
	public price: number;
	public isActive: boolean;

	constructor(
		display?: string,
		image?: string,
		description?: string,
		price?: number,
		id?: string,
		isActive?: boolean
	) {
		this.id = id || generateId();
		this.display = display || '';
		this.image = image;
		this.description = description;
		this.price = price || 0;
		this.isActive = isActive ?? true;
	}
}

// Type unions for easier type checking
export type MenuItem = Main | Side | AddOn | Fruit | Drink | Platter;
export type PricedMenuItem = Main | AddOn | Drink | Platter;
export type ImagedMenuItem = Main | Drink | Platter;
export type DescribedMenuItem = Main | Platter;
export type CodedMenuItem = Side | Fruit;

// Type guards for runtime type checking
export const isMain = (item: MenuItem): item is Main => item instanceof Main;
export const isSide = (item: MenuItem): item is Side => item instanceof Side;
export const isAddOn = (item: MenuItem): item is AddOn => item instanceof AddOn;
export const isFruit = (item: MenuItem): item is Fruit => item instanceof Fruit;
export const isDrink = (item: MenuItem): item is Drink => item instanceof Drink;
export const isPlatter = (item: MenuItem): item is Platter => item instanceof Platter;

export const hasPricing = (item: MenuItem): item is PricedMenuItem => {
	return isMain(item) || isAddOn(item) || isDrink(item) || isPlatter(item);
};

export const hasImage = (item: MenuItem): item is ImagedMenuItem => {
	return isMain(item) || isDrink(item) || isPlatter(item);
};

export const hasDescription = (item: MenuItem): item is DescribedMenuItem => {
	return isMain(item) || isPlatter(item);
};

export const hasCode = (item: MenuItem): item is CodedMenuItem => {
	return isSide(item) || isFruit(item);
};