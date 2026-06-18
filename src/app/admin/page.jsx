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

  const [ads, setAds] = useState([])
  const [loadingAds, setLoadingAds] = useState(false)
  const [adForm, setAdForm] = useState({ title: "", description: "", targetLink: "", imageUrl: "" })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState({ text: "", type: "" })

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

  const fetchAds = async () => {
    try {
      setLoadingAds(true)
      const res = await fetch("/api/ads")
      if (!res.ok) throw new Error("Failed to load ads")
      const data = await res.json()
      
      if (data) {
        setAds(Array.isArray(data) ? data : [data])
      } else {
        setAds([])
      }
    } catch (error) {
      console.error("Error fetching ads registry:", error)
    } finally {
      setLoadingAds(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "admin") {
      router.push("/")
      return
    }

    fetchDashboardData()
    fetchAds()
  }, [session, status, router])

  const handleCreateAd = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adForm),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Failed to launch advertisement campaign")

      setFormMessage({ text: "Ad broadcast started successfully! Expires in 24 hours.", type: "success" })
      setAdForm({ title: "", description: "", targetLink: "", imageUrl: "" })
      fetchAds()
    } catch (error) {
      setFormMessage({ text: error.message, type: "error" })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteAd = async (adId) => {
    if (!confirm("Are you sure you want to pull this advertisement from rotation?")) return

    try {
      const res = await fetch(`/api/ads?id=${adId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to terminate ad instance")
      
      setAds(prev => prev.filter(ad => ad._id !== adId))
    } catch (error) {
      alert(error.message)
    }
  }

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
          <button onClick={() => { fetchDashboardData(); fetchAds(); }} className={styles.refreshBtn}>
            {loadingMetrics || loadingAds ? "Refreshing..." : "Refresh Data"}
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

        <section className={styles.adsManagementGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', margin: '40px 0' }}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3>Deploy Sponsored Content</h3>
            </div>
            <form onSubmit={handleCreateAd} className={styles.adFormLayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              {formMessage.text && (
                <div className={`${styles.formAlert} ${formMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`} style={{ padding: '12px', borderRadius: '6px', fontSize: '0.9rem', background: formMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${formMessage.type === 'success' ? '#10b981' : '#ef4444'}`, color: formMessage.type === 'success' ? '#10b981' : '#ef4444' }}>
                  {formMessage.text}
                </div>
              )}
              <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Campaign Headline</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Premium Commercial Equipment Upgrades"
                  value={adForm.title}
                  onChange={e => setAdForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Body Description Text</label>
                <textarea 
                  required 
                  rows="3"
                  placeholder="Provide promotional details or context hooks..."
                  value={adForm.description}
                  onChange={e => setAdForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Target Destination URL</label>
                <input 
                  type="url" 
                  required 
                  placeholder="https://example.com/promo-target"
                  value={adForm.targetLink}
                  onChange={e => setAdForm(prev => ({ ...prev, targetLink: e.target.value }))}
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Image Resource Link (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/assets/banner.png"
                  value={adForm.imageUrl}
                  onChange={e => setAdForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>
              <button type="submit" disabled={formSubmitting} className={styles.refreshBtn} style={{ marginTop: '10px', width: '100%' }}>
                {formSubmitting ? "Deploying Block..." : "Inject Advertisement Line"}
              </button>
            </form>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3>Active Campaign Streams</h3>
            </div>
            <div className={styles.activeAdsWrapper} style={{ padding: '20px', maxHeight: '420px', overflowY: 'auto' }}>
              {loadingAds ? (
                <p className={styles.tableMessage}>Parsing ongoing campaigns...</p>
              ) : ads.length === 0 ? (
                <p className={styles.tableMessage}>No sponsored cards currently live in rotation.</p>
              ) : (
                <div className={styles.adInventoryList} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {ads.map((ad) => (
                    <div key={ad._id} className={styles.adminAdItemCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', gap: '16px' }}>
                      <div className={styles.adminAdCardData} style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#fff' }}>{ad.title}</h4>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ad.description}</p>
                        <a href={ad.targetLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#04c21e', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.targetLink}</a>
                      </div>
                      <button onClick={() => handleDeleteAd(ad._id)} className={styles.actionBtnDelete}>
                        Terminate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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