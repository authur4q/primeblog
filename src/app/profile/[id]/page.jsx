"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Navbar from '../../components/navbar/navbar'
import Link from 'next/link'
import styles from './profile.module.css'
import MessageButton from '../../components/messageButton/page'

import { UploadButton } from '@uploadthing/react'
import { ArrowRight, MessageCircle, Twitter, Instagram, Settings, X, ShieldAlert, CreditCard, LifeBuoy, UserPlus, UserCheck, Search, Pencil, Loader2 } from 'lucide-react';

const UserProfile = ({ params }) => {

  const unwrappedParams = params ? React.use(params) : null
  const profileId = unwrappedParams?.id

  const { data: session, status, update } = useSession()
  const currentUserId = session?.user?.id

  const [profileUser, setProfileUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [activeList, setActiveList] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editTwitter, setEditTwitter] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [editBannerGradient, setEditBannerGradient] = useState("linear-gradient(135deg, #6366f1, #a855f7)")
  const [saving, setSaving] = useState(false)
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  const isOwnProfile = currentUserId && profileUser?._id
    ? String(currentUserId) === String(profileUser._id) || String(currentUserId) === String(profileId)
    : false

  const formatWhatsAppUrl = (phone) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/\D/g, ''); 
    return `https://wa.me/${cleanNumber}`;
  };

  const toggleLocationSharing = async () => {
    const newState = !isSharingLocation;
    setIsSharingLocation(newState);

    try {
      if (newState) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await fetch(`/api/users/update-location`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              isSharingLocation: true, 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            })
          });
        }, (err) => {
          console.error(err);
          setIsSharingLocation(false);
          alert("Please enable location permissions.");
        });
      } else {
        await fetch(`/api/users/update-location`, {
          method: 'PATCH',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSharingLocation: false })
        });
      }
    } catch (err) {
      setIsSharingLocation(!newState);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return;
      
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
        setIsSharingLocation(userData.isSharingLocation || false)
        setEditName(userData.name || "")
        setEditUsername(userData.username || "")
        setEditBio(userData.bio || "")
        setEditPhone(userData.primaryPhone || "")
        setEditTwitter(userData.twitter || "")
        setEditInstagram(userData.Instagram || "")
        setEditBannerGradient(userData.bannerGradient || "linear-gradient(135deg, #6366f1, #a855f7)")

        if (postsRes.ok) setUserPosts(await postsRes.json())
        
        if (followRes.ok) {
          const followersData = await followRes.json()
          setFollowers(followersData)
          if (currentUserId) {
            setIsFollowing(followersData.some(f => String(f._id) === String(currentUserId)))
          }
        }
        if (followingRes.ok) setFollowing(await followingRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (status !== "loading" && profileId) {
      fetchProfileData()
    }
  }, [profileId, currentUserId, status])

  const handleFollowToggle = async () => {
    if (!currentUserId) return alert("Please log in to follow users.")
    const method = isFollowing ? "DELETE" : "POST"
    try {
      const res = await fetch(`/api/users/${profileUser._id}/follow`, { method })
      if (res.ok) {
        if (isFollowing) {
          setFollowers(prev => prev.filter(u => String(u._id) !== String(currentUserId)))
          setIsFollowing(false)
        } else {
          setFollowers(prev => [...prev, { _id: currentUserId, name: session?.user?.name }])
          setIsFollowing(true)
        }
      }
    } catch (err) {
      console.error("Error updating relationship logic:", err)
    }
  }

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
        bio: editBio,
        primaryPhone: editPhone,
        ...(profileUser?.isPremium && {
          username: editUsername,
          twitter: editTwitter,
          Instagram: editInstagram,
          bannerGradient: editBannerGradient
        })
      }
      const res = await fetch(`/api/users/${profileUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setProfileUser(await res.json())
        setIsSettingsOpen(false)
      }
    } catch (err) {
      alert("Error updating profile.")
    } finally {
      setSaving(false)
    }
  }

const handleAvatarUploaded = async (url) => {
  setIsAvatarUpdating(true)
  try {
    const res = await fetch(`/api/users/${profileUser._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePicture: url })
    })
    if (res.ok) {
      const updatedUser = await res.json()
      setProfileUser(updatedUser)
      await update({
        ...session,
        user: {
          ...session?.user,
          image: url 
        }
      })
    }
  } catch (err) {
    console.error("Error saving updated profile avatar:", err)
  } finally {
    setIsAvatarUpdating(false)
  }
}

  const filteredPosts = useMemo(() => {
    return userPosts.filter(post => 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [userPosts, searchQuery])

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
        <div className={styles.emptyState} style={{ padding: '4rem 2rem' }}>
          <p>Error loading profile: {error}</p>
          <Link href="/dashboard" className={styles.createBtn}>Return to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        
        <div className={styles.profileCard}>
          <div 
            className={styles.profileBanner} 
            style={{ background: profileUser?.isPremium ? (profileUser.bannerGradient || editBannerGradient) : '#1c2c35' }}
          />
          
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainerRelative}>
              <div className={`${styles.avatarPlaceholder} ${profileUser?.isPremium ? styles.premiumAvatarRing : ''}`}>
                {profileUser?.profilePicture ? (
                  <img src={profileUser.profilePicture} alt={profileUser.name} className={styles.avatarImage} />
                ) : (
                  profileUser?.name?.charAt(0).toUpperCase()
                )}
              </div>
              
              {isAvatarUpdating && (
                <div className={styles.avatarLoadingOverlay}>
                  <Loader2 className={styles.avatarSpinner} />
                </div>
              )}

              {isOwnProfile && (
                <div className={styles.editIconBadge}>
                  <Pencil size={14} />
                  <UploadButton
                    endpoint="profilePicture"
                    onUploadProgress={() => setIsAvatarUpdating(true)}
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) {
                        handleAvatarUploaded(res[0].url)
                      }
                    }}
                    onUploadError={(error) => {
                      setIsAvatarUpdating(false)
                      alert(`Upload error: ${error.message}`)
                    }}
                    appearance={{
                      button: styles.invisibleUploadButton,
                      allowedContent: styles.hiddenAllowedContent
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className={styles.metaInfo}>
              <div className={styles.titleRow}>
                <h1 className={styles.username}>
                  {profileUser?.name} {profileUser?.isPremium && <span className={styles.premiumBadge}>PREMIUM</span>}
                </h1>
                {isOwnProfile && (
                  <button onClick={() => setIsSettingsOpen(true)} className={styles.settingsIconButton} title="Settings">
                    <Settings size={22} />
                  </button>
                )}
              </div>
              <p className={styles.userEmail}>@{profileUser?.username}</p>

              {profileUser?.bio && <p className={styles.bioDisplay}>{profileUser.bio}</p>}
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                
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

              <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
                {isOwnProfile && <button onClick={toggleLocationSharing} className={isSharingLocation ? styles.stopLocationBtn : styles.shareLocationBtn}>{isSharingLocation ? "Stop Live Location" : "Share Live Location"}</button>}
                {isOwnProfile && <button className={styles.logoutBtn} onClick={() => signOut()}>Logout</button>}
                
                {!isOwnProfile && (
                  <>
                    <button 
                      onClick={handleFollowToggle} 
                      className={isFollowing ? styles.unfollowBtn : styles.followBtn}
                    >
                      {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow User</>}
                    </button>
                    <MessageButton recipientId={profileUser?._id} recipientName={profileUser?.name} />
                  </>
                )}
              </div>
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

        {isSettingsOpen && (
          <div className={styles.fullScreenSettings}>
            <div className={styles.settingsHeader}>
              <h2>Settings & Account Configuration</h2>
              <button className={styles.closeSettingsButton} onClick={() => setIsSettingsOpen(false)}>
                <X size={26} />
              </button>
            </div>

            <div className={styles.settingsLayoutBody}>
              <div className={styles.settingsSectionColumn}>
                <h3 className={styles.settingsPanelTitle}>Edit Profile Data</h3>
                <form className={styles.editForm} onSubmit={handleSaveChanges}>
                  <label className={styles.inputLabel}>Name</label>
                  <input className={styles.dashboardInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  
                  <label className={styles.inputLabel}>About Me (Bio)</label>
                  <textarea className={styles.dashboardTextarea} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell others about yourself or your writing..." />

                  <label className={styles.inputLabel}>Phone Number</label>
                  <input className={styles.dashboardInput} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  
                  {profileUser?.isPremium && (
                    <>
                      <label className={styles.inputLabel}>Username Handle</label>
                      <input className={styles.dashboardInput} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                      <label className={styles.inputLabel}>Twitter</label>
                      <input className={styles.dashboardInput} value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} />
                      <label className={styles.inputLabel}>Instagram</label>
                      <input className={styles.dashboardInput} value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
                      
                      <label className={styles.inputLabel}>Choose Cover Profile Theme</label>
                      <select className={styles.dashboardSelect} value={editBannerGradient} onChange={(e) => setEditBannerGradient(e.target.value)}>
                        <option value="linear-gradient(135deg, #6366f1, #a855f7)">Neon Twilight (Purple/Indigo)</option>
                        <option value="linear-gradient(135deg, #00b4db, #0083b0)">Ocean Deep (Blue/Cyan)</option>
                        <option value="linear-gradient(135deg, #11998e, #38ef7d)">Emerald Glow (Teal/Green)</option>
                        <option value="linear-gradient(135deg, #ff416c, #ff4b2b)">Sunset Blaze (Pink/Orange)</option>
                      </select>
                    </>
                  )}
                  <button type="submit" className={styles.editBtn} disabled={saving} style={{ marginTop: "1rem", width: "100%" }}>
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </form>
              </div>

              <div className={styles.settingsSectionColumn}>
                <h3 className={styles.settingsPanelTitle}><CreditCard size={18} style={{ marginRight: '6px' }} /> Premium Membership</h3>
                <div className={styles.subscriptionContainer}>
                  <div className={`${styles.planCard} ${profileUser?.isPremium ? styles.activePlan : ''}`}>
                    <h4>Prime Access Pass</h4>
                    <p className={styles.planPrice}>Ksh 49 / month</p>
                    <ul className={styles.planFeaturesList}>
                      <li>Unlock Custom App Handles (@username)</li>
                      <li>Custom Dynamic Cover Banner Profiles</li>
                      <li>Direct WhatsApp Synchronization links</li>
                      <li>Encrypted Live Location Broadcast Channels</li>
                    </ul>
                    <button className={styles.planActionBtn} disabled={profileUser?.isPremium}>
                      {profileUser?.isPremium ? "Active Subscription" : "Upgrade to Premium"}
                    </button>
                  </div>
                </div>

                <h3 className={styles.settingsPanelTitle} style={{ marginTop: '2rem' }}><ShieldAlert size={18} style={{ marginRight: '6px' }} /> Privacy & Data Policy</h3>
                <div className={styles.privacyPolicyDocBox}>
                  <h4>1. Data Processing Metrics</h4>
                  <p>We temporarily process your location coordinates only while you are actively using the "Live Location" feature. This data is transmitted instantly across secure channels to update your map layouts in real-time. It is never permanently stored on our servers.</p>
                  <h4>2. System Communications</h4>
                  <p>Account verification protocols and contact integrations via physical phone inputs are stored securely under standard document data encryption layers.</p>
                </div>

                <h3 className={styles.settingsPanelTitle} style={{ marginTop: '2rem' }}><LifeBuoy size={18} style={{ marginRight: '6px' }} /> Help & Support</h3>
                <div className={styles.supportBox}>
                  <p>Encountering technical issues with your real-time connections, or want to report a vulnerability? Reach out directly to our engineering desk.</p>
                  <a href="mailto:authurbass@gmail.com" className={styles.supportLink}>Contact Technical Support</a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.contentSection}>
          <div className={styles.contentHeaderArea}>
            <h2 className={styles.sectionTitle}>
              {isOwnProfile ? "Your Recent Articles" : `Articles by ${profileUser?.name}`}
            </h2>
            {userPosts.length > 0 && (
              <div className={styles.searchBarContainer}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search articles by title or keyword..." 
                  className={styles.articleSearchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {userPosts.length === 0 
                  ? (isOwnProfile ? "You haven't written any blog posts yet." : "This user hasn't written any blog posts yet.")
                  : "No articles match your search parameters."
                }
              </p>
              {isOwnProfile && userPosts.length === 0 && <Link href="/dashboard" className={styles.createBtn}>Create Your First Post</Link>}
            </div>
          ) : (
            <div className={styles.postsGrid}>
              {filteredPosts.map((post) => (
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

export default UserProfile;