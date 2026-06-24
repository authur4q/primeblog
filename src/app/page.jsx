import styles from "./page.module.css";
import Navbar from "./components/navbar/navbar";
import Link from "next/link";
import Image from "next/image"; 
import { auth } from "./api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import { Plus } from 'lucide-react';

import User from "../../models/user";
import Post from "../../models/post"; 
import connectMongoDb from "../../lib/mongodb";
import RotatingAd from "./components/RotatingAds/page";
import UserSearch from "./components/UserSearch/page";
import UserCarousel from "./components/UserCarousel/UserCarousel";
import MiniAvatar from "./components/MiniAvatar/MiniAvatar";


export const revalidate = 60; 

async function getLatestPostsDirectly() {
  try {
    await connectMongoDb();
    return await Post.find({ status: { $ne: "draft" } })
      .sort({ createdAt: -1 })
      .limit(4)
      .select("title description name imageUrl")
      .lean();
  } catch (error) {
    console.error("Error loading homepage posts:", error);
    return [];
  }
}

async function getPremiumExpirationDirectly(email) {
  if (!email) return null;
  try {
    await connectMongoDb();
    const user = await User.findOne({ email }).select("premiumUntil isPremium").lean();
    if (user?.isPremium && user.premiumUntil) {
      const diffTime = new Date(user.premiumUntil) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function getActiveAdDirectly() {
  try {
    await connectMongoDb();
   
    if (mongoose.models.Ad) {
      return await mongoose.models.Ad.findOne({ active: true }).lean();
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default async function Home() {
  const session = await auth();


  const [postsRes, premiumRes, adRes] = await Promise.allSettled([
    getLatestPostsDirectly(),
    session?.user?.email ? getPremiumExpirationDirectly(session.user.email) : Promise.resolve(null),
    !session?.user?.isPremium ? getActiveAdDirectly() : Promise.resolve(null)
  ]);
  
  const latestPosts = postsRes.status === 'fulfilled' ? postsRes.value : [];
  const daysRemaining = premiumRes.status === 'fulfilled' ? premiumRes.value : null;
  const activeAd = adRes.status === 'fulfilled' ? adRes.value : null;
  
  const isPremium = session?.user?.isPremium || (daysRemaining !== null);

  return (
    <div className={styles.container}>
      <Navbar />
      
      {isPremium ? (
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
              Stand out from the crowd! Upgrade to secure your unique <strong>@username</strong> handle and unlock direct <strong>WhatsApp links</strong>.
            </p>
          </div>
          <Link href="/premium" className={styles.incentiveBtn}>Claim Your Handle</Link>
        </div>
      )}
      
      <div className={styles.hero}>
        <h1>Welcome to Prime</h1>
        <h2 className={styles.subtext}>Share Ideas. Spark Conversations. Inspire Minds.</h2>
        <p>Join a community where your thoughts matter. Post freely and connect with like-minded thinkers.</p>
        <UserSearch />
        <UserCarousel />
      </div>

      {!isPremium && activeAd && <RotatingAd initialAd={activeAd} />}

      {latestPosts.length > 0 && (
        <div className={styles.feedShowcase}>
          <div className={styles.sectionHeader}>
            <h2>Explore Recent Conversations</h2>
            <Link href="/blogs" className={styles.viewAllLink}>View all posts →</Link>
          </div>
          
          <div className={styles.grid}>
            {latestPosts.map((post) => (
              <div key={post._id.toString()} className={styles.homeCard}>
                {post.imageUrl && (
                  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                    <Image 
                      src={post.imageUrl} 
                      alt={post.title} 
                      fill
                      style={{ objectFit: 'cover' }}
                      className={styles.cardImage} 
                      sizes="(max-width: 768px) 100vw, 400px"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className={styles.cardHeader}>
                  <div className={styles.authorGroup}>
                    <MiniAvatar name={post.name} className={styles.miniAvatar} />
                    <span>pb/{post.name || "Anonymous"}</span>
                  </div>
                </div>
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <Link href={`/blogs/${post._id.toString()}`} className={styles.readMore}>
                  Read post
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.highlightsBar}>
        <div className={styles.statItem}><h3>100% Free</h3><p>Open space for ideas</p></div>
        <div className={styles.statItem}><h3>Dynamic</h3><p>Live comment threads</p></div>
        <div className={styles.statItem}><h3>Personalized</h3><p>Custom creator profiles</p></div>
      </div>

      <footer className={styles.footerContainer}>
        <div className={styles.footerDivider} />
        <div className={styles.footerContent}>
          <p className={styles.footerText}>Need assistance with your premium activation?</p>
          <div className={styles.supportLinks}>
            <a href="https://wa.me/254711466962?text=Hi%20PrimeSupport" target="_blank" rel="noopener noreferrer" className={styles.supportLinkWhatsapp}>WhatsApp Help Desk</a>
            <a href="mailto:authurbass@gmail.com" className={styles.supportLinkEmail}>Email Support</a>
          </div>
        </div>
      </footer>
      
      <Link href="/dashboard" className={styles.fab}>
        <Plus size={32} />
      </Link>
    </div>
  );
}