// appointment.validation.ts (Optional - using Zod for validation)
import { z } from "zod";

export const setOffDayValidation = z.object({
  body: z.object({
    date: z.string().transform((str) => new Date(str)),
    isOffDay: z.boolean().optional().default(false),
    description: z.string().optional(),
  }),
});

export const createTimeSlotsValidation = z.object({
  body: z.object({
    date: z.string().transform((str) => new Date(str)),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time format should be HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time format should be HH:MM"),
    slotDuration: z.number().min(15).max(480), // 15 minutes to 8 hours
    breakTime: z.number().min(0).max(60).optional().default(0),
  }),
});

export const createAppointmentValidation = z.object({
  body: z.object({
    timeSlotId: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phoneNumber: z.string().min(10, "Valid phone number is required"),
    dateOfBirth: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    address: z.string().optional(),
    appointmentDate: z.string().transform((str) => new Date(str)),
    notes: z.string().optional(),
    consultationFee: z.number().positive().optional(),
  }),
});

export const updateAppointmentStatusValidation = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  }),
});

// Usage in routes (if you want to add validation middleware):
// router.post(
//   "/create",
//   auth(UserRole.USER),
//   validateRequest(createAppointmentValidation),
//   AppointmentController.createAppointment
// );
