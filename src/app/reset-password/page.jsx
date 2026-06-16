"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./reset.module.css";

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setStatus({ type: "error", text: "Passwords do not match." });
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus({ type: "success", text: "Password updated! Redirecting..." });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const data = await res.json();
        setStatus({ type: "error", text: data.error || "Reset failed." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: "center" }}>
          <h2>Invalid Link</h2>
          <p>Please request a new password reset email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>New Password</h2>
          <p>Create a secure password for your account</p>
        </div>

        <form onSubmit={handleReset}>
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {status.text && (
            <div className={`${styles.message} ${styles[status.type]}`}>
              {status.text}
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: "center" }}>
          <p>Loading reset form...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
