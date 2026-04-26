import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID", // from Azure portal
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        redirectUri: "http://localhost:3000"
    }
};

const msalInstance = new PublicClientApplication(msalConfig);