// /**
//  * Application Providers
//  * 
//  * Wraps the application with necessary providers including NextAuth SessionProvider.
//  */

// "use client";

// import { SessionProvider } from "next-auth/react";
// import { ReactNode } from "react";

// interface ProvidersProps {
//   children: ReactNode;
// }

// /**
//  * Providers component that wraps the app with SessionProvider
//  * This enables NextAuth session management throughout the application
//  */
// export function Providers({ children }: ProvidersProps) {
//   return (
//     <SessionProvider>
//       {children}
//     </SessionProvider>
//   );
// }