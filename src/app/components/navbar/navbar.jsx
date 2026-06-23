"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './navbar.module.css';
import notifStyles from './notification.module.css';
import { signOut, useSession } from 'next-auth/react';
import { Home, BookOpen, Crown, MessageSquare, Bell, Menu, Plus, LayoutDashboard, User, ShieldCheck, LogOut } from 'lucide-react';

const publicLinks = [
  { href: '/', label: 'Home', icon: <Home size={20} />, id: 1 },
  { href: '/blogs', label: 'Blogs', icon: <BookOpen size={20} />, id: 2 },
  { href: '/premium', label: 'Pro', icon: <Crown size={20} />, id: 3 },
  { href: '/chat', label: 'Chat', icon: <MessageSquare size={20} />, id: 4 }
];

const Navbar = ({ showFab = false }) => {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);


  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) { console.error("Error reading notifications:", err); }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.logo}><Link href="/">Prime</Link></div>

        <nav className={styles.headerLinks}>
          {publicLinks.map(link => (
            <Link href={link.href} key={link.id} className={styles.navItem}>
              {link.icon} <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.navRight}>
          {status === "authenticated" && (
            <>
            
              <div className={notifStyles.notificationWrapper}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={notifStyles.notifButton}>
                  <Bell size={24} />
                  {unreadCount > 0 && <span className={notifStyles.badge}>{unreadCount}</span>}
                </button>
                {isNotifOpen && (
                  <div className={notifStyles.notifDropdown}>
                    <div className={notifStyles.notifHeader}><h4>Notifications</h4></div>
                    <div className={notifStyles.notifList}>
                      {notifications.length === 0 ? <p className={notifStyles.emptyText}>No notifications.</p> :
                        notifications.map(item => (
                          <Link key={item._id} href={item.link || '/chat'} className={notifStyles.notifItem} onClick={() => setIsNotifOpen(false)}>
                            <h5>{item.title}</h5>
                            <p>{item.message}</p>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>

             
              <div className={styles.userMenuWrapper}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={styles.userTrigger}>
                  <User size={24} />
                </button>
                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    {session?.user?.role === "admin" && <Link href="/admin">Admin <ShieldCheck size={16} /></Link>}
                    <Link href="/dashboard">Dashboard <LayoutDashboard size={16} /></Link>
                    <Link href={`/profile/${session?.user?.id}`}>Profile <User size={16} /></Link>
                    <button onClick={() => signOut()}>Logout <LogOut size={16} /></button>
                  </div>
                )}
              </div>
            </>
          )}
     
        </div>
      </header>

      <nav className={styles.bottomNav}>
        {publicLinks.map(link => (
          <Link href={link.href} key={link.id}>{link.icon}</Link>
        ))}
      </nav>

      {showFab && (
        <button className={styles.fab}>
          <Plus size={32} />
        </button>
      )}
    </>
  );
};

export default Navbar;