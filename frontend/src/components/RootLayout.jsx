import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../store/authStore.jsx";

function RootLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/");
  }

  return (
    <>
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="artisan-marketplace home">
          <span className="brand-mark">AM</span>
          <span>
            <strong>artisan-marketplace</strong>
            <small>Rural Indian artisan goods</small>
          </span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {user?.role === "BUYER" && <NavLink to="/buyer-profile">Buyer</NavLink>}
          {user?.role === "ARTISAN" && <NavLink to="/artisan-profile">Artisan</NavLink>}
          {user?.role === "ADMIN" && <NavLink to="/admin-profile">Admin</NavLink>}
        </nav>
        <div className="auth-actions">
          {user ? (
            <>
              <span className="chip">{user.role}</span>
              <strong>{user.businessName || user.firstName}</strong>
              <button className="button ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className="button ghost" to="/login">
                Login
              </NavLink>
              <NavLink className="button primary" to="/register">
                Register
              </NavLink>
            </>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">artisan-marketplace connects buyers directly with verified Indian makers.</footer>
    </>
  );
}

export default RootLayout;
