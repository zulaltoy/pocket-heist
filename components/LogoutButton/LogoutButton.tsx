"use client";

import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import styles from "./LogoutButton.module.css";

export default function LogoutButton() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return null;
  }

  function handleLogout() {
    signOut(auth).catch((error) => {
      console.error("Failed to sign out:", error);
    });
  }

  return (
    <li>
      <button
        type="button"
        className={`btn ${styles.logoutButton}`}
        onClick={handleLogout}
      >
        <LogOut size={14} strokeWidth={2.75} />
        Log Out
      </button>
    </li>
  );
}
