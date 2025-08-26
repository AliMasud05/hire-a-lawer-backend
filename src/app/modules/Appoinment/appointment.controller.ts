import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

const getAvailableDates = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.getAvailableDates();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Available dates retrieved successfully",
    data: result,
  });
});

const getAvailableTimeSlots = catchAsync(
  async (req: Request, res: Response) => {
    const { date } = req.params;
    const result = await AppointmentService.getAvailableTimeSlots(date);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available time slots retrieved successfully",
      data: result,
    });
  }
);

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingData = req.body;
  const result = await AppointmentService.createBooking(bookingData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

const createHoliday = catchAsync(async (req: Request, res: Response) => {
  const holidayData = req.body;
  const result = await AppointmentService.createHoliday(holidayData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Holiday created successfully",
    data: result,
  });
});

const deleteHoliday = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await AppointmentService.deleteHoliday(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holiday deleted successfully",
    data: null,
  });
});

const getHolidays = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.getHolidays();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holidays retrieved successfully",
    data: result,
  });
});

const createTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.body;
  const result = await AppointmentService.createTimeSlots(date);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Time slots created successfully",
    data: result,
  });
});

const updateTimeSlot = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const timeSlotData = req.body;
  const result = await AppointmentService.updateTimeSlot(id, timeSlotData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time slot updated successfully",
    data: result,
  });
});

const deleteTimeSlot = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await AppointmentService.deleteTimeSlot(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time slot deleted successfully",
    data: null,
  });
});

export const AppointmentController = {
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
