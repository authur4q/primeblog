"use client"
import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Navbar from '@/app/components/navbar/page'
import Link from 'next/link'
import styles from './profile.module.css'

const UserProfile = ({ params: paramsPromise }) => {
  const params = React.use(paramsPromise)
  const profileId = params.id

  const { data: session, status } = useSession()
  const currentUserId = session?.user?.id

  const [profileUser, setProfileUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
              <h1 className={styles.username}>{profileUser?.name}</h1>
              <p className={styles.userEmail}>
                {isOwnProfile ? profileUser?.email : "Contact information hidden"}
              </p>
              <span className={styles.badge}>Author / Member</span>
              
              {isOwnProfile && (
                <button
                  className={styles.logoutBtn}
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  aria-label="Sign out"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout Account
                </button>
              )}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{userPosts.length}</span>
              <span className={styles.statLabel}>Stories Published</span>
            </div>
            {isOwnProfile && (
              <div className={styles.statBox}>
                <span className={styles.statNumber}>
                  {session?.expires 
                    ? new Date(session.expires).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : "N/A"
                  }
                </span>
                <span className={styles.statLabel}>Session Reset Token</span>
              </div>
            )}
          </div>
        </div>

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