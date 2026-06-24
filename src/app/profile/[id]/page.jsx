"use client"
import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Navbar from '@/app/components/navbar/navbar'
import Link from 'next/link'
import styles from './profile.module.css'
import MessageButton from '../../components/messageButton/page'
import { ArrowRight } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Twitter } from 'lucide-react';
import { Instagram } from 'lucide-react';

const UserProfile = ({ params: paramsPromise }) => {
  const params = React.use(paramsPromise)
  const profileId = params.id

  const { data: session, status } = useSession()
  const currentUserId = session?.user?.id

  const [profileUser, setProfileUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [activeList, setActiveList] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editTwitter, setEditTwitter] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [saving, setSaving] = useState(false)

  const isOwnProfile = currentUserId && profileUser?._id
    ? String(currentUserId) === String(profileUser._id) || String(currentUserId) === String(profileId)
    : false

  const formatWhatsAppUrl = (phone) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/\D/g, ''); 
    return `https://wa.me/${cleanNumber}`;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return
      try {
        const [userRes, postsRes, followRes, followingRes] = await Promise.all([
          fetch(`/api/users/${profileId}`),
          fetch(`/api/posts?userId=${profileId}`),
          fetch(`/api/users/${profileId}/followers`),
          fetch(`/api/users/${profileId}/following`)
        ])

        if (!userRes.ok) throw new Error("User profile not found")
        const userData = await userRes.json()
        setProfileUser(userData)
        setEditName(userData.name || "")
        setEditUsername(userData.username || "")
        setEditPhone(userData.primaryPhone || "")
        setEditTwitter(userData.twitter || "")
        setEditInstagram(userData.Instagram || "")

        if (postsRes.ok) setUserPosts(await postsRes.json())
        if (followRes.ok) setFollowers(await followRes.json())
        if (followingRes.ok) setFollowing(await followingRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [profileId])

  const handleUnfollow = async (targetUserId) => {
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: "DELETE" })
      if (res.ok) {
        setFollowing(prev => prev.filter(user => user._id !== targetUserId))
      }
    } catch (err) {
      console.error("Error unfollowing:", err)
    }
  }

  const handleSaveChanges = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: editName,
        primaryPhone: editPhone,
        ...(profileUser?.isPremium && {
          username: editUsername,
          twitter: editTwitter,
          Instagram: editInstagram
        })
      }
      const res = await fetch(`/api/users/${profileUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setProfileUser(await res.json())
        setIsEditing(false)
      }
    } catch (err) {
      alert("Error updating profile.")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) return <div className={styles.container}><Navbar /><div className={styles.loaderContainer}><div className={styles.spinner}></div></div></div>

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPlaceholder}>{profileUser?.name?.charAt(0).toUpperCase()}</div>
            
            <div className={styles.metaInfo}>
              <h1 className={styles.username}>
                {profileUser?.name} {profileUser?.isPremium && <span className={styles.premiumBadge}>PREMIUM</span>}
              </h1>
              <p className={styles.userEmail}>@{profileUser?.username}</p>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                {profileUser?.primaryPhone && <span className={styles.phoneDisplay}>{profileUser.primaryPhone}</span>}
                
                {profileUser?.isPremium && profileUser?.primaryPhone && (
                  <a href={formatWhatsAppUrl(profileUser.primaryPhone)} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
                
                {profileUser?.twitter && (
                  <a href={`https://twitter.com/${profileUser.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={styles.socialTab}>
                    <Twitter size={16} /> 
                  </a>
                )}
                
                {profileUser?.Instagram && (
                  <a href={`https://instagram.com/${profileUser.Instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={styles.socialTab}>
                    <Instagram size={16} /> 
                  </a>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                {isOwnProfile && <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>{isEditing ? "Close Edit" : "Edit Profile"}</button>}
                {isOwnProfile && <button className={styles.logoutBtn} onClick={() => signOut()}>Logout</button>}
                {!isOwnProfile && <MessageButton recipientId={profileUser?._id} recipientName={profileUser?.name} />}
              </div>

              {isEditing && (
                <form className={styles.editForm} onSubmit={handleSaveChanges}>
                  <label className={styles.inputLabel}>Name</label>
                  <input className={styles.dashboardInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  
                  <label className={styles.inputLabel}>Phone Number</label>
                  <input className={styles.dashboardInput} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  
                  {profileUser?.isPremium && (
                    <>
                      <label className={styles.inputLabel}>Username</label>
                      <input className={styles.dashboardInput} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                      
                      <label className={styles.inputLabel}>Twitter</label>
                      <input className={styles.dashboardInput} value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} />
                      
                      <label className={styles.inputLabel}>Instagram</label>
                      <input className={styles.dashboardInput} value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
                    </>
                  )}
                  <button type="submit" className={styles.editBtn} disabled={saving} style={{ marginTop: "0.5rem" }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox} onClick={() => setActiveList('followers')} style={{ cursor: "pointer" }}>
              <span className={styles.statNumber}>{followers.length}</span>
              <span className={styles.statLabel}>Followers</span>
            </div>
            <div className={styles.statBox} onClick={() => setActiveList('following')} style={{ cursor: "pointer" }}>
              <span className={styles.statNumber}>{following.length}</span>
              <span className={styles.statLabel}>Following</span>
            </div>
          </div>
        </div>

        {activeList && (
          <div className={styles.modalOverlay} onClick={() => setActiveList(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>{activeList === 'followers' ? 'Followers' : 'Following'}</h3>
              <div className={styles.connectionList}>
                {(activeList === 'followers' ? followers : following).map((user) => (
                  <div key={user._id} className={styles.connectionItem}>
                    <Link href={`/profile/${user._id}`} className={styles.connectionLink}>
                      <div className={styles.avatarMini}>{user.name?.charAt(0).toUpperCase()}</div>
                      <span>{user.name}</span>
                    </Link>
                    {isOwnProfile && activeList === 'following' && (
                      <button onClick={() => handleUnfollow(user._id)} className={styles.unfollowBtn}>Unfollow</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                    <span className={styles.postDate}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recent"}</span>
                  </div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postDesc}>{post.description}</p>
                  <Link href={`/blogs/${post._id || post.id}`} className={styles.readLink}>
                    View Post <ArrowRight size={16} />
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