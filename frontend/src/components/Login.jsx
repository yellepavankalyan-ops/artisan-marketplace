import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, useAuth } from "../store/authStore.jsx";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      setUser(data.payload);
      toast.success("Login successful");
      if (data.payload.role === "ARTISAN") navigate("/artisan-profile");
      else if (data.payload.role === "ADMIN") navigate("/admin-profile");
      else navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel form" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <button className="button primary" type="submit">
          Login
        </button>
      </form>
    </section>
  );
}

export default Login;
