import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";

const kafka = new Kafka({
  clientId: "email-service",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "email-service" });

// Email configuration - Replace with your Gmail credentials
const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || "shindearyan179@gmail.com", // Replace with your Gmail
    pass: process.env.GMAIL_APP_PASSWORD || "ddcv uxpe upip laoy" // Replace with your app password
  }
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

const sendWelcomeEmail = async (businessData) => {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: businessData.email,
      subject: `Welcome to Our Platform - ${businessData.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          <p>Dear ${businessData.businessName},</p>
          
          <p>Thank you for registering your business with us. We're excited to have you on board!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Registration Details:</h3>
            <p><strong>Business ID:</strong> ${businessData.businessId}</p>
            <p><strong>Business Name:</strong> ${businessData.businessName}</p>
            <p><strong>Business Type:</strong> ${businessData.businessType}</p>
            <p><strong>Registration Date:</strong> ${new Date(businessData.registrationDate).toLocaleDateString()}</p>
         
          </div>
          
          <p>Our team will review your registration and get back to you within 2-3 business days.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Our Platform Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

const run = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({
      topic: "business-registered",
      fromBeginning: true,
    });

    console.log("Email service consumer started, listening for business-registered events...");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value.toString();
          const businessData = JSON.parse(value);

          console.log(`Processing business registration: ${businessData.businessId}`);

          // Send welcome email
          const emailResult = await sendWelcomeEmail(businessData);

          if (emailResult.success) {
            // Send success event to send-email topic
            await producer.send({
              topic: "send-email",
              messages: [
                { 
                  value: JSON.stringify({ 
                    businessId: businessData.businessId,
                    email: businessData.email,
                    status: "sent",
                    messageId: emailResult.messageId,
                    timestamp: new Date().toISOString()
                  }),
                  key: businessData.businessId
                },
              ],
            });
            console.log(`Email sent successfully for business: ${businessData.businessId}`);
          } else {
            // Send failure event
            await producer.send({
              topic: "send-email",
              messages: [
                { 
                  value: JSON.stringify({ 
                    businessId: businessData.businessId,
                    email: businessData.email,
                    status: "failed",
                    error: emailResult.error,
                    timestamp: new Date().toISOString()
                  }),
                  key: businessData.businessId
                },
              ],
            });
            console.log(`Email failed for business: ${businessData.businessId} - ${emailResult.error}`);
          }
        } catch (error) {
          console.error("Error processing business registration event:", error);
        }
      },
    });
  } catch (err) {
    console.error("Error in email service:", err);
  }
};

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
    console.log("Please update your Gmail credentials in the EMAIL_CONFIG object");
  } else {
    console.log("Email server is ready to send emails");
  }
});

run();