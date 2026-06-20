"use client";

import { useState } from "react";
import styles from "./checkoutbtn.module.css";
import Navbar from "../components/navbar/navbar";
import {useRouter} from "next/navigation";

export default function MpesaCheckout() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payment/mpesa-express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: 49 }) 
      });

      console.log(res)

      const data = await res.json();

      console.log("Safaricom Gateway Response Payload:", data);
      
      if (data.ResponseCode === "0") {
        alert("STK Prompt dispatched! Check your phone and input your M-Pesa PIN.");
      } else {
        alert(`Request failed: ${data.ResponseDescription || "Unknown Error"}`);
      }
    } catch (err) {
      alert("Network or initialization boundary failure.");
    } finally {
      setLoading(false);
      

    }
  };

  return (
    <form onSubmit={handlePayment} className={styles.formContainer}>
      <h2 className={styles.title}>M-Pesa Express Checkout</h2>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>Phone Number (Safcom)</label>
        <input 
          type="tel" 
          placeholder="e.g. 0712345678 or 2547..." 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
          className={styles.phoneInput}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className={styles.submitButton}
      >
        {loading ? "Processing..." : "Pay KES 49 via M-Pesa"}
      </button>
    </form>
  );
}