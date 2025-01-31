import {Timestamp} from "firebase-admin/firestore";

interface Child {
  id: string;
  name: string;
  allergens?: string;
  className: string;
  year: string;
}

interface School {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  display: string;
}

export interface InputMeal {
  id: string;
  orderDate: string;
  child: Child;
  school: School;
  main: MenuItem;
  probiotic?: MenuItem;
  fruit?: string;
  drink?: string;
  addOns?: MenuItem[];
}

export interface InputOrder {
  meals: InputMeal[];
  orderDate: string;
  userEmail: string;
  total: number;
}

export interface MealDocument {
  id: string;
  orderId: string;
  customOrderNumber: string;
  deliveryDate: Timestamp;
  status: string;
  userId: string;
  userEmail: string;
  child: { id: string; name: string, className: string, year: string };
  school: { id: string; name: string };
  allergens?: string;
  main: { id: string; display: string };
  probiotic?: { id: string; display: string };
  fruit?: { id: string; display: string };
  drink?: { id: string; display: string };
  addOns?: { id: string; display: string }[];
}
