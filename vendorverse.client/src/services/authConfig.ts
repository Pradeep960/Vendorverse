import * as Msal from "msal";

export const msalConfig: Msal.Configuration = {
    auth: {
        clientId: "5bfa2aed-bd36-44f2-a920-f0803d1f7b62",
        authority: "https://login.microsoftonline.com/648ca8d9-38e9-44ca-bc27-20e5a79ee859",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true, // Recommended for older MSAL v1 to avoid redirect issues
    }
};

export const loginRequest = {
    scopes: ["User.Read", "Mail.Send"]
};

export const msalApp = new Msal.UserAgentApplication(msalConfig);
