"use strict";

const React = require("react");
const { useState, useEffect } = React;
const authClient = require("../api/authClient");
const tokenStorage = require("../storage/tokenStorage");

// Basic email regex aligned with backend validationService
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function useI18n() {
  // Minimal i18n stub with possibility to inject later
  const dict = {
    it: {
      title: "Accedi o Registrati",
      email: "Email",
      password: "Password",
      passwordConfirm: "Conferma Password",
      login: "Login",
      signup: "Signup",
      or: "oppure",
      haveAccount: "Hai già un account?",
      noAccount: "Non hai un account?",
      loginHere: "Accedi",
      signupHere: "Registrati",
      invalidEmail: "Inserisci un'email valida",
      passwordRequired: "La password è obbligatoria",
      passwordMismatch: "Le password non coincidono",
      genericError: "Si è verificato un errore",
      loggingIn: "Accesso in corso...",
      signingUp: "Registrazione in corso...",
    },
    en: {
      title: "Login or Signup",
      email: "Email",
      password: "Password",
      passwordConfirm: "Confirm Password",
      login: "Login",
      signup: "Signup",
      or: "or",
      haveAccount: "Already have an account?",
      noAccount: "Don't have an account?",
      loginHere: "Login",
      signupHere: "Sign up",
      invalidEmail: "Enter a valid email",
      passwordRequired: "Password is required",
      passwordMismatch: "Passwords do not match",
      genericError: "An error occurred",
      loggingIn: "Logging in...",
      signingUp: "Signing up...",
    },
  };
  const lang = (typeof navigator !== "undefined" && (navigator.language || "").startsWith("it")) ? "it" : "en";
  return {
    t(key) { return (dict[lang] && dict[lang][key]) || dict.en[key] || key; },
    lang,
  };
}

function Field({ label, type = "text", value, onChange, name, autoComplete, error, disabled, placeholder }) {
  return (
    React.createElement("div", { className: "sd-field" },
      React.createElement("label", { className: "sd-label", htmlFor: name }, label),
      React.createElement("input", {
        className: `sd-input ${error ? "sd-input-error" : ""}`,
        id: name,
        name,
        type,
        value,
        onChange,
        autoComplete,
        disabled,
        placeholder,
      }),
      error ? React.createElement("div", { className: "sd-error" }, error) : null,
    )
  );
}

function Tabs({ mode, onChange, t }) {
  return (
    React.createElement("div", { className: "sd-tabs" },
      React.createElement("button", {
        className: `sd-tab ${mode === "login" ? "active" : ""}`,
        onClick: () => onChange("login"),
        type: "button",
      }, t("login")),
      React.createElement("button", {
        className: `sd-tab ${mode === "signup" ? "active" : ""}`,
        onClick: () => onChange("signup"),
        type: "button",
      }, t("signup")),
    )
  );
}

function AuthPage({ onAuthenticated }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    setErrors({});
    setServerError("");
  }, [mode]);

  function validate() {
    const e = {};
    if (!EMAIL_RE.test(String(email).trim().toLowerCase())) {
      e.email = t("invalidEmail");
    }
    if (!password) {
      e.password = t("passwordRequired");
    }
    if (mode === "signup" && password !== password2) {
      e.password2 = t("passwordMismatch");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await authClient.login({ email: email.trim().toLowerCase(), password });
        if (onAuthenticated) onAuthenticated(res.user, { accessToken: res.accessToken });
      } else {
        await authClient.signup({ email: email.trim().toLowerCase(), password });
        // Auto-login after signup
        const res = await authClient.login({ email: email.trim().toLowerCase(), password });
        if (onAuthenticated) onAuthenticated(res.user, { accessToken: res.accessToken });
      }
    } catch (err) {
      setServerError(err && err.message ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  function renderActions() {
    return (
      React.createElement("div", { className: "sd-actions" },
        React.createElement("button", { className: "sd-btn primary", type: "submit", disabled: loading },
          loading ? (mode === "login" ? t("loggingIn") : t("signingUp")) : (mode === "login" ? t("login") : t("signup"))
        ),
      )
    );
  }

  return (
    React.createElement("div", { className: "sd-auth-container" },
      React.createElement("div", { className: "sd-auth-card" },
        React.createElement("h2", { className: "sd-title" }, t("title")),
        React.createElement(Tabs, { mode, onChange: setMode, t }),
        serverError ? React.createElement("div", { className: "sd-server-error" }, serverError) : null,
        React.createElement("form", { onSubmit: handleSubmit, className: "sd-form" },
          React.createElement(Field, {
            label: t("email"),
            name: "email",
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            autoComplete: "email",
            error: errors.email,
            disabled: loading,
            placeholder: "you@example.com",
          }),
          React.createElement(Field, {
            label: t("password"),
            name: "password",
            type: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            autoComplete: mode === "login" ? "current-password" : "new-password",
            error: errors.password,
            disabled: loading,
          }),
          mode === "signup" && React.createElement(Field, {
            label: t("passwordConfirm"),
            name: "password2",
            type: "password",
            value: password2,
            onChange: (e) => setPassword2(e.target.value),
            autoComplete: "new-password",
            error: errors.password2,
            disabled: loading,
          }),
          renderActions(),
        ),
        React.createElement("div", { className: "sd-switch" },
          mode === "login"
            ? React.createElement(React.Fragment, null,
                React.createElement("span", null, t("noAccount"), " "),
                React.createElement("button", { type: "button", className: "sd-link", onClick: () => setMode("signup") }, t("signupHere"))
              )
            : React.createElement(React.Fragment, null,
                React.createElement("span", null, t("haveAccount"), " "),
                React.createElement("button", { type: "button", className: "sd-link", onClick: () => setMode("login") }, t("loginHere"))
              )
        ),
      )
    )
  );
}

module.exports = AuthPage;
