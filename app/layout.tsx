import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { MessageProvider } from "@/contexts/MessageContext";
import { NotificationProvider } from '@/contexts/NotificationContext';

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground flex flex-col min-h-screen" suppressHydrationWarning>
        <main className="flex-grow">
          <MessageProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </MessageProvider>
          <Toaster />
        </main>
      </body>
    </html>
    );
}
