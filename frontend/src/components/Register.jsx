import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../store/authStore.jsx";

function Register() {
  const [role, setRole] = useState("BUYER");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api("/auth/register", { method: "POST", body: new FormData(event.currentTarget) });
      toast.success("Registration successful. Login to continue.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel form" onSubmit={handleSubmit}>
        <p className="eyebrow">Create account</p>
        <h1>Join artisan-marketplace</h1>
        <div className="two-col">
          <input name="firstName" placeholder="First name" required />
          <input name="lastName" placeholder="Last name" />
        </div>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <select name="role" value={role} onChange={(event) => setRole(event.target.value)} required>
          <option value="BUYER">Buyer</option>
          <option value="ARTISAN">Artisan</option>
        </select>
        {role === "ARTISAN" && (
          <>
            <input name="businessName" placeholder="Business name" />
            <input name="location" placeholder="Village / district / state" />
            <textarea name="story" placeholder="Your craft story"></textarea>
          </>
        )}
        <label className="file-field">
          Profile image
          <input name="profileImageUrl" type="file" accept="image/*" />
        </label>
        <button className="button primary" type="submit">
          Register
        </button>
        <Link className="muted" to="/login">
          Already have an account? Login
        </Link>
      </form>
    </section>
  );
}

export default Register;
