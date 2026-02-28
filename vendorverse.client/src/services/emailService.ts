import type { RFQ } from '../models/RFQ';

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface EmailNotification {
    to: string;
    from: string;
    subject: string;
    body: string;
    rfqId: string;
    sentAt: string;
    hasAttachment: boolean;
    attachmentName?: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId: string;
    sentTo: string;
    sentAt: string;
}

// Email configuration - Update this to your desired email address
const EMAIL_CONFIG = {
    from: 'nithin.t@pravaltech.com',
    to: 'kartheek.m@pravaltech.com', // Default recipient
    vendorNotificationTo: 'vendors@pravaltech.com'
};

export const setEmailRecipient = (email: string) => {
    EMAIL_CONFIG.to = email;
};

export const getEmailRecipient = () => EMAIL_CONFIG.to;

export const sendQuoteNotificationEmail = async (
    rfq: RFQ, 
    pdfBlob?: Blob,
    customRecipient?: string
): Promise<SendEmailResult> => {
    // Simulate email sending delay
    await delay(800);
    
    const recipient = customRecipient || EMAIL_CONFIG.to;
    
    const emailContent: EmailNotification = {
        to: recipient,
        from: EMAIL_CONFIG.from,
        subject: `New Quote Request: ${rfq.title}`,
        body: `
Dear Team,

A new quote request has been raised and requires your attention.

RFQ Details:
- Title: ${rfq.title}
- Description: ${rfq.description}
- Status: ${rfq.status}
- Created: ${new Date(rfq.createdAt).toLocaleString()}
- Deadline: ${new Date(rfq.deadline).toLocaleString()}
- Vendors Targeted: ${rfq.vendorsTargeted.length}

Please log in to the Vendorverse platform to view and manage this quote request.

${pdfBlob ? 'A PDF quote request has been attached to this email.' : ''}

Best regards,
Vendorverse System
        `,
        rfqId: rfq.id,
        sentAt: new Date().toISOString(),
        hasAttachment: !!pdfBlob,
        attachmentName: pdfBlob ? `RFQ-${rfq.id}.pdf` : undefined
    };
    
    // Log the email (in real app, this would call an email API)
    console.log('📧 Email Notification Sent:', emailContent);
    console.log('📎 PDF Attachment:', pdfBlob ? `Size: ${pdfBlob.size} bytes, Type: ${pdfBlob.type}` : 'None');
    
    return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentTo: recipient,
        sentAt: emailContent.sentAt
    };
};

export const sendBulkVendorNotification = async (
    rfq: RFQ, 
    vendors: string[],
    pdfBlob?: Blob
): Promise<SendEmailResult[]> => {
    await delay(600);
    
    const results: SendEmailResult[] = [];
    
    for (const vendorId of vendors) {
        const result: SendEmailResult = {
            success: true,
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sentTo: `vendor_${vendorId}@example.com`,
            sentAt: new Date().toISOString()
        };
        results.push(result);
        console.log(`📧 Vendor notification sent to ${vendorId}:`, result);
    }
    
    return results;
};

// Export for direct use
export default {
    sendQuoteNotificationEmail,
    sendBulkVendorNotification,
    setEmailRecipient,
    getEmailRecipient
};
