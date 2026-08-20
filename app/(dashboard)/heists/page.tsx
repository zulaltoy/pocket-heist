export default function HeistsPage() {
  return (
    <div className="page-content">
      <p>Welcome back, agent. Your missions await — stay sharp, keep it sneaky, and remember: no heist is too small.</p>
      <div className="active-heists">
        <h2>Your Active Heists</h2>
      </div>
      <div className="assigned-heists">
        <h2>Heists You've Assigned</h2>
      </div>
      <div className="expired-heists">
        <h2>All Expired Heists</h2>
      </div>
    </div>
  )
}