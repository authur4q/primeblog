"use client"
import React, { useEffect, useState } from 'react'
import styles from "./dashboard.module.css"
import Navbar from '../components/navbar/page'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DashboardPage = () => {
    const router = useRouter()
    const { data: session, status } = useSession()
    const name = session?.user?.name
    const userId = session?.user?.id

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
    })
    const [data, setData] = useState([])
    const [error, setError] = useState(null)

    
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            console.log("Logged User:")
        }
    }, [session, status])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    useEffect(() => {
        const getData = async () => {
            try {
                const res = await fetch(`/api/posts?userId=${encodeURIComponent(userId)}`)
                const json = await res.json()
              
                if (res.ok && Array.isArray(json)) {
                    setData(json)
                } else {
                    console.error('Failed to load posts', json)
                    setData([])
                }
            } catch (err) {
                console.error('Error fetching posts:', err)
                setData([])
            }
        }

        if (userId) getData()
    }, [userId])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleOnSubmit = async (e) => {
        e.preventDefault()
        const { title, description, content } = formData

        
        if (!title || !description || !content || !userId || !name) {
            setError("All fields are required. Please verify you are logged in.")
            return
        }

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description, content, userId , name})
            })

            if (res.ok) {
                setFormData({ title: "", description: "", content: "" })
                setError(null)
                router.push("/blogs")
            } else {
                setError('Failed to create post')
            }
        } catch (err) {
            console.error(err)
            setError('Network error')
        }
    }

    const handleDelete = async (postId) => {
        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                setData(prevData => prevData.filter(item => item._id !== postId))
            }
        } catch (err) {
            console.error('Error deleting post:', err)
        }
    }

    if (status === "loading") {
        return <div className={styles.container}>Loading...</div>
    }

    if (status === "authenticated") {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.wrapper}>
                    <div className={styles.form}>
                        <h1>Create New Post</h1>
                        {error && <p style={{color: 'salmon', marginTop: 8}}>{error}</p>}
                        <form onSubmit={handleOnSubmit}>
                            <input 
                                className={styles.input} 
                                name="title"
                                value={formData.title} 
                                onChange={handleInputChange} 
                                required 
                                type="text" 
                                placeholder='Title' 
                            />
                            <input 
                                className={styles.input} 
                                name="description"
                                value={formData.description} 
                                onChange={handleInputChange} 
                                type="text" 
                                placeholder='Description' 
                            />
                            <textarea 
                                className={styles.textarea} 
                                name="content"
                                value={formData.content} 
                                onChange={handleInputChange} 
                                required 
                                placeholder='Content'
                            ></textarea>
                            <button className={styles.button} type='submit'>Create Post</button>
                        </form>
                    </div>
                    <div className={styles.posts}> 
                        <div className={styles.scroll}>
                            {data.length > 0 ? (
                                data.map(item => (
                                    <div key={item._id} className={styles.post}>
                                        <Link href={`/blogs/${item._id}`}>
                                            <h2>{item.title}</h2>
                                        </Link>
                                        <button className={styles.btn} onClick={() => handleDelete(item._id)}>Delete</button>
                                    </div>
                                ))
                            ) : (
                                <h2 className={styles.nopost}>You haven't posted yet...</h2>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export default DashboardPage