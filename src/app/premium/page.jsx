"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./premium.module.css";
import Navbar from "../components/navbar/page";

export default function PremiumPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleSubscribeClick = () => {
    if (!session) {
      router.push("/login");
    } else {
      router.push("/checkout");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch("/api/user/update-premium-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, whatsapp }),
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        update();
      } else {
        alert("Failed to update profile settings.");
      }
    } catch (err) {
      alert("Error running profile sync.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      {session?.user?.isPremium ? (
        <div className={styles.dashboardWrapper}>
          <div className={styles.headerSection}>
            <span className={styles.badge}>Pro Account</span>
            <h1 className={styles.title}>Welcome Back {session?.user?.name || "User"}</h1>
            <p className={styles.subtitle}>
              Manage your unique platform identity and keep your professional channels updated.
            </p>
          </div>

          <div className={styles.dashboardGrid}>
            <form onSubmit={handleSaveProfile} className={styles.dashboardCard}>
              <h3 className={styles.cardTitle}>Identity & Social Settings</h3>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Claim Custom @username</label>
                <input
                  type="text"
                  placeholder="e.g. _blaze"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.dashboardInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>WhatsApp Direct Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 2547XXXXXXXX"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={styles.dashboardInput}
                />
              </div>

              <button type="submit" disabled={updating} className={styles.saveButton}>
                {updating ? "Saving Changes..." : "Save Workspace Profile"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.headerSection}>
            <span className={styles.badge}>Prime Tiers</span>
            <h1 className={styles.title}>Upgrade Your Account</h1>
            <p className={styles.subtitle}>
              Join our premium tier to unlock advanced custom tools and connect your socials.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.tierName}>Standard Read</h3>
              <p style={{ color: "#888" }}>Great for casual readers starting out.</p>

              <div className={styles.priceBlock}>
                <span className={styles.currency}>KES</span>
                <span className={styles.price}>0</span>
                <span className={styles.period}>/ permanent</span>
              </div>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Read all public blog posts</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Leave comments on articles</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Base custom user profile card</li>
                <li className={styles.featureItem} style={{ color: "#666" }}><span className={styles.iconCross}>✕</span> Custom unique profile tracking handle</li>
                <li className={styles.featureItem} style={{ color: "#666" }}><span className={styles.iconCross}>✕</span> Instant integration links for socials</li>
                <li className={styles.featureItem} style={{ color: "#666" }}><span className={styles.iconCross}>✕</span> Exclusive Audio Narration</li>
              </ul>

              <button className={styles.freeButton} disabled>
                {session ? "Current Plan" : "Free Default Access"}
              </button>
            </div>

            <div className={styles.premiumCard}>
              <div className={styles.popularTag}>RECOMMENDED</div>
              <h3 className={styles.tierName}>Prime Pro</h3>
              <p style={{ color: "#aaa" }}>For dedicated creators and writers.</p>

              <div className={styles.priceBlock}>
                <span className={styles.currency}>KES</span>
                <span className={styles.price}>49</span>
                <span className={styles.period}>/ month</span>
              </div>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Read all public blog posts</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Set unique custom profile @username</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Connect Hobby, Twitter, Instagram & LinkedIn</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Clickable WhatsApp redirect integration</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Exclusive Creator Badge across panels</li>
                <li className={styles.featureItem}><span className={styles.iconCheck}>✓</span> Exclusive Audio Narration</li>
              </ul>

              <button className={styles.premiumButton} onClick={handleSubscribeClick}>
                Upgrade to Pro Tier
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}