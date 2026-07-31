import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silent Stakeholder | WordPress for Android",
  description:
    "AI-powered latent need detection. Discovers hidden user needs by comparing Google Play reviews against the GitHub roadmap for WordPress for Android.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') document.documentElement.classList.add('light');
                else document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
