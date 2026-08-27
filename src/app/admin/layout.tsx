import "../globals.css";

export const metadata = {
  title: "Admin · Dr Hemangi Clinic",
  robots: { index: false, follow: false },
};

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
