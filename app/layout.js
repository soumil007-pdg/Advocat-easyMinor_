import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast"; // <-- 1. IMPORT TOASTER

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Advocat-Easy",
  description: "Free Legal Advice at Your Fingertips",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`} 
      >
        <Navbar />
        <main className="flex-1"> 
          {children}
        </main>
        <Toaster /> {/* <-- 2. ADD TOASTER COMPONENT */}
        <Footer /> 
      </body>
    </html>
  );
}