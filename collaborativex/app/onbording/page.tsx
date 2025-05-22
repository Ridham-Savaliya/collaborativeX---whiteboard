'use client'
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Onboarding: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    whiteboardName: "",
    purpose: "",
    inviteEmails: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    if (step === 1 && !formData.whiteboardName) {
      alert("Please enter a whiteboard name.");
      return;
    }
    if (step === 2 && !formData.purpose) {
      alert("Please select a purpose.");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    // Generate a unique slug for the whiteboard
    const slug = `${formData.whiteboardName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    
    // In a real app, you'd save the whiteboard metadata (name, purpose, etc.) to a backend
    console.log("Onboarding Data:", { ...formData, slug });

    // Redirect to the whiteboard session
    router.push(`/whiteboard/${slug}`);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-purple-800">
            Welcome to CollaborativeX
          </h1>
          <Link href="/" className="text-purple-500 hover:underline">
            Back to Home
          </Link>
        </header>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                step >= s ? "bg-purple-500" : "bg-purple-200"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Whiteboard Name */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-purple-700 mb-4">
              What should we call your whiteboard?
            </h2>
            <input
              type="text"
              name="whiteboardName"
              value={formData.whiteboardName}
              onChange={handleChange}
              placeholder="e.g., Team Brainstorm"
              className="w-full p-2 border border-purple-300 rounded focus:ring-purple-500"
            />
          </div>
        )}

        {/* Step 2: Purpose */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-purple-700 mb-4">
              Why are you using this whiteboard?
            </h2>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full p-2 border border-purple-300 rounded focus:ring-purple-500"
            >
              <option value="">Select a purpose</option>
              <option value="brainstorming">Brainstorming</option>
              <option value="teaching">Teaching</option>
              <option value="planning">Planning</option>
              <option value="designing">Designing</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Step 3: Invite Others */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-purple-700 mb-4">
              Want to invite others? (Optional)
            </h2>
            <input
              type="text"
              name="inviteEmails"
              value={formData.inviteEmails}
              onChange={handleChange}
              placeholder="Enter emails (comma-separated)"
              className="w-full p-2 border border-purple-300 rounded focus:ring-purple-500"
            />
            <p className="text-sm text-purple-600 mt-2">
              You’ll also get a shareable link after creating the whiteboard.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
            >
              Start Whiteboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
