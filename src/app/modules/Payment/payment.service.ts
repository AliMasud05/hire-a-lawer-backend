import { PackageTime, PackageType, SubscriptionStatus, TimeSlot } from '@prisma/client';
import httpStatus from "http-status";
import Stripe from "stripe";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import stripe from "../../../helpars/stripe/stripe";
import prisma from "../../../shared/prisma";
import sendResponse from "../../../shared/sendResponse";

// Placeholder for sending notifications (e.g., via email or in-app)
const sendNotification = async (userId: string, message: string) => {
  // Implement your notification logic here (e.g., email via SendGrid, in-app via database)
  console.log(`Notification for user ${userId}: ${message}`);
  // Example: await sendEmail(userId, message);
};

const createStripPayment = async (TimeSlotId: string, payload: any) => {
    

  // Start a transaction block to handle database operations
  const transaction = await prisma.$transaction(async (prisma) => {
    // Fetch the cart for the given user ID and include the related cart items and their products
    const course = await prisma.course.findFirst({
      where: { id: payload.courseId },
    });

    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const coursePrice = (
      course.price -
      (course.discount / 100) * course.price
    ).toFixed(2);

    // Check if the user is already enrolled in the course
    const uniqueEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: payload.courseId,
        },
      },
    });
    if (uniqueEnrollment) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course already enrolled");
    }

    // Create the order data
    const EnrollmentData = {
      userId: payload.userId,
      courseId: payload.courseId,
      Amount: Number(coursePrice),
      discount: course.discount,
    };

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: EnrollmentData,
      // Use 'EnrollmentUncheckedCreateInput' by specifying 'select' or 'include' if needed, or just pass 'EnrollmentData' if your schema allows direct relation IDs.
    });

    // Now create the Stripe PaymentIntent (this is the step that interacts with Stripe)
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(coursePrice) * 100), // Stripe expects the amount in the smallest unit (e.g., cents)
        currency: "eur",
        payment_method: payload.paymentMethodId,
        description: `Payment for course ${course.id}`,
        confirm: true,
        off_session: true,
      });
      // console.log(paymentIntent, "paymentIntent");

      // Only create the payment record in the database after the Stripe payment is successful
      const payment = await prisma.payment.create({
        data: {
          courseId: course.id,
          paymentMethod: "Stripe",
          paymentStatus: paymentStatusEnum.SUCCEEDED,
          paymentAmount: Number(coursePrice),
          transactionId: paymentIntent.id,
          userId: payload.userId,
        },
      });

      // Update the enrollment status to "Paid" after successful payment
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { paymentStatus: paymentStatusEnum.SUCCEEDED },
      });
      //send welcome email to user
    //   await sendEmail(
    //     "Welcome to hk-academy – Your Journey Begins!", // subject
    //     user.email, // to
    //     `
    //     <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    //       <h2>Welcome to ${course.title}</h2>
    //       <p><strong>User:</strong> ${user.name} (${user.email})</p>
    //       <p><strong>Course:</strong> ${course.title}</p>
    //       <p>We're excited to have you on board!</p>
    //     </div>
    //     ` // html
    //   );

      // Send email to admin for new enrollment
    //   await sendAdminEmail(
    //     "New Enrollment Notification", // subject
    //     "contact@hk-academy.com", // to
    //     // "morshedalimasud28@gmail.com", // to
    //     `
    //     <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    //       <h2>New Enrollment</h2>
    //       <p><strong>User:</strong> ${user.name} (${user.email})</p>
    //       <p><strong>Course:</strong> ${course.title}</p>
    //       <p><strong>Amount:</strong> ${coursePrice}</p>
    //     </div>
    //     ` // html
    //   );

      return {
        payment,
        name: user.name,
        email: user.email,
        street: user.street,
        city: user.city,
        postcode: user.postalCode,
        houseNumber: user.houseNumber,
        courseName: course.title,
        discount: course.discount,
      };
    } catch (stripeError: any) {
      // If Stripe fails, rollback everything, including the order and order items
      throw new Error(`Stripe payment failed: ${stripeError.message}`);
    }
  });

  return transaction;
};

export const PaymentService = {
  changeSubscriptionPlan,
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
};
