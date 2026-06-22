"use client";
import React, { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso'; 
import Navbar from '../components/navbar/navbar';
import styles from "./blogs.module.css";
import Link from 'next/link';
import Image from 'next/image'; 
import { format, parseISO } from 'date-fns';

const Blogs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const commonCategories = ["All", "Sports", "Beauty", "Tech", "Lifestyle", "Finance", "Education"];

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/posts");
        if (!res.ok) throw new Error("Failed to fetch posts");
        const json = await res.json();
        const postsArray = Array.isArray(json) ? json : (json.posts || []);
        setData(postsArray);
      } catch (err) {
        setError("Error loading posts.");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const filteredPosts = data.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.title?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query) || item.name?.toLowerCase().includes(query)) &&
      (selectedCategory === "All" || item.category === selectedCategory)
    );
  });

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.filterSection}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.categoryButtons}>
            {commonCategories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? styles.activeCat : styles.catBtn}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.posts} style={{ height: '70vh' }}> 
            {loading && <p className={styles.message}>Loading posts...</p>}
            
            {!loading && !error && (
              <Virtuoso
                totalCount={filteredPosts.length}
                itemContent={(index) => {
                  const item = filteredPosts[index];
                  const authorName = item.name || "Anonymous";
                  return (
                    <div key={item._id} className={styles.post}>
                      <div className={styles.postHeader}>
                        <div className={styles.authorMeta}>
                          <div className={styles.avatar}>{authorName.charAt(0).toUpperCase()}</div>
                          <span className={styles.author}>pb/{authorName}</span>
                        </div>
                        {item.createdAt && <p className={styles.time}>{format(parseISO(item.createdAt), 'MM/dd/yyyy')}</p>}
                      </div>
                      
                      <Link href={`/blogs/${item._id || ''}`} className={styles.postContentLink}>
                        {item.imageUrl && (
                          <div className={styles.imageWrapper} style={{ position: 'relative', height: '200px' }}>
                            <Image 
                              src={item.imageUrl} 
                              alt={item.title} 
                              fill 
                              style={{ objectFit: 'cover' }} 
                              loading="lazy" 
                            />
                          </div>
                        )}
                        <h1>{item.title}</h1>
                        <h3>{item.description}</h3>
                      </Link>
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blogs;