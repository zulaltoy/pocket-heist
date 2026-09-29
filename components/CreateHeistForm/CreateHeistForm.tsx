"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import {
  COLLECTIONS,
  HEIST_DURATION_MS,
  type CreateHeistInput,
  type User,
} from "@/types/firestore";
import styles from "./CreateHeistForm.module.css";

export default function CreateHeistForm() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        if (cancelled) return;
        setUsers(
          snapshot.docs
            .map((userDoc) => {
              const data = userDoc.data();
              return { id: data.id ?? userDoc.id, codename: data.codename };
            })
            .filter((u): u is User => Boolean(u.codename)),
        );
      } catch (error) {
        console.error("Failed to load users:", error);
        if (!cancelled) setUsersError(true);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const assignees = users.filter((u) => u.id !== user?.uid);
  const creatorCodename =
    users.find((u) => u.id === user?.uid)?.codename ?? user?.displayName ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const title = ((formData.get("title") as string) ?? "").trim();
    const description = ((formData.get("description") as string) ?? "").trim();
    const assignee = assignees.find((u) => u.id === formData.get("assignedTo"));

    if (!title || !description || !assignee) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    const heist: CreateHeistInput = {
      createdAt: serverTimestamp(),
      title,
      description,
      createdBy: user.uid,
      createdByCodename: creatorCodename,
      assignedTo: assignee.id,
      assignedToCodename: assignee.codename,
      deadline: new Date(Date.now() + HEIST_DURATION_MS),
      finalStatus: null,
    };

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, COLLECTIONS.HEISTS), heist);
      router.push("/heists");
    } catch (error) {
      console.error("Failed to create heist:", error);
      setErrorMessage("Could not create the heist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (usersLoading) {
    return (
      <p className={styles.statusMessage} role="status">
        Loading agents...
      </p>
    );
  }

  if (usersError) {
    return (
      <p className={`${styles.statusMessage} text-error`} role="alert">
        Could not load agents. Please refresh the page.
      </p>
    );
  }

  if (assignees.length === 0) {
    return (
      <p className={styles.statusMessage} role="status">
        No other agents to assign a heist to yet.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          required
          className={`${styles.input} ${styles.textarea}`}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="assignedTo">Assign To</label>
        <select
          id="assignedTo"
          name="assignedTo"
          required
          defaultValue=""
          className={`${styles.input} ${styles.select}`}
        >
          <option value="" disabled>
            Select an agent
          </option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.codename}
            </option>
          ))}
        </select>
      </div>
      {errorMessage && (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        className={`btn ${styles.submitButton}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create Heist"}
      </button>
    </form>
  );
}
