"use strict";

const React = require("react");
const { useState } = React;
const authClient = require("../api/authClient");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function LoginForm({ onSuccess, labels = {} }) {
  const L = {
    title: labels.title || "Login",
    email: labels.email || "Email",
    password: labels.password || "Password",
    login: labels.login || "Login",
    invalidEmail: labels.invalidEmail || "Enter a valid email",
    passwordRequired: labels.passwordRequired || "Password is required",
    loggingIn: labels.loggingIn || "Logging in...",
    genericError: labels.genericError || "An error occurred",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!EMAIL_RE.test(String(email).trim().toLowerCase())) e.email = L.invalidEmail;
    if (!password) e.password = L.passwordRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authClient.login({ email: email.trim().toLowerCase(), password });
      if (onSuccess) onSuccess(res.user, res);
    } catch (err) {
      setError((err && err.message) || L.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    React.createElement("form", { className: "sd-form sd-login-form", onSubmit: submit },
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
          autoComplete: "current-password",
        }),
        errors.password ? React.createElement("div", { className: "sd-error" }, errors.password) : null,
      ),
      React.createElement("div", { className: "sd-actions" },
        React.createElement("button", { className: "sd-btn primary", type: "submit", disabled: loading }, loading ? L.loggingIn : L.login)
      ),
    )
  );
}

module.exports = LoginForm;
