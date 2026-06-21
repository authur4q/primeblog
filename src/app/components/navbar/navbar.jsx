"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './navbar.module.css';
import notifStyles from './notification.module.css';
import { signOut, useSession } from 'next-auth/react';

const publicLinks = [
  { href: '/', label: 'Home', id: 1 },
  { href: '/blogs', label: 'Blogs', id: 2 },
  { href: '/premium', label: 'Premium', id: 3 },
  { href: '/chat', label: 'Chat', id: 4 }
];

const Navbar = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isOpen, setIsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error reading notification stream:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
      const pollInterval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(pollInterval);
    }
  }, [status]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    setIsOpen(false);

    if (!isNotifOpen && unreadCount > 0) {
      const originalFeed = [...notifications];
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      try {
        const res = await fetch("/api/notifications", { method: "PATCH" });
        if (!res.ok) throw new Error("Could not update notification state");
      } catch (err) {
        setNotifications(originalFeed);
        console.error(err.message);
      }
    }
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <h1><Link href="/">Prime</Link></h1>
      </div>

      <div className={styles.navRight}>
        {status === "authenticated" && (
          <div className={notifStyles.notificationWrapper}>
            <button 
              onClick={handleToggleNotifications} 
              className={notifStyles.notifButton}
              aria-label="Toggle notifications"
            >
              🔔 {unreadCount > 0 && <span className={notifStyles.badge}>{unreadCount}</span>}
            </button>

            {isNotifOpen && (
              <div className={notifStyles.notifDropdown}>
                <div className={notifStyles.notifHeader}><h4>Notifications</h4></div>
                <div className={notifStyles.notifList}>
                  {notifications.length === 0 ? (
                    <p className={notifStyles.emptyText}>No recent notifications.</p>
                  ) : (
                    notifications.map((item) => (
                      <Link 
                        key={item._id} 
                        href={item.chatId ? `/chat/${item.chatId}` : (item.link || '/chat')}
                        className={`${notifStyles.notifItem} ${!item.read ? notifStyles.unreadItem : ""}`}
                        onClick={() => setIsNotifOpen(false)}
                      >
                        <div className={notifStyles.notifSenderRow}>
                          <span className={notifStyles.senderName}>{item.sender?.name || "System"}</span>
                          {item.sender?.isPremium && <span className={notifStyles.proBadge}>PRO</span>}
                        </div>
                        <h5 className={notifStyles.notifTitle}>{item.title}</h5>
                        <p>{item.message}</p>
                        <span className={notifStyles.timestamp}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          className={`${styles.toggle} ${isOpen ? styles.toggleActive : ''}`}
          onClick={() => { setIsOpen(!isOpen); setIsNotifOpen(false); }}
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      <div className={`${styles.links} ${isOpen ? styles.linksActive : ''}`}>
        {publicLinks.map(link => (
          <Link href={link.href} key={link.id} onClick={() => setIsOpen(false)}>{link.label}</Link>
        ))}
        {status === "authenticated" && (
          <>
            {session?.user?.role === "admin" && <Link href="/admin" onClick={() => setIsOpen(false)}>Admin</Link>}
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href={`/profile/${userId}`} onClick={() => setIsOpen(false)}>My Profile</Link>
            <button className={styles.btn} onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/login' }); }}>Logout</button>
          </>
        )}
        {status === "unauthenticated" && <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>}
      </div>
    </div>
  );
};

export default Navbar;