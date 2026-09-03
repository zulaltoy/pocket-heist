"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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

export default function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { submitLabel, logTag, switchPrompt, switchLinkText, switchHref } =
    CONFIG[mode];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    console.log(logTag, {
      email: formData.get("email"),
      password: formData.get("password"),
    });
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
        <button type="submit" className={`btn ${styles.submitButton}`}>
          {submitLabel}
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
