import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16`} 
      >
        <Navbar />
        <main className="h-[calc(100dvh-8rem)]"> 
          {children}
        </main>
        <Footer /> 
      </body>
    </html>
  );
}
