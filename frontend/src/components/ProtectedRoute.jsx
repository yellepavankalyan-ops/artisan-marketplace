import { Navigate } from "react-router-dom";
import { useAuth } from "../store/authStore.jsx";

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="empty">Checking your session...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

export default ProtectedRoute;
