import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CarTally",
  description: "เพื่อถนนที่ปลอดภัย",
};

export default function RootLayout({ children }) {
  console.log("RootLayout rendering with SocketProvider");
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
