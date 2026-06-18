"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import styles from './navbar.module.css'
import { signOut, useSession } from 'next-auth/react'

const publicLinks = [
  { 
    href: '/',
    label: 'Home',
    id: 1
  },
  {
    href: '/blogs',
    label: 'Blogs',
    id: 2
  },
  {
    href: '/premium',
    label: 'Premium',
    id: 3
  },
]

const Navbar = () => {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <h1>
          <Link href="https://www.instagram.com/authurprime_?igsh=aDF0OWp6M2djODFs">
            Prime
          </Link>
        </h1>
      </div>
      
      <button 
        className={`${styles.toggle} ${isOpen ? styles.toggleActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
      </button>

      <div className={`${styles.links} ${isOpen ? styles.linksActive : ''}`}>
        {publicLinks.map(link => (
          <Link href={link.href} key={link.id} onClick={() => setIsOpen(false)}>
            {link.label}
          </Link>
        ))}

        {session?.user?.role === "admin" && (
          <Link href="/admin" onClick={() => setIsOpen(false)}>
            Admin 
          </Link>
        )}

        {status === "authenticated" && (
          <>
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
            
            <Link href={`/profile/${userId}`} onClick={() => setIsOpen(false)}>
              My Profile
            </Link>

            <button 
              className={styles.btn} 
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: `${window.location.origin}/login` })
              }}
            >
              Logout
            </button>
          </>
        )}

        {status === "unauthenticated" && (
          <Link href="/login" onClick={() => setIsOpen(false)}>
            Login
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navbar