import Navbar from "@/components/navbar/Navbar";
import "./globals.css";
import { Inter } from "next/font/google";
import Footer from "@/components/footer/Footer";
import { ThemeContextProvider } from "@/context/ThemeContext";
import ThemeProvider from "@/providers/ThemeProvider";
import AuthProvider from "@/providers/AuthProvider";
import AdSlot from "@/components/ads/AdSlot";
import { ADS } from "@/config/ads";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GrowWise | Financial News, Investing, and Wealth Building",
  description: "Expert financial advice for the US and Europe. Master your money with GrowWise's guides on investing, credit cards, budgeting, and crypto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeContextProvider>
            <ThemeProvider>
              {ADS.SHOW_ADS && ADS.client ? (
                <Script
                  id="adsense-script"
                  async
                  strategy="afterInteractive"
                  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
                  crossOrigin="anonymous"
                />
              ) : null}
              <div className={`container${ADS.SHOW_ADS ? " adsEnabled" : ""}`}>
                <div className="wrapper">
                  <Navbar />
                  <main className="mainContent">{children}</main>
                  <Footer />
                  <AdSlot size="mobileBanner" slotKey="mobileBanner" />
                </div>
              </div>
            </ThemeProvider>
          </ThemeContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
