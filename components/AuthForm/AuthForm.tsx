"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { generateCodename } from "@/lib/codename";
import styles from "./AuthForm.module.css";

interface AuthFormProps {
  mode: "login" | "signup";
}

const CONFIG = {
  login: {
    submitLabel: "Log In",
    logTag: "Login form submitted:",
    switchPrompt: "Need an account?",
    switchLinkText: "Sign up",
    switchHref: "/signup",
  },
  signup: {
    submitLabel: "Sign Up",
    logTag: "Signup form submitted:",
    switchPrompt: "Already have an account?",
    switchLinkText: "Log in",
    switchHref: "/login",
  },
};

function getSignupErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { submitLabel, logTag, switchPrompt, switchLinkText, switchHref } =
    CONFIG[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (mode === "login") {
      console.log(logTag, { email, password });
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const codename = generateCodename();

      try {
        await updateProfile(credential.user, { displayName: codename });
        await setDoc(doc(db, "users", credential.user.uid), {
          codename,
          id: credential.user.uid,
        });
      } catch (postSignupError) {
        console.error(
          "Failed to finish setting up new account:",
          postSignupError,
        );
      }

      router.push("/heists");
    } catch (error) {
      setErrorMessage(getSignupErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordField}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className={styles.input}
            />
            <button
              type="button"
              className={styles.toggleButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          className={`btn ${styles.submitButton}`}
          disabled={mode === "signup" && isSubmitting}
        >
          {mode === "signup" && isSubmitting ? "Signing Up..." : submitLabel}
        </button>
      </form>
      <p className={styles.switchRow}>
        {switchPrompt}{" "}
        <Link href={switchHref} className={styles.switchLink}>
          {switchLinkText}
        </Link>
      </p>
    </>
  );
}
