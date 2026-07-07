// components/CallBanner.jsx
export default function CallBanner({ conversationId, isOngoing }) {
    if (!isOngoing) return null;

    return (
        <div className={styles.callBanner}>
            <span>Ongoing call...</span>
            <button onClick={() => router.push(`/call/${conversationId}`)}>
                Return to Call
            </button>
        </div>
    );
}