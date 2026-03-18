export interface AttendanceSubmission {
  id: string;
  name: string;
  participating: boolean;
  attendeeCount: number;
  nonAttendeeCount?: number;
  note: string;
  submittedAt: string;
}

export interface WeddingDayAttendee {
  id: string;
  name: string;
  expectedCount: number;
  attended: boolean;
  actualCount: number;
  giftAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}