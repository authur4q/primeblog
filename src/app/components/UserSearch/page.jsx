"use client"
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './search.module.css'

export default function UserSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const delayDebounce = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                }
            } catch (err) {
                console.error("Error fetching users:", err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [query])

    return (
        <div className={styles.searchContainer} ref={dropdownRef}>
            <div className={styles.inputWrapper}>
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    placeholder="Search users by name or username..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className={styles.searchInput}
                />
                {loading && <div className={styles.spinner}></div>}
            </div>

            {showDropdown && query.trim() && (
                <div className={styles.dropdown}>
                    {results.length > 0 ? (
                        results.map((user) => {
                            const initial = (user.name || "U").charAt(0).toUpperCase()
                            return (
                                <Link 
                                    key={user._id} 
                                    href={`/profile/${user.username || user._id}`}
                                    className={styles.resultItem}
                                    onClick={() => {
                                        setShowDropdown(false)
                                        setQuery("")
                                    }}
                                >
                                    <div className={styles.avatar}>{initial}</div>
                                    <div className={styles.userInfo}>
                                        <span className={styles.name}>
                                            {user.name}
                                            {user.isPremium && <span className={styles.proBadge}>PRO</span>}
                                        </span>
                                        {user.username && <span className={styles.handle}>@{user.username}</span>}
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        !loading && <div className={styles.noResults}>No users found</div>
                    )}
                </div>
            )}
        </div>
    )
}