"use client";

export default function LoginButton({ 
  children, 
  onClick, 
  isLoading, 
  variant = "primary", 
  disabled 
}) {
  
  const getVariantStyle = (variant) => {
    switch (variant) {
      case "biometric":
        return { backgroundColor: "#059669", color: "#ffffff" };
      case "secondary":
        return { backgroundColor: "#f3f4f6", color: "#1f2937", border: "1px solid #d1d5db" };
      case "primary":
      default:
        return { backgroundColor: "#2563eb", color: "#ffffff" };
    }
  };

  const variantStyle = getVariantStyle(variant);

  return (
    <button 
      onClick={onClick}
      disabled={isLoading || disabled}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer',
        opacity: (isLoading || disabled) ? 0.7 : 1,
        border: variantStyle.border || 'none',
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
      }}
    >
      {isLoading ? (
        <span style={{
          width: '1.25rem',
          height: '1.25rem',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></span>
      ) : null}
      {children}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}