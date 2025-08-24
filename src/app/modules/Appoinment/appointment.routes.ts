// appointment.routes.ts
import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { AppointmentController } from "./appointment.controller";

const router = express.Router();

// Public routes
router.get("/available-slots/:date", AppointmentController.getAvailableSlots);

// User authenticated routes
router.post(
  "/create",
  auth(UserRole.USER),
  AppointmentController.createAppointment
);

router.get(
  "/my-appointments",
  auth(UserRole.USER),
  AppointmentController.getMyAppointments
);

router.patch(
  "/cancel/:appointmentId",
  auth(UserRole.USER),
  AppointmentController.cancelAppointment
);

// Admin only routes
router.post(
  "/set-off-day",
  auth(UserRole.ADMIN),
  AppointmentController.setOffDay
);

router.post(
  "/create-time-slots",
  auth(UserRole.ADMIN),
  AppointmentController.createTimeSlots
);

router.get(
  "/all",
  auth(UserRole.ADMIN),
  AppointmentController.getAllAppointments
);

router.patch(
  "/update-status/:appointmentId",
  auth(UserRole.ADMIN),
  AppointmentController.updateAppointmentStatus
);

export const AppointmentRoutes = router;
