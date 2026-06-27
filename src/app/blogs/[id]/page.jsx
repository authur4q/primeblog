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
import { Heart, Bookmark, Play, Pause, CornerDownRight, ChevronDown } from 'lucide-react';

const CommentItem = ({ comment, session, handleCommentDelete, setReplyingTo }) => (
  <div className={styles.commentCard}>
    <div className={styles.commentHeader}>
      <Link href={`/profile/${comment.user?._id || comment.user}`} className={styles.avatarLink}>
        <div className={styles.avatar}>{comment.user?.name?.charAt(0).toUpperCase() || "A"}</div>
        <div className={styles.avatarName}>{comment.user?.name || "User"}</div>
      </Link>
      {session?.user?.id && (comment.user?._id === session.user.id || comment.user === session.user.id) && (
        <button onClick={() => handleCommentDelete(comment._id)} className={styles.deleteBtn}>✕</button>
      )}
    </div>
    <p className={styles.commentText}>{comment.text}</p>
    <button onClick={() => setReplyingTo(comment)} className={styles.replyLink}>
      <CornerDownRight size={14} /> Reply
    </button>
    
    {comment.replies && comment.replies.length > 0 && (
      <div className={styles.repliesContainer}>
        {comment.replies.map((reply) => (
          <CommentItem 
            key={reply._id} 
            comment={reply} 
            session={session} 
            handleCommentDelete={handleCommentDelete}
            setReplyingTo={setReplyingTo}
          />
        ))}
      </div>
    )}
  </div>
);

const BlogPost = () => {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|#\w+)/g);
      return (
        <p key={index} style={{ marginBottom: '1rem' }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
            if (part.startsWith('#')) return <Link key={i} href={`/search?q=${part.slice(1)}`} style={{ color: '#6366f1', textDecoration: 'none' }}>{part}</Link>;
            return part;
          })}
        </p>
      );
    });
  };

  const buildTree = (flatComments) => {
    const map = {};
    const roots = [];
    flatComments.forEach(c => { map[c._id] = { ...c, replies: [] }; });
    flatComments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    return roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

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
    } catch (err) { console.error("Failed to fetch post:", err); }
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
    } catch (err) { setData((prev) => ({ ...prev, likes: previousLikes })); }
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
      body: JSON.stringify({ text: commentText, postId: id, userId: session.user.id, parentId: replyingTo?._id || null }),
    });
    if (res.ok) {
      getData();
      setCommentText("");
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleCommentDelete = async (commentId) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/comments?id=${commentId}&userId=${session.user.id}`, { method: 'DELETE' });
    if (res.ok) getData();
  };

  const commentTree = buildTree(comments);

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
                  <>
                    <div className={styles.postImageWrapper} onClick={() => setIsExpanded(true)}>
                      <Image 
                        src={data.imageUrl} 
                        alt={data.title} 
                        fill 
                        priority 
                        className={styles.postImage} 
                        style={{ objectFit: 'contain' }} 
                        sizes="(max-width: 800px) 100vw, 800px" 
                      />
                    </div>
                    {isExpanded && (
                      <div className={styles.fullscreenOverlay} onClick={() => setIsExpanded(false)}>
                        <img src={data.imageUrl} alt="Expanded view" className={styles.fullscreenImage} />
                      </div>
                    )}
                  </>
                )}
                <span className={styles.authorTag}>Published by: <strong>@{data.name || "Anonymous"}</strong></span>
              </div>
              <div className={styles.metaRight}>
                {session?.user?.id && (
                  <button onClick={handleLike} className={`${styles.likeBtn} ${data.likes?.includes(session.user.id) ? styles.liked : ""}`}>
                    <Heart size={20} fill={data.likes?.includes(session.user.id) ? "currentColor" : "none"} />
                    <span>{data.likes?.length || 0}</span>
                  </button>
                )}
                {session?.user?.id && (
                  <button onClick={toggleBookmark} className={styles.bookmarkBtn}>
                    <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                  </button>
                )}
                {session?.user?.id && data.userId && session.user.id !== data.userId && (
                  <MessageButton recipientId={data.userId} recipientName={data.name} />
                )}
              </div>
            </div>

{session?.user?.isPremium && (
  <div className={styles.audioNarratorCard}>
    <h4 className={styles.audioNarratorHeader}>Listen Hand-Free with Prime Voice Narrator</h4>
    
    <button onClick={handleSpeechControl} className={styles.audioBtnSimple}>
    
      {isPlaying && !isPaused ? (
        <div className={styles.waveContainer}>
          <div className={styles.waveBar} />
          <div className={styles.waveBar} />
          <div className={styles.waveBar} />
          <div className={styles.waveBar} />
        </div>
      ) : (
        isPlaying && isPaused ? <Pause size={20} /> : <Play size={20} />
      )}
      
      <span>
        {isPlaying ? (isPaused ? "Resuming..." : "Playing") : "Listen with Voice Narrator"}
      </span>
    </button>
  </div>
)}

            <div className={styles.content}>{formatContent(data.content)}</div>
            <hr className={styles.divider} />
            <div className={styles.commentsSection}>
              <h3>{comments.length} Comments</h3>
              {status === "authenticated" ? (
                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                  {replyingTo && <p className={styles.replyingTo}>Replying to {replyingTo.user?.name || "user"}: <button type="button" onClick={() => setReplyingTo(null)}>Cancel</button></p>}
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows="4" className={styles.textarea} disabled={isSubmitting} />
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>{isSubmitting ? "Posting..." : "Post Comment"}</button>
                </form>
              ) : <p className={styles.loginPrompt}>Please log in to share your thoughts.</p>}
              
              <div className={styles.commentsList}>
                {commentTree.slice(0, visibleCommentsCount).map(rootComment => (
                  <CommentItem key={rootComment._id} comment={rootComment} session={session} handleCommentDelete={handleCommentDelete} setReplyingTo={setReplyingTo} />
                ))}
                {visibleCommentsCount < commentTree.length && (
                  <button onClick={() => setVisibleCommentsCount(prev => prev + 5)} className={styles.loadMoreBtn}>
                    <ChevronDown size={18} /> Load More Comments
                  </button>
                )}
              </div>
            </div>
          </>
        ) : <Loading />}
      </div>
    </div>
  );
};

export default BlogPost;