"use client";
import React, { useEffect, useState, useCallback } from 'react';
import styles from "./id.module.css";
import Navbar from '@/app/components/navbar/navbar';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loading from '@/app/components/loading/page';
import Link from 'next/link';
import Image from 'next/image';
import MessageButton from '../../components/messageButton/page';

const BlogPost = () => {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const getData = useCallback(async () => {
    if (!id) return;
    try {
      const [postRes, commentRes] = await Promise.all([
        fetch(`/api/posts/${id}?t=${Date.now()}`),
        fetch(`/api/comments?postId=${id}`)
      ]);
      const json = await postRes.json();
      const commentJson = await commentRes.json();
      setData(json);
      setComments(commentJson);
      if (session?.user?.id && json.bookmarkedBy) {
        setIsBookmarked(json.bookmarkedBy.includes(session.user.id));
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
    }
  }, [id, session?.user?.id]);

  useEffect(() => {
    getData();
    return () => { window.speechSynthesis?.cancel() };
  }, [getData]);

  const toggleBookmark = async () => {
    const res = await fetch(`/api/posts/${id}/bookmarks`, { method: "PATCH" });
    if (res.ok) setIsBookmarked(!isBookmarked);
  };

  const handleLike = async () => {
    if (!session?.user?.id || !data) return;
    const previousLikes = Array.isArray(data.likes) ? data.likes : [];
    const isCurrentlyLiked = previousLikes.includes(session.user.id);
    const updatedLikes = isCurrentlyLiked
      ? previousLikes.filter((uid) => uid !== session.user.id)
      : [...previousLikes, session.user.id];
    setData((prev) => ({ ...prev, likes: updatedLikes }));
    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, userId: session.user.id, action: isCurrentlyLiked ? 'unlike' : 'like' }),
      });
      if (!res.ok) throw new Error("Update failed");
      const result = await res.json();
      if (result?.likes) setData((prev) => ({ ...prev, likes: result.likes }));
    } catch (err) {
      setData((prev) => ({ ...prev, likes: previousLikes }));
    }
  };

  const handleSpeechControl = () => {
    if (!data?.content) return;
    const synth = window.speechSynthesis;
    if (!isPlaying) {
      const cleanText = data.content.replace(/```[\s\S]*?```/g, "[Code Fragment]");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
      setIsPlaying(true);
      setIsPaused(false);
      synth.speak(utterance);
    } else {
      if (!isPaused) { synth.pause(); setIsPaused(true); }
      else { synth.resume(); setIsPaused(false); }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !session?.user?.id) return;
    setIsSubmitting(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText, postId: id, userId: session.user.id }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [{ ...newComment, user: { _id: session.user.id, name: session.user.name } }, ...prev]);
      setCommentText("");
    }
    setIsSubmitting(false);
  };

  const handleCommentDelete = async (commentId) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
    if (res.ok) setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgImage}></div>
      <Navbar />
      <div className={styles.wrapper}>
        {data ? (
          <>
            <div className={styles.metaRow}>
              <div className={styles.metaLeft}>
                <h1 className={styles.title}>{data.title}</h1>
                <h2 className={styles.description}>{data.description}</h2>
                {data.imageUrl && (
                  <div className={styles.postImageWrapper}>
                    <Image src={data.imageUrl} alt={data.title} fill priority className={styles.postImage} style={{ objectFit: 'cover' }} sizes="(max-width: 800px) 100vw, 800px" />
                  </div>
                )}
                <span className={styles.authorTag}>Published by: <strong>@{data.name || "Anonymous"}</strong></span>
              </div>
              <div className={styles.metaRight}>
                {session?.user?.id && (
                  <button onClick={handleLike} className={`${styles.likeBtn} ${data.likes?.includes(session.user.id) ? styles.liked : ""}`}>
                    {data.likes?.includes(session.user.id) ? "❤️" : "🤍"} {data.likes?.length || 0}
                  </button>
                )}
                {session?.user?.id && (
                  <button onClick={toggleBookmark} className={styles.bookmarkBtn}>
                    {isBookmarked ? "★" : "☆"}
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
                  <span>🔊</span>
                  <div>
                    <h4 className={styles.audioTitle}>Prime Voice Narrator</h4>
                    <p className={styles.audioStatus}>{isPlaying ? (isPaused ? "Paused" : "Speaking...") : "Listen hands-free"}</p>
                  </div>
                </div>
                <button onClick={handleSpeechControl} className={styles.audioBtnPrimary}>{isPlaying ? (isPaused ? "Resume" : "Pause") : "Play Audio"}</button>
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
              ) : <p className={styles.loginPrompt}>Please log in to share your thoughts.</p>}
              
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment._id} className={styles.commentCard}>
                    <div className={styles.commentHeader}>
                      <Link href={`/profile/${comment.user?._id || comment.user}`} className={styles.avatarLink}>
                        <div className={styles.avatar}>{comment.user?.name?.charAt(0).toUpperCase() || "A"} </div>
                        <div className={styles.avatarName}>{comment.user?.name || "User"} </div>
                      </Link>
                      {session?.user?.id && (comment.user?._id === session.user.id || comment.user === session.user.id) && (
                        <button onClick={() => handleCommentDelete(comment._id)} className={styles.deleteBtn}>✕</button>
                      )}
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : <Loading />}
      </div>
    </div>
  );
};

export default BlogPost;