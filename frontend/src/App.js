import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth.context";
import ThemeProvider from "./lib/theme.context";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProtectedRoute from "./lib/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<ProtectedRoute admin={true} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route element={<ProtectedRoute unprotected={true} />}>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
