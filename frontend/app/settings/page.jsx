export default function SettingsPage() {
  return (
    <div style={{ color: "#f4f4f5", padding: 0 }}>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 8,
        color: "#ffffff"
      }}>
        Settings
      </h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>
        Manage your CreatorQC configuration
      </p>
      <div style={{
        backgroundColor: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: 12,
        padding: 24,
      }}>
        <h2 style={{ color: "#f4f4f5", fontSize: 16,
          fontWeight: 600, marginBottom: 16 }}>
          Campaign Settings
        </h2>
        <div style={{
          display: "grid",
          gap: 12,
          color: "#71717a",
          fontSize: 14
        }}>
          <p>• QC Score approval threshold: <strong
            style={{ color: "#6366f1" }}>78</strong></p>
          <p>• Goodness Score threshold: <strong
            style={{ color: "#6366f1" }}>65</strong></p>
          <p>• Auto-reject threshold: <strong
            style={{ color: "#6366f1" }}>45</strong></p>
          <p>• Max concurrent video processing: <strong
            style={{ color: "#6366f1" }}>5</strong></p>
          <p>• Video max file size: <strong
            style={{ color: "#6366f1" }}>500MB</strong></p>
          <p>• Signed URL expiry: <strong
            style={{ color: "#6366f1" }}>1 hour</strong></p>
        </div>
      </div>

      <div style={{
        backgroundColor: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: 12,
        padding: 24,
        marginTop: 16,
      }}>
        <h2 style={{ color: "#f4f4f5", fontSize: 16,
          fontWeight: 600, marginBottom: 16 }}>
          API Integrations
        </h2>
        <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
          {[
            { name: "Twilio WhatsApp", status: "Connected", color: "#22c55e" },
            { name: "Google Gemini", status: "Connected", color: "#22c55e" },
            { name: "Cloudflare R2", status: "Connected", color: "#22c55e" },
            { name: "PostgreSQL", status: "Connected", color: "#22c55e" },
            { name: "Redis", status: "Connected", color: "#22c55e" },
          ].map(({ name, status, color }) => (
            <div key={name} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #1f1f1f",
            }}>
              <span style={{ color: "#f4f4f5" }}>{name}</span>
              <span style={{
                color,
                fontSize: 12,
                backgroundColor: color + "20",
                padding: "3px 10px",
                borderRadius: 20,
                border: `1px solid ${color}40`,
              }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
