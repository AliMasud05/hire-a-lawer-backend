// appointment.interface.ts
import { AppointmentStatus, TimeSlotStatus } from "@prisma/client";

export type TCalendar = {
  id?: string;
  date: Date;
  isOffDay?: boolean;
  description?: string;
};

export type TTimeSlot = {
  id?: string;
  calendarId: string;
  startTime: Date;
  endTime: Date;
  status?: TimeSlotStatus;
};

export type TAppointment = {
  id?: string;
  userId: string;
  timeSlotId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  address?: string;
  appointmentDate: Date;
  notes?: string;
  status?: AppointmentStatus;
  consultationFee?: number;
  isPaid?: boolean;
};

export type TCreateTimeSlots = {
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // in minutes, e.g., 60
  breakTime?: number; // break between slots in minutes
};

export type TAvailableSlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: TimeSlotStatus;
};
