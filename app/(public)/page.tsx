// welcome page for visitors without an account
// logged-in users are redirected to /heists by the (public) layout

import Link from "next/link";
import { Clock8 } from "lucide-react";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.wordmark} aria-label="Pocket Heist">
          P<Clock8 className="logo" strokeWidth={2.75} aria-hidden="true" />
          cket Heist
        </p>
        <Link href="/login" className={styles.loginLink}>
          Log in
        </Link>
      </header>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.headline}>
            <span>Tiny missions.</span>
            <span>Big office mischief.</span>
          </h1>
          <p className={styles.intro}>
            Plan small, harmless pranks and hand them to your coworkers as
            heists. Set the mission, pick a deadline, and see who pulls it off.
          </p>
          <div className={styles.actions}>
            <Link href="/signup" className={styles.register}>
              Create an account
            </Link>
            <p className={styles.secondary}>
              Already on the crew? <Link href="/login">Log in</Link>
            </p>
          </div>
        </div>

        <div className={styles.ticketWrap} aria-hidden="true">
          <article className={styles.ticket}>
            <div className={styles.ticketTop}>
              <p className={styles.ticketId}>Heist #0142</p>
              <h2 className={styles.ticketTitle}>Operation Swivel</h2>
              <p className={styles.ticketBrief}>
                Lower the boss&apos;s chair by one notch every morning until
                someone notices.
              </p>
            </div>
            <dl className={styles.ticketBottom}>
              <div>
                <dt>Assigned to</dt>
                <dd>SassyBaristaStapler</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>Friday, 5:00 pm</dd>
              </div>
            </dl>
            <span className={styles.stamp}>Crime, but cute.</span>
          </article>
        </div>
      </section>

      <ol className={styles.steps} aria-label="How it works">
        <li>
          <h2 className={styles.stepTitle}>Plan a heist</h2>
          <p>Describe the mission and set a deadline.</p>
        </li>
        <li>
          <h2 className={styles.stepTitle}>Pick your agent</h2>
          <p>Hand the job to a coworker on your crew.</p>
        </li>
        <li>
          <h2 className={styles.stepTitle}>Pull it off</h2>
          <p>Finish before the clock runs out.</p>
        </li>
      </ol>
    </div>
  );
}
