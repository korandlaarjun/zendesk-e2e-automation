import nodemailer from "nodemailer";
import { test, expect } from '@playwright/test';

test.describe('Email Tests', () => {
  test('send email to Zendesk support address', async () => {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
      EMAIL_TO,
    } = process.env;

    test.skip(
      !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO,
      'SMTP env vars not set'
    );

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: "Test ticket from Playwright",
      text: "Hello! This is an automated test email to create a ticket.",
      html: "<p>Hello! This is an automated test email to create a ticket.</p>",
    };

    const info = await transporter.sendMail(mailOptions);
    expect(info.messageId).toBeTruthy();
  });
});