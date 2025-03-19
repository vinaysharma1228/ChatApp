import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

dotenv.config();

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an email using a Handlebars template
 * @param {string} to - Receiver's email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Handlebars template file name (without extension)
 * @param {object} data - Dynamic data to inject into the template
 */
export async function sendEmail(to, subject, templateName, data) {
    try {
        // Load Handlebars template
        const templatePath = path.join(process.cwd(), 'src/templates', `${templateName}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        // Replace placeholders with actual data
        const htmlContent = template(data);

        // Send email
        let info = await transporter.sendMail({
            from: `"Your Website" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
