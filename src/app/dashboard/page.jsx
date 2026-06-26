"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from "./dashboard.module.css";
import Navbar from '../components/navbar/navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadButton } from "@uploadthing/react";
import { Bold, Italic, Heading1 } from 'lucide-react';

const CATEGORY_OPTIONS = ["Sports", "Beauty", "Tech", "Lifestyle", "Finance", "Education"];

const DashboardPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const abortControllerRef = useRef(null);
    const textareaRef = useRef(null);

    const [view, setView] = useState("published");
    const [formData, setFormData] = useState({ 
        title: "", description: "", content: "", id: "", imageUrl: "", category: "", tags: "" 
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    const getData = useCallback(async () => {
        if (!userId) return;
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setLoading(true);
        try {
            const endpoint = view === "bookmarks" 
                ? `/api/posts/bookmarks?userId=${userId}` 
                : `/api/posts?userId=${userId}&status=${view}`;
            const res = await fetch(endpoint, { signal: abortControllerRef.current.signal });
            const json = await res.json();
            setData(Array.isArray(json) ? json : (json.posts || []));
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, view]);

    useEffect(() => {
        getData();
        return () => abortControllerRef.current?.abort();
    }, [getData]);

    const handleInsert = (prefix, suffix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
        setFormData({...formData, content: newText});
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handlePublish = async (postId) => {
        const res = await fetch(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "published" })
        });
        if (res.ok) getData();
    };

    const handleAction = async (e) => {
        e.preventDefault();
        const postStatus = view === "draft" ? "draft" : "published";
        const isEditing = !!formData.id;
        
        const payload = { 
            ...formData, 
            tags: formData.tags && typeof formData.tags === 'string' 
                ? formData.tags.split(',').map(t => t.trim()) 
                : formData.tags,
            userId, 
            name: session?.user?.name, 
            status: postStatus 
        };

        const endpoint = isEditing ? `/api/posts/${formData.id}` : '/api/posts';

        const res = await fetch(endpoint, {
            method: isEditing ? 'PATCH' : 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setFormData({ title: "", description: "", content: "", id: "", imageUrl: "", category: "", tags: "" });
            getData(); 
        }
    };

    const handleDelete = async (postId) => {
        const previousData = [...data];
        setData(prev => prev.filter(p => p._id !== postId));
        const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
        if (!res.ok) setData(previousData);
    };

    if (status === "loading") return <div className={styles.container}>Loading Session...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.wrapper}>
                <div className={styles.posts}>
                    <div className={styles.dashboardTabs}>
                        {["published", "draft", "bookmarks"].map(tab => (
                            <button key={tab} onClick={() => setView(tab)} className={view === tab ? styles.active : ""}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <h1>{view.toUpperCase()}</h1>
                    <div className={styles.scroll}>
                        {loading ? <p>Loading...</p> : data.length > 0 ? data.map(item => (
                            <div key={item._id} className={styles.post}>
                                <Link href={`/blogs/${item._id}`}><h2>{item.title}</h2></Link>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {view === "draft" && (
                                        <button className={styles.btn} onClick={() => handlePublish(item._id)}>Publish</button>
                                    )}
                                    {view === "draft" && (
                                        <button 
                                            className={styles.btn} 
                                            onClick={() => setFormData({
                                                ...item, 
                                                id: item._id, 
                                                tags: item.tags?.join(", ")
                                            })}
                                        >Edit</button>
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
                        <form onSubmit={handleAction}>
                            <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={(res) => setFormData({ ...formData, imageUrl: res[0].ufsUrl })}
                                onUploadError={(error) => alert(`Error: ${error.message}`)}
                            />
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" style={{width: '100px', borderRadius: '8px'}} />}
                            
                            <input className={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" required />
                            <input className={styles.input} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" required />
                            
                            <select className={styles.select} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                                <option value="" disabled>Select a Category</option>
                                {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            </select>

                            <input className={styles.input} value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Tags (comma separated)" />
                            
                            <div className={styles.toolbar}>
                                <button type="button" className={styles.btn} onClick={() => handleInsert("**", "**")}><Bold size={16} /></button>
                                <button type="button" className={styles.btn} onClick={() => handleInsert("*", "*")}><Italic size={16} /></button>
                                <button type="button" className={styles.btn} onClick={() => handleInsert("# ", "")}><Heading1 size={16} /></button>
                            </div>

                            <textarea ref={textareaRef} className={styles.textarea} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Content" required></textarea>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className={styles.button} type='submit'>{formData.id ? "Update" : (view === "draft" ? "Save Draft" : "Publish")}</button>
                                {formData.id && <button type="button" className={styles.button} style={{background: '#475569'}} onClick={() => setFormData({ title: "", description: "", content: "", id: "", imageUrl: "", category: "", tags: "" })}>Cancel</button>}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;