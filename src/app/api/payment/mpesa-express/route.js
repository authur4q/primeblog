import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../auth/[...nextauth]/options"; // Double-check this relative path matches your directory structure
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

const getMpesaTimestamp = () => {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized operational access.", { status: 401 });
    }

    const { phone, amount } = await request.json();
    const formattedPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "254").replace(/^\+/, "");

    if (!formattedPhone || !amount) {
      return new NextResponse("Missing required payment payload fields.", { status: 400 });
    }

    await connectMongoDb();

    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { phoneNumber: formattedPhone } }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const mpesaBaseUrl = isProduction 
      ? "https://api.safaricom.co.ke" 
      : "https://sandbox.safaricom.co.ke";

    const authHeader = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const tokenResponse = await fetch(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authHeader}` }
    });
    
    const { access_token } = await tokenResponse.json();
    const timestamp = getMpesaTimestamp();
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");

    const stkResponse = await fetch(`${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: isProduction ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline", 
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL || "https://webhook.site/placeholder-test-url",
        AccountReference: "PrimePremium",
        TransactionDesc: "Subscription upgrade billing packet"
      })
    });

    const stkData = await stkResponse.json();

    return NextResponse.json(stkData, { status: 200 });

  } catch (error) {
    console.error("Critical M-Pesa payment engine exception:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}