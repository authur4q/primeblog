"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/navbar/page'
import styles from "./admin.module.css"

const AdminDashboard = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState({ users: 0, premium: 0, posts: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchDashboardData = async () => {
    try {
      setLoadingMetrics(true)
      const res = await fetch("/api/admin/metrics")
      
      if (!res.ok) {
        throw new Error("Failed to resolve metrics channel")
      }

      const json = await res.json()
      if (json) {
        setStats(json.stats || { users: 0, premium: 0, posts: 0 })
        setRecentUsers(json.recentUsers || [])
      }
    } catch (error) {
      console.error("Failed to load metrics data:", error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "admin") {
      router.push("/")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const filteredUsers = recentUsers.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  })

  if (status === "loading" || !session || session.user?.role !== "admin") {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.wrapper}>
          <p className={styles.loadingMessage}>Checking system authorization credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        
        <header className={styles.header}>
          <div>
            <h1>System Overview</h1>
            <p>Monitor metrics, user tiers, and baseline performance system-wide.</p>
          </div>
          <button onClick={fetchDashboardData} className={styles.refreshBtn}>
            {loadingMetrics ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.cardHeader}>
              <span>Total Registrations</span>
              <div className={`${styles.iconIndicator} ${styles.blueTier}`}>👥</div>
            </div>
            <h2 className={styles.metricValue}>
              {loadingMetrics ? "..." : stats.users.toLocaleString()}
            </h2>
            <p className={styles.metricSubtext}>Active registered profiles</p>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardHeader}>
              <span>Premium Tier Accounts</span>
              <div className={`${styles.iconIndicator} ${styles.greenTier}`}>⚡</div>
            </div>
            <h2 className={styles.metricValue}>
              {loadingMetrics ? "..." : stats.premium.toLocaleString()}
            </h2>
            <p className={styles.metricSubtext}>
              {stats.users > 0 
                ? `${((stats.premium / stats.users) * 100).toFixed(1)}% total conversion`
                : "0% total conversion"
              }
            </p>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardHeader}>
              <span>Stories & Content</span>
              <div className={`${styles.iconIndicator} ${styles.purpleTier}`}>📝</div>
            </div>
            <h2 className={styles.metricValue}>
              {loadingMetrics ? "..." : stats.posts.toLocaleString()}
            </h2>
            <p className={styles.metricSubtext}>Global entries published</p>
          </div>
        </section>

        <section className={styles.contentLayout}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3>Recent Account Registrations</h3>
              <input 
                type="text" 
                placeholder="Filter recent users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.tableSearch} 
              />
            </div>
            
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email Address</th>
                    <th>Access Role</th>
                    <th>Subscription Tier</th>
                    <th>System Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMetrics && recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={styles.tableMessage}>Retrieving core records...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={styles.tableMessage}>No matching accounts logged.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const initial = (user.name || "U").charAt(0).toUpperCase()
                      const isPremium = user.tier === "premium" || user.isPremium

                      return (
                        <tr key={user._id}>
                          <td>
                            <div className={styles.userColumn}>
                              <div className={styles.miniAvatar}>{initial}</div>
                              <span>{user.name || "Anonymous"}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`${styles.badge} ${user.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
                              {user.role || "user"}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${isPremium ? styles.tierPremium : styles.tierFree}`}>
                              {isPremium ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionsGroup}>
                              <button className={styles.actionBtnEdit}>Modify</button>
                              <button className={styles.actionBtnDelete}>Suspend</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default AdminDashboard