"use client";

import { useEffect, useState } from "react";
import { useHeist } from "@/hooks/useHeist";
import { formatTimeLeft } from "@/lib/timeLeft";
import type { HeistFinalStatus } from "@/types/firestore";
import styles from "./HeistDetails.module.css";

const FINAL_STATUS_LABELS: Record<HeistFinalStatus, string> = {
  success: "Heist succeeded",
  failure: "Heist failed",
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export default function HeistDetails({ id }: { id: string }) {
  const { heist, loading, error } = useHeist(id);
  const now = useNow();

  if (loading) {
    return (
      <p className={styles.statusMessage} role="status">
        Loading heist...
      </p>
    );
  }

  if (error) {
    return (
      <p className={`${styles.statusMessage} text-error`} role="alert">
        Couldn&apos;t load this heist.
      </p>
    );
  }

  if (!heist) {
    return (
      <p className={styles.statusMessage} role="status">
        This heist doesn&apos;t exist.
      </p>
    );
  }

  const timeLeft = formatTimeLeft(heist.deadline, now);

  return (
    <article className={styles.card}>
      <h2 className={styles.title}>{heist.title}</h2>

      <dl className={styles.meta}>
        <div>
          <dt>Assigned to</dt>
          <dd>{heist.assignedToCodename}</dd>
        </div>
        <div>
          <dt>Created by</dt>
          <dd>{heist.createdByCodename}</dd>
        </div>
        <div>
          <dt>Time left</dt>
          <dd className={timeLeft ? styles.timeLeft : "text-error"}>
            {timeLeft ?? "Time's up"}
          </dd>
        </div>
        {heist.finalStatus && (
          <div>
            <dt>Outcome</dt>
            <dd
              className={
                heist.finalStatus === "success" ? "text-success" : "text-error"
              }
            >
              {FINAL_STATUS_LABELS[heist.finalStatus]}
            </dd>
          </div>
        )}
      </dl>

      <section>
        <h3 className={styles.sectionHeading}>Details</h3>
        <p className={styles.description}>{heist.description}</p>
      </section>
    </article>
  );
}
