import AdminDashboard from "../components/dashboard/AdminDashboard";
import MemberDashboard from "../components/dashboard/MemberDashboard";

export default function Dashboard({ user }) {
  const isAdminView = user?.role === "super_admin" || user?.role === "admin";

  if (!isAdminView) {
    return <MemberDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
}
