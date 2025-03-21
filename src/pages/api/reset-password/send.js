// File: pages/api/reset-password/send.js
import { connectToDatabase } from "../../../lib/mongodb";
import nodemailer from 'nodemailer';

// Simple OTP generator
function generateOTP(length = 6) {
  // Generate numeric OTP
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// Email sender with detailed logging and error handling
async function sendEmail(to, subject, message) {
  console.log('Starting email send process to:', to);
  
  // Create transporter with detailed logging
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    debug: true, // Enable debug output
    logger: true // Log information into the console
  });
  
  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Extract OTP from message for template
    const otpCode = message.split(': ')[1].split('.')[0];
    
    // Send mail
    const info = await transporter.sendMail({
      from: `"Care Crumbs" <${process.env.EMAIL_USER}>`, // Use the actual email here
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #FE6807; text-align: center;">${subject}</h2>
          <div style="font-size: 18px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-radius: 10px;">
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 5px; font-size: 32px;">${otpCode}</h1>
            <p style="color: #666; font-size: 14px;">This code will expire in 1 hour</p>
          </div>
          <p style="text-align: center; color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log("Email sent successfully! ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.code === 'EAUTH') {
      console.error("Authentication failed - check your email and password");
    }
    if (error.code === 'ESOCKET') {
      console.error("Socket error - check your network connection");
    }
    return { success: false, error: error.message };
  }
}

// SMS sender using a simple implementation
async function sendSMS(phone, message) {
  try {
    // This is a simplified implementation
    // In production, you should use a service like Twilio, MessageBird, etc.
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    // For now, we're just simulating success
    console.log(`SMS would be sent to ${phone} with message: ${message}`);
    
    // Simulate a slight delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, message: "SMS would be sent in production" };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Print environment variables for debugging (REMOVE IN PRODUCTION)
  console.log("EMAIL_USER configured:", process.env.EMAIL_USER ? "Yes" : "No");
  console.log("EMAIL_PASSWORD configured:", process.env.EMAIL_PASSWORD ? "Yes" : "No");
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailOrMobile, method } = req.body;
  console.log(`Processing ${method} reset request for: ${emailOrMobile}`);
  
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    // Find the user by email or mobile
    const user = await usersCollection.findOne({
      $or: [
        { email: emailOrMobile },
        { mobile: emailOrMobile }
      ]
    });
    
    if (!user) {
      console.log(`User not found: ${emailOrMobile}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User found: ${user._id}`);
    
    // Generate a random 6-digit OTP
    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    console.log(`Generated OTP: ${otp} (expires: ${otpExpires})`);
    
    // First, delete any existing OTPs for this user to avoid confusion
    await db.collection("passwordResets").deleteMany({
      userId: user._id
    });
    
    console.log(`Deleted any existing OTPs for user: ${user._id}`);
    
    // Store the OTP in the database
    await db.collection("passwordResets").insertOne({
      userId: user._id,
      emailOrMobile: emailOrMobile,
      otp: otp,
      expires: otpExpires,
      createdAt: new Date()
    });
    
    console.log(`Stored new OTP in database for user: ${user._id}`);
    
    // Send the OTP based on method chosen
    let sendResult;
    
    if (method === 'email') {
      console.log(`Attempting to send email OTP to: ${emailOrMobile}`);
      
      // Send email with custom function
      sendResult = await sendEmail(
        emailOrMobile,
        "Care Crumbs - Password Reset OTP",
        `Your password reset OTP is: ${otp}. This code will expire in 1 hour.`
      );
      
      console.log("Email send result:", sendResult);
      
      if (!sendResult.success) {
        return res.status(500).json({ 
          error: 'Failed to send email OTP',
          details: sendResult.error
        });
      }
      
    } else if (method === 'mobile') {
      console.log(`Attempting to send SMS OTP to: ${emailOrMobile}`);
      
      // Send SMS with custom function
      sendResult = await sendSMS(
        emailOrMobile,
        `Your Care Crumbs password reset OTP is: ${otp}`
      );
      
      console.log("SMS send result:", sendResult);
      
      if (!sendResult.success) {
        return res.status(500).json({ 
          error: 'Failed to send SMS OTP',
          details: sendResult.error
        });
      }
    }
    
    // For development/testing - return the OTP
    // REMOVE THIS IN PRODUCTION!
    const devInfo = process.env.NODE_ENV === 'development' ? { otp } : {};
    
    console.log(`OTP process completed successfully for: ${emailOrMobile}`);
    
    return res.status(200).json({ 
      success: true, 
      message: `OTP sent to ${emailOrMobile}`,
      ...devInfo
    });
    
  } catch (error) {
    console.error('Error in OTP process:', error);
    return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
}