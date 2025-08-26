import express from "express";
import { AppointmentController } from "./appointment.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Public routes
router.get("/available-dates", AppointmentController.getAvailableDates);
router.get(
  "/available-time-slots/:date",
  AppointmentController.getAvailableTimeSlots
);
router.post("/book", AppointmentController.createBooking);

// Admin routes
router.post(
  "/holiday",
  // auth(UserRole.ADMIN),
  AppointmentController.createHoliday
);
router.delete(
  "/holiday/:id",
  // auth(UserRole.ADMIN),
  AppointmentController.deleteHoliday
);
router.get(
  "/holidays",
  // auth(UserRole.ADMIN),
  AppointmentController.getHolidays
);
router.post(
  "/time-slots",
  // auth(UserRole.ADMIN),
  AppointmentController.createTimeSlots
);
router.patch(
  "/time-slot/:id",
  // auth(UserRole.ADMIN),
  AppointmentController.updateTimeSlot
);
router.delete(
  "/time-slot/:id",
  // auth(UserRole.ADMIN),
  AppointmentController.deleteTimeSlot
);

export const AppointmentRoutes = router;
