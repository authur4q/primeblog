"use client"
import React from 'react'
import Navbar from '../components/navbar/page'
import styles from "./register.module.css"
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation';

const page = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter()

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true)
    try {
    
      const emailRe = /^\S+@\S+\.\S+$/
      if (!emailRe.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, street, city }),
      });

      const data = await res.json();
      

      if (!res.ok) {
        
        if (res.status === 409) {
          setError('That email is already registered')
        } else if (res.status === 400) {
          setError( 'Please check your input')
        } else {
          setError( 'Registration failed')
        }
        setLoading(false)
        return;
      }

      setLoading(false)
      setError("")
      setSuccess('Registration successful — redirecting to login...')
      
      setTimeout(() => router.push('/login'), 800)
    } catch (err) {
      
      setError('Something went wrong during Registration.Try again')
      setLoading(false)
    }
  }
  return (
    <div className={styles.container}>
        <Navbar />
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <h1>Ready for mind-blowing experience?</h1>
            </div>
            <div className={styles.form}>
                <form onSubmit={handleOnSubmit}>
                    <h2 className={styles.formTitle}>Register here</h2>
                    <input className={styles.input} onChange={e => setName(e.target.value)} type="text" placeholder='Username' />
                    <input className={styles.input} onChange={e => setEmail(e.target.value)}  type="email" placeholder='Email' />
                   
                   
                    <input className={styles.input} onChange={e => setPassword(e.target.value)} type="password" placeholder='Password' />
                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>{success}</p>}

                    <button className={styles.button} type='submit' disabled={loading || success}>{loading ? 'Registering...' : 'Register'}</button>
                    <h1>Or</h1>
                    <Link href={"/login"} ><p>Login using existing account</p></Link>
                </form>
        </div>
        </div>
      
    </div>
  )
}

export default page
