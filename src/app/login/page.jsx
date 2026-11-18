"use client";

import { signIn, useSession } from "next-auth/react";
import styles from "./loginPage.module.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a19.8 19.8 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a19.7 19.7 0 0 1-3.17 4.19" />
    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password, mode) {
  const errors = {};
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "signup") {
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    else if (password.length > 72) errors.password = "Password must be 72 characters or fewer.";
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = "Password must include at least one letter and one number.";
    }
  } else if (!password) {
    errors.password = "Enter your password.";
  } else if (password.length > 72) {
    errors.password = "Password must be 72 characters or fewer.";
  }
  return errors;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

const OtpModal = ({ email, password, devCode, onClose, onSuccess }) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [previewCode, setPreviewCode] = useState(devCode || "");
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSeconds((current) => (current > 0 ? current - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !verifying) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, verifying]);

  const focusAt = (index) => inputsRef.current[index]?.focus();

  const writeDigits = (index, raw) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }
    const chars = clean.slice(0, 6 - index).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      return next;
    });
    focusAt(Math.min(index + chars.length, 5));
  };

  const verify = async (event) => {
    event.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/auth/verify-otp", { email, otp: code });
      if (!res.ok) {
        setError(data.message || "That code is incorrect.");
        return;
      }
      await onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/auth/signup", { email, password });
      if (!res.ok) {
        if (typeof data.retryAfter === "number") setSeconds(data.retryAfter);
        setError(data.message || "Could not resend the code.");
        return;
      }
      setPreviewCode(data.devCode || "");
      setDigits(["", "", "", "", "", ""]);
      setSeconds(60);
      focusAt(0);
    } catch {
      setError("Could not resend the code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !verifying && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close" disabled={verifying}>
          ×
        </button>
        <h2 id="otp-title" className={styles.modalTitle}>Check your email</h2>
        <p className={styles.modalText}>
          Enter the 6-digit code sent to <strong>{email}</strong>. It expires in 10 minutes.
        </p>
        <form className={styles.otpForm} onSubmit={verify}>
          <div className={styles.otpRow} role="group" aria-label="Verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputsRef.current[index] = node;
                }}
                className={styles.otpBox}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${index + 1}`}
                maxLength={index === 0 ? 6 : 1}
                value={digit}
                onChange={(event) => writeDigits(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index] && index > 0) focusAt(index - 1);
                  if (event.key === "ArrowLeft" && index > 0) focusAt(index - 1);
                  if (event.key === "ArrowRight" && index < 5) focusAt(index + 1);
                }}
              />
            ))}
          </div>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          {previewCode ? (
            <p className={styles.devCode}>
              Local preview code: <strong>{previewCode}</strong>
            </p>
          ) : null}
          <button type="submit" className={`${styles.submit} ${styles.modalSubmit}`} disabled={verifying || digits.some((digit) => !digit)}>
            {verifying ? "Verifying..." : "Verify"}
          </button>
        </form>
        <p className={styles.resend}>
          <button type="button" className={styles.resendButton} onClick={resend} disabled={seconds > 0 || resending || verifying}>
            {resending ? "Sending..." : seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
          </button>
        </p>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [devCode, setDevCode] = useState("");

  const finishAuth = useCallback(() => {
    // A full navigation lets the session provider read the new HttpOnly cookie.
    window.location.assign("/profile");
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  const closeOtp = useCallback(() => setOtpOpen(false), []);

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(email, password, mode);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const { res, data } = await postJson(endpoint, { email: email.trim(), password });
      if (!res.ok) {
        setFormError(data.message || "Something went wrong. Please try again.");
        return;
      }
      if (mode === "signup") {
        setDevCode(data.devCode || "");
        setOtpOpen(true);
        return;
      }
      await finishAuth();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.wrapper}>
          <h1 className={styles.logo}>Univesita</h1>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className={`${styles.input} ${errors.email ? styles.inputInvalid : ""}`}
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={Boolean(errors.email)}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
                setFormError("");
              }}
            />
            {errors.email ? <p className={styles.fieldError} role="alert">{errors.email}</p> : null}

            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputInvalid : ""}`}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-label="Password"
                aria-invalid={Boolean(errors.password)}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                  setFormError("");
                }}
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password ? <p className={styles.fieldError} role="alert">{errors.password}</p> : null}
            {mode === "signup" && !errors.password ? (
              <p className={styles.hint}>Use at least 8 characters with a letter and a number.</p>
            ) : null}

            <p className={styles.terms}>
              By signing up or logging in, you consent to DeepSeek&apos;s{" "}
              <Link href="/terms">Terms of Use</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <div className={styles.actions}>
              <Link href="/forgot-password" className={styles.link}>
                Forgot password?
              </Link>
              <button
                type="button"
                className={styles.link}
                onClick={() => {
                  setMode((current) => (current === "login" ? "signup" : "login"));
                  setErrors({});
                  setFormError("");
                }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>

            {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (mode === "login" ? "Logging in..." : "Sending code...") : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <div className={styles.social}>
            <button type="button" className={styles.socialLink} onClick={() => signIn("google")}>
              Log in with Google
            </button>
            <span className={styles.pipe} aria-hidden="true" />
            <button type="button" className={styles.socialLink} onClick={() => signIn("apple")}>
              Log in with Apple
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        fdalda  ggfgf · <Link href="/contact">Contact us</Link>
      </footer>

      {otpOpen ? (
        <OtpModal
          email={email.trim().toLowerCase()}
          password={password}
          devCode={devCode}
          onClose={closeOtp}
          onSuccess={finishAuth}
        />
      ) : null}
    </div>
  );
};

export default LoginPage;
