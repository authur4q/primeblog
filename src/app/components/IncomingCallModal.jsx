"use client";
import { useCall } from '@/context/CallContext';
import { useRouter } from 'next/navigation';
import styles from './IncomingCallModal.module.css';

export default function IncomingCallModal() {
  
  const { 
    activeConversationId, 
    callerName, 
    callMode, 
    setCallMode,
    setIsCallOngoing, 
    setActiveConversationId 
  } = useCall();
  
  const router = useRouter();

  
  if (callMode !== 'incoming' || !activeConversationId) return null;

  const handleAccept = () => {
    setIsCallOngoing(true);
    router.push(`/call/${activeConversationId}`);
    
    setActiveConversationId(null);
    setCallMode(null);
  };

  const handleReject = () => {
   e
    setActiveConversationId(null);
    setCallMode(null);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Incoming Call</h3>
        <p className={styles.callerName}>{callerName || "Unknown Caller"}</p>
        <div className={styles.buttonGroup}>
          <button onClick={handleAccept} className={styles.acceptBtn}>Accept</button>
          <button onClick={handleReject} className={styles.rejectBtn}>Reject</button>
        </div>
      </div>
    </div>
  );
}