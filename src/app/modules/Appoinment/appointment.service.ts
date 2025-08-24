// appointment.service.ts
import { AppointmentStatus, TimeSlotStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { paginationHelpers } from "../../../utils/paginationHelper";
import {
  TAppointment,
  TCalendar,
  TCreateTimeSlots,
  TTimeSlot,
} from "./appointment.interface";

// Calendar Management (Admin)
const setOffDay = async (payload: TCalendar) => {
  const existingCalendar = await prisma.calendar.findUnique({
    where: { date: payload.date },
  });

  if (existingCalendar) {
    return await prisma.calendar.update({
      where: { date: payload.date },
      data: {
        isOffDay: payload.isOffDay,
        description: payload.description,
      },
    });
  }

  return await prisma.calendar.create({
    data: {
      date: payload.date,
      isOffDay: payload.isOffDay || false,
      description: payload.description,
    },
  });
};

const createTimeSlots = async (payload: TCreateTimeSlots) => {
  const { date, startTime, endTime, slotDuration, breakTime = 0 } = payload;

  // Check if date is off day
  const calendar = await prisma.calendar.findUnique({
    where: { date },
  });

  if (calendar?.isOffDay) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot create slots for off day"
    );
  }

  // Create or get calendar entry
  const calendarEntry = await prisma.calendar.upsert({
    where: { date },
    create: { date, isOffDay: false },
    update: {},
  });

  // Parse time slots
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  const slots = [];
  let currentTime = new Date(startDateTime);

  while (currentTime < endDateTime) {
    const slotEnd = new Date(currentTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    if (slotEnd <= endDateTime) {
      slots.push({
        calendarId: calendarEntry.id,
        startTime: new Date(currentTime),
        endTime: new Date(slotEnd),
        status: TimeSlotStatus.AVAILABLE,
      });
    }

    currentTime.setMinutes(currentTime.getMinutes() + slotDuration + breakTime);
  }

  // Delete existing slots for the date and create new ones
  await prisma.timeSlot.deleteMany({
    where: { calendarId: calendarEntry.id },
  });

  await prisma.timeSlot.createMany({
    data: slots,
  });

  return {
    message: `${slots.length} time slots created for ${date.toDateString()}`,
    slots: slots.length,
  };
};

// Get available time slots for a specific date (User)
const getAvailableSlots = async (date: Date) => {
  const calendar = await prisma.calendar.findUnique({
    where: { date },
    include: {
      timeSlots: {
        where: {
          status: TimeSlotStatus.AVAILABLE,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  if (!calendar || calendar.isOffDay) {
    return {
      date,
      isOffDay: true,
      availableSlots: [],
    };
  }

  return {
    date,
    isOffDay: false,
    availableSlots: calendar.timeSlots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
    })),
  };
};

// Create appointment (User)
const createAppointment = async (payload: TAppointment) => {
  // Check if time slot is available
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: payload.timeSlotId },
    include: { calendar: true },
  });

  if (!timeSlot) {
    throw new ApiError(httpStatus.NOT_FOUND, "Time slot not found");
  }

  if (timeSlot.status !== TimeSlotStatus.AVAILABLE) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Time slot is not available");
  }

  if (timeSlot.calendar.isOffDay) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot book appointment on off day"
    );
  }

  // Create appointment and update time slot status in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update time slot status
    await tx.timeSlot.update({
      where: { id: payload.timeSlotId },
      data: { status: TimeSlotStatus.BOOKED },
    });

    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        userId: payload.userId,
        timeSlotId: payload.timeSlotId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        appointmentDate: payload.appointmentDate,
        notes: payload.notes,
        status: AppointmentStatus.PENDING,
        consultationFee: payload.consultationFee,
        isPaid: payload.isPaid || false,
      },
      include: {
        timeSlot: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return appointment;
  });

  return result;
};

// Get user appointments
const getUserAppointments = async (
  userId: string,
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const appointments = await prisma.appointment.findMany({
    where: { userId },
    include: {
      timeSlot: {
        include: {
          calendar: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { appointmentDate: "desc" },
  });

  const total = await prisma.appointment.count({
    where: { userId },
  });

  return {
    meta: { page, limit, total },
    data: appointments,
  };
};

// Get all appointments (Admin)
const getAllAppointments = async (
  filters: {
    searchTerm?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
  },
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  const { searchTerm, status, startDate, endDate } = filters;

  const andConditions: any[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    andConditions.push({ appointmentDate: dateFilter });
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const appointments = await prisma.appointment.findMany({
    where: whereConditions,
    include: {
      timeSlot: {
        include: {
          calendar: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { appointmentDate: "desc" },
  });

  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: { page, limit, total },
    data: appointments,
  };
};

// Update appointment status (Admin)
const updateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { timeSlot: true },
  });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update appointment status
    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        timeSlot: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // If appointment is cancelled, make time slot available again
    if (status === AppointmentStatus.CANCELLED) {
      await tx.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { status: TimeSlotStatus.AVAILABLE },
      });
    }

    return updatedAppointment;
  });

  return result;
};

// Cancel appointment (User)
const cancelAppointment = async (appointmentId: string, userId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
  });

  if (!appointment) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Appointment not found or you don't have permission"
    );
  }

  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot cancel completed appointment"
    );
  }

  return await updateAppointmentStatus(
    appointmentId,
    AppointmentStatus.CANCELLED
  );
};

export const AppointmentService = {
  setOffDay,
  createTimeSlots,
  getAvailableSlots,
  createAppointment,
  getUserAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
