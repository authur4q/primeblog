"use client"
import React, { useEffect, useState } from 'react'
import styles from "./id.module.css"
import Navbar from '@/app/components/navbar/navbar'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Loading from '@/app/components/loading/page'
import Link from 'next/link'
import MessageButton from '../../components/messageButton/page'

const BlogPost = () => {
  const { data: session, status } = useSession()
  const { id } = useParams()
  const [data, setData] = useState()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const res = await fetch(`/api/posts/${id}`)
      const json = await res.json()
      setData(json)
      if (session?.user?.id && json.bookmarkedBy) {
        setIsBookmarked(json.bookmarkedBy.includes(session.user.id))
      }
    }

    const getComments = async () => {
      const res = await fetch(`/api/comments?postId=${id}`)
      const json = await res.json()
      setComments(json)
    }

    if (id) {
      getData()
      getComments()
    }
  }, [id, session?.user?.id])

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const toggleBookmark = async () => {
    const res = await fetch(`/api/posts/${id}/bookmarks`, { method: "PATCH" })
    if (res.ok) {
      setIsBookmarked(!isBookmarked)
    }
  }

  const handleSpeechControl = () => {
    if (!data?.content) return
    const synth = window.speechSynthesis
    if (!isPlaying) {
      const cleanText = data.content.replace(/```[\s\S]*?```/g, "[Code Fragment]")
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.onend = () => { setIsPlaying(false); setIsPaused(false) }
      setIsPlaying(true)
      setIsPaused(false)
      synth.speak(utterance)
    } else {
      if (!isPaused) { synth.pause(); setIsPaused(true) }
      else { synth.resume(); setIsPaused(false) }
    }
  }

  const handleStopSpeech = () => {
    window.speechSynthesis?.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !session?.user?.id) return
    setIsSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText, postId: id, userId: session.user.id }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setComments((prev) => [{ ...newComment, user: { _id: session.user.id, name: session.user.name } }, ...prev])
      setCommentText("")
    }
    setIsSubmitting(false)
  }

  const handleCommentDelete = async (commentId) => {
    if (!confirm("Are you sure?")) return
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments((prev) => prev.filter((c) => c._id !== commentId))
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        {data ? (
          <>
            <div className={styles.metaRow}>
              <div className={styles.metaLeft}>
                <h1 className={styles.title}>{data.title}</h1>
                <h2 className={styles.description}>{data.description}</h2>
                <p className={styles.authorTag}>Published by: <strong>@{data.name || "Anonymous"}</strong></p>
              </div>
              
              <div className={styles.metaRight}>
                {session?.user?.id && (
                  <button onClick={toggleBookmark} className={styles.bookmarkBtn}>
                    {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                  </button>
                )}
                {session?.user?.id && data.userId && session.user.id !== data.userId && (
                  <MessageButton recipientId={data.userId} recipientName={data.name} />
                )}
              </div>
            </div>

            {session?.user?.isPremium && (
              <div className={styles.audioNarratorCard}>
                <div className={styles.audioMeta}>
                  <span className={styles.audioWaveIcon}>🔊</span>
                  <div>
                    <h4 className={styles.audioTitle}>Prime Voice Narrator</h4>
                    <p className={styles.audioStatus}>
                      {isPlaying ? (isPaused ? "Paused" : "Speaking...") : "Listen hands-free"}
                    </p>
                  </div>
                </div>
                <div className={styles.audioActionControls}>
                  <button onClick={handleSpeechControl} className={styles.audioBtnPrimary}>
                    {isPlaying ? (isPaused ? "Resume" : "Pause") : "Play Audio"}
                  </button>
                  {isPlaying && <button onClick={handleStopSpeech} className={styles.audioBtnSecondary}>Stop</button>}
                </div>
              </div>
            )}

            <p className={styles.content}>{data.content}</p>
            <hr className={styles.divider} />

            <div className={styles.commentsSection}>
              <h3>{comments.length} Comments</h3>
              {status === "authenticated" ? (
                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows="4" className={styles.textarea} disabled={isSubmitting} />
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>{isSubmitting ? "Posting..." : "Post Comment"}</button>
                </form>
              ) : (
                <p className={styles.loginPrompt}>Please log in to share your thoughts.</p>
              )}

              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment._id} className={styles.commentCard}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commenterMeta}>
                        <Link href={`/profile/${comment.user?._id || comment.user}`} className={styles.avatarLink}>
                          <div className={styles.avatar}>{comment.user?.name?.charAt(0).toUpperCase() || "A"}</div>
                        </Link>
                        <Link href={`/profile/${comment.user?._id || comment.user}`} className={styles.commenterName}>
                          @{comment.user?.name || "Anonymous"}
                        </Link>
                      </div>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        {session?.user?.id && (comment.user?._id === session.user.id || comment.user === session.user.id) && (
                          <button onClick={() => handleCommentDelete(comment._id)} className={styles.deleteBtn}>✕</button>
                        )}
                      </div>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}

export default BlogPost