import { getPayPalApiBase, isPayPalEnabled } from "@/lib/paypal/config";
import { getSiteUrl } from "@/lib/site-url";

type PayPalAccessToken = { access_token: string };

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = (await response.json()) as PayPalAccessToken;
  return data.access_token;
}

export async function createPayPalCheckoutOrder(input: {
  requestId: string;
  amount: number;
  currency?: string;
  title: string;
}) {
  if (!isPayPalEnabled()) {
    throw new Error("PayPal is not configured.");
  }

  const token = await getAccessToken();
  const siteUrl = getSiteUrl();
  const currency = input.currency ?? "GBP";

  const response = await fetch(`${getPayPalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          reference_id: input.requestId,
          description: input.title.slice(0, 127),
          amount: {
            currency_code: currency,
            value: input.amount.toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: "Peek",
        user_action: "PAY_NOW",
        return_url: `${siteUrl}/payment/paypal/return`,
        cancel_url: `${siteUrl}/my-requests?payment_cancelled=1`
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal order failed: ${text}`);
  }

  const order = (await response.json()) as {
    id: string;
    links?: { rel: string; href: string }[];
  };

  const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;

  if (!approvalUrl) {
    throw new Error("PayPal did not return an approval URL.");
  }

  return { orderId: order.id, approvalUrl };
}

export async function authorizePayPalOrder(orderId: string) {
  if (!isPayPalEnabled()) {
    throw new Error("PayPal is not configured.");
  }

  const token = await getAccessToken();

  const response = await fetch(
    `${getPayPalApiBase()}/v2/checkout/orders/${orderId}/authorize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal authorize failed: ${text}`);
  }

  const payload = (await response.json()) as {
    purchase_units?: {
      payments?: { authorizations?: { id: string }[] };
    }[];
  };

  const authorizationId =
    payload.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

  if (!authorizationId) {
    throw new Error("PayPal did not return an authorization id.");
  }

  return { authorizationId, payload };
}

export async function capturePayPalAuthorization(authorizationId: string) {
  if (!isPayPalEnabled()) {
    throw new Error("PayPal is not configured.");
  }

  const token = await getAccessToken();

  const response = await fetch(
    `${getPayPalApiBase()}/v2/payments/authorizations/${authorizationId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal capture failed: ${text}`);
  }

  return response.json();
}
