"use client";

import type { FirestoreError } from "firebase/firestore";

// hooks
import { useHeists } from "@/hooks/useHeists";

// types
import type { Heist } from "@/types/firestore";

function HeistTitles({
  heists,
  loading,
  error,
}: {
  heists: Heist[];
  loading: boolean;
  error: FirestoreError | null;
}) {
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Couldn&apos;t load heists.</p>;
  if (heists.length === 0) return <p>No heists here yet.</p>;

  return (
    <ul>
      {heists.map((heist) => (
        <li key={heist.id}>{heist.title}</li>
      ))}
    </ul>
  );
}

export default function HeistsPage() {
  const active = useHeists("active");
  const assigned = useHeists("assigned");
  const expired = useHeists("expired");

  return (
    <div className="page-content">
      <p>
        Welcome back, agent. Your missions await — stay sharp, keep it sneaky,
        and remember: no heist is too small.
      </p>
      <div className="active-heists">
        <h2>Your Active Heists</h2>
        <HeistTitles {...active} />
      </div>
      <div className="assigned-heists">
        <h2>Heists You&apos;ve Assigned</h2>
        <HeistTitles {...assigned} />
      </div>
      <div className="expired-heists">
        <h2>All Expired Heists</h2>
        <HeistTitles {...expired} />
      </div>
    </div>
  );
}
