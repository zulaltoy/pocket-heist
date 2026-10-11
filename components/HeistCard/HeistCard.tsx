import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import { formatDeadline, formatTimeLeft } from "@/lib/deadline";
import type { Heist } from "@/types/firestore";
import styles from "./HeistCard.module.css";

interface HeistCardProps {
  heist: Heist;
}

export default function HeistCard({ heist }: HeistCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Link href={`/heists/${heist.id}`}>{heist.title}</Link>
        </h3>
        <Clock className={styles.clock} size={16} aria-hidden />
      </div>
      <ul className={styles.meta}>
        <li>
          <User size={12} aria-hidden />
          <span>
            To:{" "}
            <span className={styles.to}>
              @{heist.assignedToCodename || "unknown"}
            </span>
          </span>
        </li>
        <li>
          <User size={12} aria-hidden />
          <span>
            By:{" "}
            <span className={styles.by}>
              @{heist.createdByCodename || "unknown"}
            </span>
          </span>
        </li>
        <li>
          <Calendar size={12} aria-hidden />
          <span>
            {formatDeadline(heist.deadline)} •{" "}
            <span className={styles.timeLeft}>
              {formatTimeLeft(heist.deadline)}
            </span>
          </span>
        </li>
      </ul>
    </article>
  );
}
