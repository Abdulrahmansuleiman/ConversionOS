// src/components/Logo.tsx
// Centered LaunchOps logo at the top of every screen.

export default function Logo() {
  return (
    <header className="logo-header">
      <img src="/logo.png" alt="LaunchOps" width={130} />
    </header>
  );
}