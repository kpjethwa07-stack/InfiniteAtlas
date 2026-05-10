import { Timestamp } from 'firebase/firestore';

export enum TripStatus {
  PLANNING = 'planning',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ActivityType {
  SIGHTSEEING = 'sightseeing',
  FOOD = 'food',
  TRANSPORT = 'transport',
  STAY = 'stay',
  ACTIVITY = 'activity',
  OTHER = 'other'
}

export enum ExpenseCategory {
  FLIGHTS = 'flights',
  ACCOMMODATION = 'accommodation',
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  OTHER = 'other'
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  language?: string;
  isAdmin?: boolean;
  createdAt: Timestamp;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  coverURL?: string;
  ownerId: string;
  status: TripStatus;
  budgetLimit?: number;
  categoryBudgets?: Record<string, number>;
  isPublic?: boolean;
  latitude?: number;
  longitude?: number;
  smartAssistant?: {
    airlines: string[];
    taxiApps: string[];
    localTips: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Stop {
  id: string;
  cityName: string;
  locationType?: string;
  arrivalDate: Timestamp;
  departureDate: Timestamp;
  order: number;
  note?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  cost: number;
  type: ActivityType;
  startTime?: Timestamp;
  duration?: string;
  status?: string;
}

export interface PackingItem {
  id: string;
  item: string;
  category: string;
  isPacked: boolean;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  dayIndex?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  note?: string;
}
