import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.sendOTP(email);
      setSuccess("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.verifyOTP(email, otp);
      setSuccess("OTP verified! Enter your new password");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(email, otp, newPassword);
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-xl p-8 md:p-9">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-600">Recover access in three quick steps.</p>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
          <span className={step >= 1 ? "text-green-700" : ""}>Email</span>
          <span className={step >= 2 ? "text-green-700" : ""}>OTP</span>
          <span className={step >= 3 ? "text-green-700" : ""}>New Password</span>
        </div>

        {success && (
          <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit code"
                className="input text-center text-2xl tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
              <p className="mt-2 text-xs text-gray-500">Code sent to {email}</p>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              Change Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-green-600 hover:text-green-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
