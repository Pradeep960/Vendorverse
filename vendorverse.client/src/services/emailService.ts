import { sendEmailViaGraph } from './graphService';
import type { RFQ } from '../models/RFQ';
import type { Vendor } from '../models/Vendor';

/**
 * Sends an an email to a specific vendor containing the RFQ details and link using Microsoft Graph API.
 */
export const sendRFQEmail = async (rfq: RFQ, vendor: Vendor): Promise<boolean> => {
    try {
        const submissionLink = `${window.location.origin}/vendor-submit/${rfq.id}/${vendor.id}`;

        const subject = `Request for Quotation (RFQ) - ${rfq.title}`;
        const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Request for Quotation</h2>
                <p>Dear ${vendor.name},</p>
                <p>We are requesting a quote for: <strong>${rfq.title}</strong>.</p>
                <p>Description: ${rfq.description}</p>
                <div style="margin: 20px 0;">
                    <a href="${submissionLink}" 
                       style="background-color: #0078d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       Submit Your Quotation
                    </a>
                </div>
                <p>Please find the detailed RFQ document attached to this email.</p>
                <p>Best Regards,<br/>Vendorverse Procurement Team</p>
            </div>
        `;

        const attachments = [];
        if (rfq.attachedFile) {
            // Data URI format: "data:application/pdf;base64,JVBERi0xLjc..."
            // Graph API expects only the base64 string
            const base64Content = rfq.attachedFile.data.split(',')[1];
            attachments.push({
                name: rfq.attachedFile.name,
                contentType: 'application/pdf',
                contentBytes: base64Content
            });
        }

        return await sendEmailViaGraph(vendor.email, subject, body, attachments);
    } catch (error) {
        console.error(`Failed to send RFQ email to ${vendor.email}:`, error);
        return false;
    }
};

/**
 * Sends a confirmation email indicating a vendor was selected using Microsoft Graph API.
 */
export const sendSelectionEmail = async (rfq: RFQ, vendor: Vendor): Promise<boolean> => {
    try {
        const subject = `Vendor Selection Confirmation - ${rfq.title}`;
        const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #28a745;">Congratulations!</h2>
                <p>Dear ${vendor.name},</p>
                <p>Your quotation for <strong>${rfq.title}</strong> has been selected by our team.</p>
                <p>We appreciate your prompt response and competitive offer. Our procurement team will contact you shortly with the next steps regarding the purchase order and delivery schedule.</p>
                <p>Best regards,<br/>Vendorverse Procurement Team</p>
            </div>
        `;

        return await sendEmailViaGraph(vendor.email, subject, body);
    } catch (error) {
        console.error(`Failed to send selection email to ${vendor.email}:`, error);
        return false;
    }
};
