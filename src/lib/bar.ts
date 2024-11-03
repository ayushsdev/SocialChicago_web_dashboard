import { Timestamp } from 'firebase/firestore';

export enum WeekDay {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday"
}

export interface Deal {
  item: string;
  description: string;
  deal: string;
}

export interface HappyHour {
  id: string;
  name: string;
  day: WeekDay[];
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  drinks: string[];
  deals: Deal[];
  deals_summary: string;
}

export interface Bar {
    id: string;
    name: string;
    heroImageURL: string;
    address: {
      neighborhood: string;
      city: string;
      state: string;
    };
    fullAddress: string;
    happyHours: HappyHour[];
    phoneNumber: string;
    website: string;
  }
  