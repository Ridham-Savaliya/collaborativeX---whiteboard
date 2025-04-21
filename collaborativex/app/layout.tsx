import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import {logo} from "../public/logo.png"
// import {logo} from "../public/logo.png"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollaborativeX - AI-Powered Real-time Collaborative Whiteboard",
  icons: {
    icon: '/logo.png', // or .ico
  },
  description: "Transform your team collaboration with CollaborativeX's AI-powered whiteboard featuring real-time collaboration, video calling, and smart drawing assistance.",
  keywords: "collaborative whiteboard, AI whiteboard, real-time collaboration, video calling, team collaboration, remote teams, digital whiteboard",
  authors: [{ name: "CollaborativeX Team" }],
  openGraph: {
    title: "CollaborativeX - AI-Powered Real-time Collaborative Whiteboard",
    description: "Transform your team collaboration with CollaborativeX's AI-powered whiteboard featuring real-time collaboration, video calling, and smart drawing assistance.",
    type: "website",
    url: "https://collaborativex.com",
    siteName: "CollaborativeX",
    images: [{
      url: "../../public/logo.png",
      width: 1200,
      height: 630,
      alt: "CollaborativeX Whiteboard Platform"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "CollaborativeX - AI-Powered Real-time Collaborative Whiteboard",
    description: "Transform your team collaboration with CollaborativeX's AI-powered whiteboard featuring real-time collaboration, video calling, and smart drawing assistance.",
    images: [{ url: "../../public/logo.png", width: 1200, height: 630, alt: "CollaborativeX Logo" }]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* <link rel="canonical" href="https://collaborativex.com" /> */}
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CollaborativeX",
      description: "AI-powered real-time collaborative whiteboard platform with integrated video calling",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList:
        "Real-time Collaboration, Video Calling, AI-Powered Features, Infinite Canvas, Smart Templates, Voice Commands",
      url: "https://collaborativex.com",
      author: {
        "@type": "Organization",
        name: "CollaborativeX Team",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: "1",
      },
    }),
  }}
/>
<link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
