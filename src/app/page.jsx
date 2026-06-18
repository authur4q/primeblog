import styles from "./page.module.css";
import Navbar from "./components/navbar/page";
import Link from "next/link";
import { getServerSession } from "next-auth";
import authOptions from "./api/auth/[...nextauth]/options";

import User from "../../models/user";
import connectMongoDb from "../../lib/mongodb";


async function getLatestPosts() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL;
    const res = await fetch(`${baseUrl}/api/posts`, { 
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

async function getPremiumExpiration(email) {
  if (!email) return null;
  try {
    await connectMongoDb();
    const user = await User.findOne({ email }).select("premiumUntil isPremium");
    if (user && user.isPremium && user.premiumUntil) {
      const diffTime = new Date(user.premiumUntil) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    }
    return null;
  } catch (e) {
    console.error("Error calculating plan days:", e);
    return null;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const latestPosts = await getLatestPosts();
  const daysRemaining = session?.user?.email ? await getPremiumExpiration(session.user.email) : null;

  return (
    <div className={styles.container}>
      <Navbar />
      
      {session?.user?.isPremium ? (
        <div className={styles.reminderBanner}>
          <p>
            <strong>Pro Account Active:</strong> You have <span>{daysRemaining ?? 0} days</span> remaining on your current subscription Plan. 
            <Link href="/premium"> Manage Identity Settings →</Link>
          </p>
        </div>
      ) : (
        <div className={styles.incentiveBanner}>
          <div className={styles.incentiveContent}>
            <span className={styles.proTag}>PRIME PRO</span>
            <p>
              Stand out from the crowd! Upgrade to secure your unique <strong>@username</strong> handle and unlock direct <strong>WhatsApp links</strong> on your articles.
            </p>
          </div>
          <Link href="/premium" className={styles.incentiveBtn}>
            Claim Your Handle
          </Link>
        </div>
      )}
      
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