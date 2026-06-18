"use client"
import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Navbar from '@/app/components/navbar/page'
import Link from 'next/link'
import styles from './profile.module.css'

const UserProfile = ({ params: paramsPromise }) => {
  const params = React.use(paramsPromise)
  const profileId = params.id

  const { data: session, status, update: updateSession } = useSession()
  const currentUserId = session?.user?.id

  const [profileUser, setProfileUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editTwitter, setEditTwitter] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [saving, setSaving] = useState(false)

  const isOwnProfile = currentUserId === profileId

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return

      try {
        const userRes = await fetch(`/api/users/${profileId}`)
        if (!userRes.ok) {
          if (userRes.status === 404) throw new Error("User profile not found")
          throw new Error("Could not fetch user details")
        }
        const userData = await userRes.json()
        setProfileUser(userData)
        
        setEditName(userData.name || "")
        setEditUsername(userData.username || "")
        setEditPhone(userData.primaryPhone || "")
        setEditTwitter(userData.twitter || "")
        setEditInstagram(userData.Instagram || "")

        const postsRes = await fetch(`/api/posts?userId=${profileId}`)
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setUserPosts(postsData)
        }
      } catch (err) {
        console.error("Error loading profile:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [profileId])

  const handleSaveChanges = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: editName,
        username: editUsername,
        primaryPhone: editPhone,
        ...(profileUser?.isPremium && {
          twitter: editTwitter,
          Instagram: editInstagram
        })
      }

      const res = await fetch(`/api/users/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      

      if (res.ok) {
        const updatedData = await res.json()
        setProfileUser(updatedData)
        setIsEditing(false)
        await updateSession()
      } else {
        alert("Failed to update profile settings details.")
      }
    } catch (err) {
      alert("Error processing async sync payload update.")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.errorWrapper}>
          <p className={styles.errorText}>{error}</p>
          <Link href="/blogs" className={styles.loginBtn}>
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        
        <div className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPlaceholder}>
              {profileUser?.name ? profileUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className={styles.metaInfo}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 className={styles.username}>{profileUser?.name}</h1>
                {profileUser?.isPremium && <span className={styles.premiumBadge}>PRO</span>}
              </div>
              <p className={styles.userEmail}>
                {profileUser?.username ? `@${profileUser.username}` : "No unique identifier handle claimed"}
              </p>
              
              <div style={{ marginTop: "8px" }}>
                {profileUser?.primaryPhone && (
                  profileUser.isPremium ? (
                    <a 
                      href={`https://wa.me/${profileUser.primaryPhone}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.whatsappLink}
                    >
                      WhatsApp {profileUser.name} at +{profileUser.primaryPhone}
                    </a>
                  ) : (
                    <span className={styles.phoneDisplay}>{profileUser.primaryPhone}</span>
                  )
                )}
              </div>

              {profileUser?.isPremium && (profileUser?.twitter || profileUser?.github) && (
                <div className={styles.socialsDisplayRow} style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  {profileUser.twitter && <span className={styles.socialTab}>{profileUser.twitter}</span>}
                  {profileUser.Instagram && <span className={styles.socialTab}>{profileUser.Instagram}</span>}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                {isOwnProfile && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                    Edit Profile Details
                  </button>
                )}

                {isOwnProfile && (
                  <button
                    className={styles.logoutBtn}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    aria-label="Sign out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Logout Account
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{userPosts.length}</span>
              <span className={styles.statLabel}>Stories Published</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{profileUser?.isPremium ? "Premium Pro" : "Standard Read"}</span>
              <span className={styles.statLabel}>Account Type</span>
            </div>
          </div>
        </div>

        {isOwnProfile && isEditing && (
          <form onSubmit={handleSaveChanges} className={styles.editFormCard} style={{ background: "#161925", border: "1px solid #222533", borderRadius: "12px", padding: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", fontWeight: "700" }}>Update Profile Settings</h3>
            
            <div className={styles.inputGroup} style={{ marginBottom: "1rem" }}>
              <label className={styles.label} style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Display Name</label>
              <input type="text" className={styles.dashboardInput} value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#0f111a", border: "1px solid #222533", borderRadius: "6px", color: "#fff" }} required />
            </div>

            <div className={styles.inputGroup} style={{ marginBottom: "1rem" }}>
              <label className={styles.label} style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Platform @username</label>
              <input type="text" className={styles.dashboardInput} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#0f111a", border: "1px solid #222533", borderRadius: "6px", color: "#fff" }} />
            </div>

            <div className={styles.inputGroup} style={{ marginBottom: "1.5rem" }}>
              <label className={styles.label} style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>
                Contact Phone Number {profileUser?.isPremium ? "(Enables Live WhatsApp Routing Link)" : "(Standard Access display only)"}
              </label>
              <input type="tel" className={styles.dashboardInput} placeholder="e.g. 2547XXXXXXXX" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#0f111a", border: "1px solid #222533", borderRadius: "6px", color: "#fff" }} />
            </div>

            {profileUser?.isPremium ? (
              <div style={{ borderTop: "1px solid #222533", paddingTop: "1rem", marginTop: "1rem" }}>
                <span style={{ display: "block", fontSize: "0.8rem", color: "#6366f1", fontWeight: "700", textTransform: "uppercase", marginBottom: "1rem" }}>✨ Premium Social Integrations</span>
                <div className={styles.inputGroup} style={{ marginBottom: "1rem" }}>
                  <label className={styles.label} style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Twitter / X Handle</label>
                  <input type="text" className={styles.dashboardInput} placeholder="e.g the_greatest" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#0f111a", border: "1px solid #222533", borderRadius: "6px", color: "#fff" }} />
                </div>
                <div className={styles.inputGroup} style={{ marginBottom: "1rem" }}>
                  <label className={styles.label} style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Instagram Profile Username</label>
                  <input type="text" className={styles.dashboardInput} placeholder="e.g. the_greatest" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#0f111a", border: "1px solid #222533", borderRadius: "6px", color: "#fff" }} />
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px dashed rgba(99, 102, 241, 0.2)", borderRadius: "6px", padding: "12px", marginBottom: "1.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                  Upgrade to <Link href="/premium" style={{ color: "#6366f1", fontWeight: "600", textDecoration: "underline" }}>Prime Pro</Link> to unlock interactive WhatsApp links, custom themes, and public social network nodes.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button type="submit" disabled={saving} className={styles.saveBtn} style={{ padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "0.6rem 1.2rem", background: "transparent", color: "#94a3b8", border: "1px solid #222533", borderRadius: "6px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>
            {isOwnProfile ? "Your Recent Articles" : `Articles by ${profileUser?.name}`}
          </h2>
          
          {userPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{isOwnProfile ? "You haven't written any blog posts yet." : "This user hasn't written any blog posts yet."}</p>
              {isOwnProfile && <Link href="/dashboard" className={styles.createBtn}>Create Your First Post</Link>}
            </div>
          ) : (
            <div className={styles.postsGrid}>
              {userPosts.map((post) => (
                <div key={post._id || post.id} className={styles.postCard}>
                  <div className={styles.postMeta}>
                    <span className={styles.postDate}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postDesc}>{post.description}</p>
                  <Link href={`/blogs/${post._id || post.id}`} className={styles.readLink}>
                    View Post 
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default UserProfile