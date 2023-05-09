import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./auth.context";

const PrivateRoutes = ({ admin, unprotected }) => {
  const { user } = useAuth();

  if (admin === true) {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (!user.isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    return <Outlet />;
  }
  if (unprotected === true) {
    if (user) {
      return <Navigate to="/dashboard" />;
    }
    return <Outlet />;
  }
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
