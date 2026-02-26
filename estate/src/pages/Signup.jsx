import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    house_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.signup({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        house_number: formData.house_number.trim(),
      });

      const { token, role } = response.data;
      const normalizedRole = String(role || "tenant").toLowerCase();

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("role", normalizedRole);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(normalizedRole === "admin" ? "/admin" : "/tenant");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 py-10 px-4">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-xl p-8 md:p-9">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-sm text-gray-600">Set up your tenant access in Akiba Estate.</p>
        </div>

        {success && (
          <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            Account created successfully! Redirecting to your dashboard...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+254 700 000 000"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">House Number</label>
            <input
              type="text"
              name="house_number"
              placeholder="e.g. C16"
              className="input"
              value={formData.house_number}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-700">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
