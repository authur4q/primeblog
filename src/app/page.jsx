import styles from "./page.module.css";
import Navbar from "./components/navbar/page";
import Link from "next/link";
import { getServerSession } from "next-auth";


async function getLatestPosts() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return [];
    const posts = await res.json();
    return posts.slice(0, 3); 
  } catch (error) {
    console.error("Error loading homepage posts:", error);
    return [];
  }
}

export default async function Home() {
  const session = await getServerSession();
  const latestPosts = await getLatestPosts();

  return (
    <div className={styles.container}>
      <Navbar />
      
      
      <div className={styles.hero}>
        <h1>Welcome to Prime</h1>
        <h2 className={styles.subtext}>Share Ideas. Spark Conversations. Inspire Minds.</h2>
        <p>Join a community where your thoughts matter. Post freely, explore what others are thinking, and connect with like-minded thinkers.</p>
        
        {session ? (
          <Link href="/dashboard">
            <button className={styles.button}>Go to Dashboard</button>
          </Link>
        ) : (
          <Link href="/register">
            <button className={styles.button}>Get started</button>
          </Link>
        )}  
      </div>

    
      {latestPosts.length > 0 && (
        <div className={styles.feedShowcase}>
          <div className={styles.sectionHeader}>
            <h2>Explore Recent Conversations</h2>
            <Link href="/blogs" className={styles.viewAllLink}>View all posts →</Link>
          </div>
          
          <div className={styles.grid}>
            {latestPosts.map((post) => {
              const initial = (post.name || "A").charAt(0).toUpperCase();
              return (
                <div key={post._id} className={styles.homeCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.authorGroup}>
                      <div className={styles.miniAvatar}>{initial}</div>
                      <span>pb/{post.name || "Anonymous"}</span>
                    </div>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <Link href={`/blogs/${post._id}`} className={styles.readMore}>
                    Read post
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

     
      <div className={styles.highlightsBar}>
        <div className={styles.statItem}>
          <h3>100% Free</h3>
          <p>Open space for ideas</p>
        </div>
        <div className={styles.statItem}>
          <h3>Dynamic</h3>
          <p>Live comment threads</p>
        </div>
        <div className={styles.statItem}>
          <h3>Personalized</h3>
          <p>Custom creator profiles</p>
        </div>
      </div>
    </div>
  );
}