'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Whiteboard {
  slug: string;
  name: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  // Simulate fetching whiteboards (replace with backend API in production)
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("whiteboards");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save whiteboards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("whiteboards", JSON.stringify(whiteboards));
  }, [whiteboards]);

  // Simulate adding a whiteboard (this would come from the onboarding page in a real app)
  const addWhiteboard = (slug: string, name: string) => {
    setWhiteboards([
      ...whiteboards,
      { slug, name, createdAt: new Date().toISOString() },
    ]);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-100 to-purple-50">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-800">
          Your Whiteboards
        </h1>
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
          >
            Create New Whiteboard
          </Link>
          <Link href="/" className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Whiteboard List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {whiteboards.length === 0 ? (
          <p className="text-purple-700 col-span-full text-center">
            No whiteboards yet. Create one to get started!
          </p>
        ) : (
          whiteboards.map((whiteboard) => (
            <Link
              key={whiteboard.slug}
              href={`/whiteboard/${whiteboard.slug}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-purple-700">
                {whiteboard.name}
              </h2>
              <p className="text-sm text-purple-500">
                Created: {new Date(whiteboard.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
