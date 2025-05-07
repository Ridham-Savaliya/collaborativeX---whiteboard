"use client";
import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('./Canvas'), {
  ssr: false, // Disable server-side rendering
});

export default function CanvasWrapper() {
  return <Canvas />;
}
