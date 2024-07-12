import { Timestamp } from 'firebase/firestore';

export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    isAdmin: boolean;
    createdAt: Timestamp;
    lastLoginAt: Timestamp;
    schoolId: string | null;
}

export interface CreateUserData {
  displayName: string | null;
  email: string | null;
  isAdmin: boolean;
}