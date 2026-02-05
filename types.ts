
export enum UserRole {
  Sales = 'Sales',
  Engineering = 'Engineering',
  Planning = 'Planning'
}

export enum InquiryStatus {
  Engineering = 'Engineering',
  Planning = 'Planning',
  Accepted = 'Accepted',
  Rejected = 'Rejected'
}

export interface InquiryItem {
  code: string;
  desc: string;
  qty: number;
  unit: string;
  landedCost: number;
  unitPrice: number;
  delivery: string;
}

export interface TechnicalDoc {
  name: string;
  data: string; // Base64 data
}

export interface Inquiry {
  id: string;
  custName: string;
  custId: string;
  items: InquiryItem[];
  status: InquiryStatus;
  assignedEng: string;
  docs: TechnicalDoc[];
  ownerEmail: string;
  timestamp: string;
}

export interface User {
  name: string;
  email: string;
  pass: string;
  role: UserRole;
}

export interface MasterItem {
  code: string;
  desc: string;
}
