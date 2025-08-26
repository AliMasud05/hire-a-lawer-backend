import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { TimeSlot } from "@prisma/client";

const getAvailableDates = async () => {
  const holidays = await prisma.holiday.findMany({
    select: { date: true },
  });
  const holidayDates = holidays.map((h) => h.date.toISOString().split("T")[0]);

  const today = new Date();
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    if (!holidayDates.includes(dateString)) {
      dates.push(dateString);
    }
  }
  return dates;
};

const getAvailableTimeSlots = async (date: string) => {
  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  const holiday = await prisma.holiday.findUnique({
    where: { date: selectedDate },
  });
  if (holiday) {
    return [];
  }

  const timeSlots = await prisma.timeSlot.findMany({
    where: {
      date: selectedDate,
      isBooked: false,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  return timeSlots;
};

const createBooking = async (data: {
  date: string;
  timeSlotId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  typeOfCase: string;
  caseDescription: string;
}) => {
  const {
    date,
    timeSlotId,
    firstName,
    lastName,
    phoneNumber,
    email,
    typeOfCase,
    caseDescription,
  } = data;

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
  });
  if (!timeSlot) {
    throw new ApiError(httpStatus.NOT_FOUND, "Time slot not found");
  }
  if (timeSlot.isBooked) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Time slot already booked");
  }

  const holiday = await prisma.holiday.findUnique({
    where: { date: selectedDate },
  });
  if (holiday) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Selected date is a holiday");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        date: selectedDate,
        timeSlotId,
        firstName,
        lastName,
        phoneNumber,
        email,
        typeOfCase,
        caseDescription,
        paymentStatus: "PENDING",
      },
    });

    await tx.timeSlot.update({
      where: { id: timeSlotId },
      data: { isBooked: true },
    });

    return newBooking;
  });

  return booking;
};

const createHoliday = async (data: { date: string; description?: string }) => {
  const { date, description } = data;
  const holidayDate = new Date(date);
  if (isNaN(holidayDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  const existingHoliday = await prisma.holiday.findUnique({
    where: { date: holidayDate },
  });
  if (existingHoliday) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Holiday already exists for this date"
    );
  }

  return await prisma.holiday.create({
    data: {
      date: holidayDate,
      description,
    },
  });
};

const deleteHoliday = async (id: string) => {
  const holiday = await prisma.holiday.findUnique({
    where: { id },
  });
  if (!holiday) {
    throw new ApiError(httpStatus.NOT_FOUND, "Holiday not found");
  }

  await prisma.holiday.delete({
    where: { id },
  });
};

const getHolidays = async () => {
  return await prisma.holiday.findMany({
    select: {
      id: true,
      date: true,
      description: true,
      createdAt: true,
    },
  });
};

const createTimeSlots = async (date: string) => {
  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  const holiday = await prisma.holiday.findUnique({
    where: { date: selectedDate },
  });
  if (holiday) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot create time slots for a holiday"
    );
  }

  const existingSlots = await prisma.timeSlot.findMany({
    where: { date: selectedDate },
  });
  if (existingSlots.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Time slots already exist for this date"
    );
  }

  const timeSlots: TimeSlot[] = [];
  const startHour = 9; // 9 AM
  const slotDuration = 60; // 1 hour slots
  for (let i = 0; i < 6; i++) {
    const startTime = `${startHour + i}:00`;
    const endTime = `${startHour + i + 1}:00`;
    const slot = await prisma.timeSlot.create({
      data: {
        date: selectedDate,
        startTime,
        endTime,
        isBooked: false,
      },
    });
    timeSlots.push(slot);
  }

  return timeSlots;
};

const updateTimeSlot = async (id: string, data: Partial<TimeSlot>) => {
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id },
  });
  if (!timeSlot) {
    throw new ApiError(httpStatus.NOT_FOUND, "Time slot not found");
  }

  if (timeSlot.isBooked) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot update a booked time slot"
    );
  }

  return await prisma.timeSlot.update({
    where: { id },
    data: {
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
};

const deleteTimeSlot = async (id: string) => {
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id },
  });
  if (!timeSlot) {
    throw new ApiError(httpStatus.NOT_FOUND, "Time slot not found");
  }

  if (timeSlot.isBooked) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete a booked time slot"
    );
  }

  await prisma.timeSlot.delete({
    where: { id },
  });
};

export const AppointmentService = {
  getAvailableDates,
  getAvailableTimeSlots,
  createBooking,
  createHoliday,
  deleteHoliday,
  getHolidays,
  createTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
};
