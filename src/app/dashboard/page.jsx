"use client";
import React, { useEffect, useState, useCallback } from 'react';
import styles from "./dashboard.module.css";
import Navbar from '../components/navbar/navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DashboardPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const [view, setView] = useState("published");
    const [formData, setFormData] = useState({ title: "", description: "", content: "", id: "" });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    const getData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const endpoint = view === "bookmarks" 
                ? `/api/posts/bookmarks?userId=${userId}` 
                : `/api/posts?userId=${userId}&status=${view}`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            const result = Array.isArray(json) ? json : (json.posts || json.data || []);
            setData(result);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [userId, view]);

    useEffect(() => {
        getData();
    }, [getData]);

    const handleEdit = (post) => {
        setFormData({
            title: post.title,
            description: post.description,
            content: post.content,
            id: post._id
        });
    };

    const handleAction = async (e, actionType) => {
        e.preventDefault();
        const postStatus = actionType === "save" ? "draft" : "published";
        const isEditing = !!formData.id;
        
        const res = await fetch(isEditing ? `/api/posts/${formData.id}` : '/api/posts', {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, userId, name: session?.user?.name, status: postStatus })
        });

        if (res.ok) {
            setFormData({ title: "", description: "", content: "", id: "" });
            setView(postStatus);
            getData(); 
        }
    };

    const handleDelete = async (postId) => {
        const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
        if (res.ok) getData(); 
    };

    if (status === "loading") return <div className={styles.container}>Loading Session...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.wrapper}>
                <div className={styles.posts}>
                    <div className={styles.dashboardTabs}>
                        <button onClick={() => setView("published")}>Posts</button>
                        <button onClick={() => setView("draft")}>Drafts</button>
                        <button onClick={() => setView("bookmarks")}>Bookmarks</button>
                    </div>
                    <h1>{view.toUpperCase()}</h1>
                    <div className={styles.scroll}>
                        {loading ? <p>Loading...</p> : data.length > 0 ? data.map(item => (
                            <div key={item._id} className={styles.post}>
                                <Link href={`/blogs/${item._id}`}><h2>{item.title}</h2></Link>
                                <div style={{ display: 'flex', gap: '5px' }}>
                            
                                    {view === "draft" && (
                                        <button className={styles.btn} onClick={() => handleEdit(item)}>Edit</button>
                                    )}
                                    <button className={styles.btn} onClick={() => handleDelete(item._id)}>Delete</button>
                                </div>
                            </div>
                        )) : <p className={styles.nopost}>No {view} found.</p>}
                    </div>
                </div>

                {view !== "bookmarks" && (
                    <div className={styles.form}>
                        <h1>{formData.id ? "Edit Post" : "Create Post"}</h1>
                        <form onSubmit={(e) => handleAction(e, view === "draft" ? "save" : "publish")}>
                            <input className={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" required />
                            <input className={styles.input} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" required />
                            <textarea className={styles.textarea} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Content" required></textarea>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className={styles.button} type='submit'>
                                    {formData.id ? "Update" : (view === "draft" ? "Save Draft" : "Publish")}
                                </button>
                                {formData.id && (
                                    <button type="button" className={styles.button} style={{background: '#475569'}} onClick={() => setFormData({ title: "", description: "", content: "", id: "" })}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;