"use strict";

const React = require("react");
const { useState } = React;
const authClient = require("../api/authClient");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function SignupForm({ onSuccess, labels = {} }) {
  const L = {
    title: labels.title || "Signup",
    email: labels.email || "Email",
    password: labels.password || "Password",
    passwordConfirm: labels.passwordConfirm || "Confirm Password",
    signup: labels.signup || "Signup",
    invalidEmail: labels.invalidEmail || "Enter a valid email",
    passwordRequired: labels.passwordRequired || "Password is required",
    passwordMismatch: labels.passwordMismatch || "Passwords do not match",
    signingUp: labels.signingUp || "Signing up...",
    genericError: labels.genericError || "An error occurred",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!EMAIL_RE.test(String(email).trim().toLowerCase())) e.email = L.invalidEmail;
    if (!password) e.password = L.passwordRequired;
    if (password !== password2) e.password2 = L.passwordMismatch;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await authClient.signup({ email: email.trim().toLowerCase(), password });
      // Auto-login to obtain tokens
      const res = await authClient.login({ email: email.trim().toLowerCase(), password });
      if (onSuccess) onSuccess(res.user, res);
    } catch (err) {
      setError((err && err.message) || L.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    React.createElement("form", { className: "sd-form sd-signup-form", onSubmit: submit },
      error ? React.createElement("div", { className: "sd-server-error" }, error) : null,
      React.createElement("div", { className: "sd-field" },
        React.createElement("label", { className: "sd-label", htmlFor: "email" }, L.email),
        React.createElement("input", {
          id: "email",
          name: "email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: `sd-input ${errors.email ? "sd-input-error" : ""}`,
          autoComplete: "email",
        }),
        errors.email ? React.createElement("div", { className: "sd-error" }, errors.email) : null,
      ),
      React.createElement("div", { className: "sd-field" },
        React.createElement("label", { className: "sd-label", htmlFor: "password" }, L.password),
        React.createElement("input", {
          id: "password",
          name: "password",
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: `sd-input ${errors.password ? "sd-input-error" : ""}`,
          autoComplete: "new-password",
        }),
        errors.password ? React.createElement("div", { className: "sd-error" }, errors.password) : null,
      ),
      React.createElement("div", { className: "sd-field" },
        React.createElement("label", { className: "sd-label", htmlFor: "password2" }, L.passwordConfirm),
        React.createElement("input", {
          id: "password2",
          name: "password2",
          type: "password",
          value: password2,
          onChange: (e) => setPassword2(e.target.value),
          className: `sd-input ${errors.password2 ? "sd-input-error" : ""}`,
          autoComplete: "new-password",
        }),
        errors.password2 ? React.createElement("div", { className: "sd-error" }, errors.password2) : null,
      ),
      React.createElement("div", { className: "sd-actions" },
        React.createElement("button", { className: "sd-btn primary", type: "submit", disabled: loading }, loading ? L.signingUp : L.signup)
      ),
    )
  );
}

module.exports = SignupForm;
