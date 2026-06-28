"use client";
import React, { useState } from 'react';
import Navbar from '../components/navbar/navbar';
import styles from "./login.module.css";
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginButton from '../components/loginButton/page';
import { startAuthentication } from "@simplewebauthn/browser";

const Login = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBiometricLogin = async () => {
    if (!email) {
      setError("Please enter your email address to use biometric login.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lookupResp = await fetch("/api/auth/user-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      if (!lookupResp.ok) throw new Error("User not found.");
      const { userId } = await lookupResp.json();

      const resp = await fetch("/api/auth/webauthn/auth-options", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      const opts = await resp.json();
      const { extensions, ...optsWithoutExtensions } = opts;

      const assertion = await startAuthentication(optsWithoutExtensions);

      const verificationResp = await fetch("/api/auth/webauthn/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertion, userId }),
      });

      const verificationData = await verificationResp.json();

      if (verificationResp.ok && verificationData.verified) {
      
        await signIn("credentials", {
          isWebAuthn: "true",
          userId: userId,
          redirect: true,
          callbackUrl: "/",
        });
      } else {
        throw new Error(verificationData.error || "Verification failed");
      }
    } catch (err) {
      console.error("Biometric login failed", err);
      setError("Biometric login failed:Upgrade to Prime Premium to access this Feature");
    } finally {
      setLoading(false);
    }
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!res?.ok) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError('Unable to login. Try again later.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email first.");
    try {
      const res = await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) alert("Check your inbox for a reset link!");
      else setError("Could not send reset email.");
    } catch (err) {
      setError("Network error.");
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.text}>
          <h1>Ready for mind-blowing experience?</h1>
        </div>
        <div className={styles.form}>
          <form onSubmit={handleOnSubmit}>
            <h2 className={styles.formTitle}>Login</h2>
            <input className={styles.input} required onChange={e => setEmail(e.target.value)} type="email" placeholder='Enter your email' />
            <input className={styles.input} required onChange={e => setPassword(e.target.value)} type="password" placeholder='Enter your password' />
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" onClick={handleForgotPassword} className={styles.button}>Forgot Password?</button>
            <button className={styles.button} type='submit' disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
            <LoginButton variant="biometric" onClick={handleBiometricLogin}>Login with FaceID/TouchID</LoginButton>
            <h1>Or</h1>
            <p>Don't have an account? <Link href={"/register"}>Register</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login;