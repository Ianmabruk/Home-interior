import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { token, role } = response.data;
      const normalizedRole = String(role || "tenant").toLowerCase();

      localStorage.setItem("token", token);
      localStorage.setItem("role", normalizedRole);

      // Redirect based on role
      if (normalizedRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/tenant");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-xl p-8 md:p-9">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to continue to Akiba Estate.</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="block text-sm text-green-600 hover:text-green-700">
            Forgot Password?
          </Link>
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-green-600 hover:text-green-700">
              Sign Up
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">Secure access for admins and tenants</p>
      </div>
    </div>
  );
}
