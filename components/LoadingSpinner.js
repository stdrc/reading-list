export default function LoadingSpinner({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        animation: "spin 1s linear infinite",
        display: "inline-block",
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#0070f3"
        strokeWidth="4"
        fill="none"
        strokeDasharray="30 60"
      />
    </svg>
  );
}
