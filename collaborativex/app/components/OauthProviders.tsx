// "use client";

// import React, { useState,useEffect } from "react";
// import { signIn } from "next-auth/react";
// import {
//   getSuggestedProviders,
//   getProviderDisplayText,
//   OAuthProvider,
//   getConfiguredProviders
// } from "../api/_lib/oauth-utills";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/router";

// interface OAuthProvidersProps {
//   email: string;
//   onLoading?: (loading: boolean) => void;
//   className?: string;
//   isLogin?: boolean;
//   showToast?: (message: string, type: "success" | "error" | "warning") => void;
// }

// const OAuthProviders: React.FC<OAuthProvidersProps> = ({
//   email,
//   onLoading,
//   className = "",
//   isLogin = true,
//   showToast,
// }) => {
//   const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

//   const configuredProviders = getConfiguredProviders();
//   const suggestedProviders = getSuggestedProviders(email).filter(provider =>
//     configuredProviders.some(configured => configured.id === provider.id)
//   );


//   const { data: session, status }:any = useSession();
//   const router = useRouter();

//   useEffect(() => {
//     if (status === "authenticated" && session?.appToken) {
//       // Store token BEFORE navigating anywhere
//       localStorage.setItem("token", session.appToken);

//       // If user came directly from OAuth, go to onboarding
//       if (window.location.pathname === "/login") {
//         router.push("/onboarding");
//       }
//     }
//   }, [status, session]);



//   const handleOAuthSignIn = async (providerId: string) => {
//     try {
//       setLoadingProvider(providerId);
//       onLoading?.(true);

//       const urlParams = new URLSearchParams(window.location.search);
//       const postLogin = urlParams.get('postLogin');
//       const postRegister = urlParams.get('postRegister');
//       const collaborator = urlParams.get('collaborator');

//       let callbackUrl = '/onboarding';
//       if (isLogin && postLogin) callbackUrl = postLogin;
//       else if (!isLogin && postRegister) callbackUrl = postRegister;

//       const redirectParams = new URLSearchParams();
//       if (isLogin && postLogin) redirectParams.set('postLogin', postLogin);
//       if (!isLogin && postRegister) redirectParams.set('postRegister', postRegister);
//       if (collaborator) redirectParams.set('collaborator', collaborator);

//       const finalCallbackUrl = redirectParams.toString()
//         ? `${callbackUrl}?${redirectParams.toString()}`
//         : callbackUrl;

//       const result = await signIn(providerId, {
//         callbackUrl: finalCallbackUrl,
//         redirect: true // Let NextAuth handle redirect
//       });

//       if (result?.error) throw new Error(result.error);

//     } catch (error: any) {
//       console.error(`OAuth sign-in failed for ${providerId}:`, error);
//       showToast?.(
//         error.message || `Failed to sign in with ${providerId}. Please try again.`,
//         "error"
//       );
//     } finally {
//       setLoadingProvider(null);
//       onLoading?.(false);
//     }
//   };

//   return (
//     <div className={`space-y-4 ${className}`}>
//       <div className="relative">
//         <div className="absolute inset-0 flex items-center">
//           <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
//         </div>
//         <div className="relative flex justify-center text-sm">
//           <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
//             Or continue with
//           </span>
//         </div>
//       </div>

//       <div className="space-y-3">
//         {suggestedProviders.map((provider: OAuthProvider) => {
//           const Icon = provider.icon;
//           const isLoading = loadingProvider === provider.id;

//           return (
//             <button
//               key={provider.id}
//               onClick={() => handleOAuthSignIn(provider.id)}
//               disabled={isLoading || loadingProvider !== null}
//               className="w-full flex items-center justify-center px-4 py-3 rounded-lg border"
//             >
//               {isLoading ? "Connecting..." : `Continue with ${provider.name}`}
//               <Icon className="w-5 h-5 ml-2" style={{ color: provider.color }} />
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default OAuthProviders;
