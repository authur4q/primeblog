"use client"
import React, { useEffect, useState } from 'react'
import Navbar from '../components/navbar/navbar'
import styles from "./blogs.module.css"
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

const Blogs = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/posts")
        
        if (!res.ok) {
          throw new Error("Failed to fetch posts")
        }
        
        const json = await res.json()
        
        // Ensure we are working with an array
        const postsArray = Array.isArray(json) ? json : (json.posts || []);
        setData(postsArray)
        
      } catch (err) {
        console.error(err)
        setError("Error loading posts. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, [])

  const filteredPosts = data.filter((item) => {
    const query = searchQuery.toLowerCase()
    const matchesTitle = item.title?.toLowerCase().includes(query) || false
    const matchesDesc = item.description?.toLowerCase().includes(query) || false
    const matchesAuthor = item.name?.toLowerCase().includes(query) || false
    
    return matchesTitle || matchesDesc || matchesAuthor
  })

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.posts}>
            {loading && <p className={styles.message}>Loading posts...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            
            {!loading && !error && filteredPosts.length === 0 && (
              <p className={styles.message}>No posts found.</p>
            )}

            {!loading && !error && filteredPosts.map((item) => {
              const authorName = item.name || "Anonymous"
              const initial = authorName.charAt(0).toUpperCase()
              const profileId = typeof item.userId === 'object' ? item.userId?._id : item.userId

              return (
                <div key={item._id || Math.random()} className={styles.post}>
                  <div className={styles.postHeader}>
                    <div className={styles.authorMeta}>
                      <div className={styles.avatar}>{initial}</div>
                      <div className={styles.authorBadgeWrapper}>
                        <span className={styles.author}>pb/{authorName}</span>
                        {item.isPremium && <span className={styles.verifiedTick}>✓</span>}
                      </div>
                    </div>
                    {item.createdAt && (
                      <p className={styles.time}>
                        {(() => {
                          try { return format(parseISO(item.createdAt), 'MM/dd/yyyy HH:mm') } 
                          catch (e) { return "" }
                        })()}
                      </p>
                    )}
                  </div>
                  
                  <Link href={`/blogs/${item._id || ''}`} className={styles.postContentLink}>
                    <h1>{item.title || "Untitled"}</h1>
                    <h3>{item.description || ""}</h3>
                  </Link>
                </div>
              )
            })}
          </div>
          
          <div className={styles.text}>
            <h2>Get up-to-date with latest catchy posts</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blogs