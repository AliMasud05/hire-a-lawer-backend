// appointment.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

// Admin: Set off day
const setOffDay = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.setOffDay(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar day updated successfully",
    data: result,
  });
});

// Admin: Create time slots for a date
const createTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.createTimeSlots(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Time slots created successfully",
    data: result,
  });
});

// User: Get available time slots for a date
const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.params;
  const appointmentDate = new Date(date);

  const result = await AppointmentService.getAvailableSlots(appointmentDate);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Available slots retrieved successfully",
    data: result,
  });
});

// User: Create appointment
const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const payload = { ...req.body, userId };

  const result = await AppointmentService.createAppointment(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Appointment created successfully",
    data: result,
  });
});

// User: Get my appointments
const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const options = pick(req.query, paginationFields);

  const result = await AppointmentService.getUserAppointments(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User appointments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Admin: Get all appointments
const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "status",
    "startDate",
    "endDate",
  ]);
  const options = pick(req.query, paginationFields);

  // Convert date strings to Date objects
  if (filters.startDate) {
    filters.startDate = new Date(filters.startDate as string);
  }
  if (filters.endDate) {
    filters.endDate = new Date(filters.endDate as string);
  }

  const result = await AppointmentService.getAllAppointments(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All appointments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Admin: Update appointment status
const updateAppointmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const result = await AppointmentService.updateAppointmentStatus(
      appointmentId,
      status
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Appointment status updated successfully",
      data: result,
    });
  }
);

// User: Cancel appointment
const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const userId = req.user?.id;

  const result = await AppointmentService.cancelAppointment(
    appointmentId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appointment cancelled successfully",
    data: result,
  });
});

export const AppointmentController = {
  setOffDay,
  createTimeSlots,
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
