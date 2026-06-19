"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from "./rotating.module.css"

export default function RotatingAd({ initialAd }) {
  const [activeAd, setActiveAd] = useState(initialAd)

  const rotateAd = async () => {
    try {
      const res = await fetch("/api/ads", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data) {
        setActiveAd(data)
      }
    } catch (error) {
      console.error("Error rotating homepage ad:", error)
    }
  }

  useEffect(() => {
    const adRotationInterval = setInterval(() => {
      rotateAd()
    }, 9000)

    return () => clearInterval(adRotationInterval)
  }, [])

  if (!activeAd) return null

  return (
    <div className={styles.adSection}>
      <span className={styles.adLabel}>Sponsored</span>
      <div className={styles.adWrapper}>
        <div className={styles.adContent}>
          <h3>{activeAd.title}</h3>
          <p>{activeAd.description}</p>
        </div>
        <div className={styles.adActions}>
          <a href={activeAd.targetLink} target="_blank" rel="noopener noreferrer" className={styles.adBtn}>
            Learn More
          </a>
          <Link href="/premium" className={styles.adRemoveLink}>
            Remove Ads with Pro
          </Link>
        </div>
      </div>
    </div>
  )
}