import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

const SAFARICOM_IPS = [
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.129",
  "196.201.212.138"
];

export async function POST(request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.ip;

    if (process.env.NODE_ENV === "production" && !SAFARICOM_IPS.includes(clientIp)) {
      return new NextResponse("Forbidden: Untrusted origin", { status: 403 });
    }

    const payload = await request.json();
    
    if (!payload?.Body?.stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Malformed callback body packet" });
    }

    const callbackData = payload.Body.stkCallback;

    if (callbackData.ResultCode === 0) {
      if (!callbackData.CallbackMetadata?.Item) {
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Missing metadata array structure" });
      }

      const metadataItems = callbackData.CallbackMetadata.Item;
      
      const mpesaReceipt = metadataItems.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const phoneItem = metadataItems.find(item => item.Name === "PhoneNumber")?.Value;
      const amountPaid = metadataItems.find(item => item.Name === "Amount")?.Value;

      if (!mpesaReceipt || !phoneItem) {
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Incomplete metadata fields extracted" });
      }

      const cleanPhone = String(phoneItem);
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);

      await connectMongoDb();
      
      const user = await User.findOne({ phoneNumber: cleanPhone });
      if (!user) {
        console.warn(`Callback warning: Paid phone ${cleanPhone} does not match any database profile configuration`);
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Handled processing edge condition cleanly" });
      }

      if (user.lastTransactionId === mpesaReceipt) {
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Duplicate transaction tracking skipped" });
      }

      await User.findByIdAndUpdate(
        user._id,
        { 
          $set: { 
            isPremium: true, 
            subscriptionPlan: "premium",
            premiumUntil: expirationDate,
            lastTransactionId: mpesaReceipt
          } 
        }
      );

      console.log(`Success: Received KES ${amountPaid} via ${mpesaReceipt} from phone ${cleanPhone}`);
    } else {
      console.log(`Transaction rejected or cancelled. Code: ${callbackData.ResultCode} - ${callbackData.ResultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback processed successfully." });

  } catch (error) {
    console.error("Fatal exception running webhook parsing loops:", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal handling parsing block failure" });
  }
}