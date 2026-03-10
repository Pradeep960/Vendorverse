import { msalApp, loginRequest } from "./authConfig";
import { Client } from "@microsoft/microsoft-graph-client";

/**
 * Acquires a token using MSAL v1 Implicit Flow.
 */
export const getAccessToken = async (): Promise<string | null> => {
    try {
        const silentRequest = {
            scopes: loginRequest.scopes
        };
        const response = await msalApp.acquireTokenSilent(silentRequest);
        return response.accessToken;
    } catch (error) {
        console.error("Silent token acquisition failed, attempting redirect:", error);
        msalApp.acquireTokenRedirect(loginRequest);
        return null; // The redirect will handle the token
    }
};

export const getGraphClient = (accessToken: string) => {
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

export const sendEmailViaGraph = async (
    to: string,
    subject: string,
    body: string,
    attachments?: Array<{ name: string, contentBytes: string, contentType: string }>
): Promise<boolean> => {
    try {
        const token = await getAccessToken();
        if (!token) return false;

        const client = getGraphClient(token);

        const email: any = {
            message: {
                subject: subject,
                body: {
                    contentType: "HTML",
                    content: body
                },
                toRecipients: [{
                    emailAddress: { address: to }
                }]
            },
            saveToSentItems: "true"
        };

        if (attachments && attachments.length > 0) {
            email.message.attachments = attachments.map(att => ({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": att.name,
                "contentType": att.contentType,
                "contentBytes": att.contentBytes
            }));
        }

        await client.api("/me/sendMail").post(email);
        return true;
    } catch (error) {
        console.error("Error sending email via Graph API:", error);
        return false;
    }
};

export { msalApp as msalInstance };
