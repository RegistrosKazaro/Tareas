import AppShell from "./AppShell";

export default function AdminLayout({ title, children }) {
  return <AppShell title={title}>{children}</AppShell>;
}
