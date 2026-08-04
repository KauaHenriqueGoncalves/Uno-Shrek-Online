import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext.jsx";
import shrekBg from "../../../assets/login-image-left.png";
import logo from "../../../assets/logo-urro.png";
import "./auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;

  const [form, setForm]         = useState({ username: "", password: "" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setApiError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      setApiError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(form);
      navigate("/lobby");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/auth/google`;
  }

  return (
    <div className="auth-layout">
      <div className="auth-image" style={{ backgroundImage: `url(${shrekBg})` }} />

      <div className="auth-panel">
        <p className="auth-top-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <div className="auth-form-wrapper">
          <img src={logo} alt="UNO Shrek" className="auth-logo" /> 
          <h1 className="auth-title">Create an account</h1>

          {registered && (
            <div className="alert alert-success">Account created! Log in to play.</div>
          )}
          {apiError && (
            <div className="alert alert-error">{apiError}</div>
          )}

          <button type="button" className="btn-google" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>OR</span></div>

          <form onSubmit={onSubmit} noValidate className="auth-form">
            <div className="field">
              <label htmlFor="username">User name or email address</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={onChange}
                placeholder=""
              />
            </div>

            <div className="field">
              <label htmlFor="password">Your password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                  placeholder=""
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password">Forget your password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Sign in"}
            </button>
          </form>

          <p className="auth-sub">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}