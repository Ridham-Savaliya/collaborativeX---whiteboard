import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  GitBranch, 
  Clock, 
  Sparkles, 
  Zap, 
  Target,
  Layers,
  ArrowRight,
  Bell,
  Calendar,
  Users,
  Lightbulb
} from 'lucide-react';

interface ComingSoonProps {
  type: 'project-outline' | 'flowchart';
}

const ProjectOutlineComingSoon = () => {
  const features = [
    { icon: Target, text: "Smart project breakdown", color: "text-blue-500" },
    { icon: Layers, text: "Hierarchical task organization", color: "text-purple-500" },
    { icon: Users, text: "Team collaboration tools", color: "text-green-500" },
    { icon: Calendar, text: "Timeline & milestone tracking", color: "text-orange-500" }
  ];

  return (
    <div className="min-h-[600px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-300 rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 border-2 border-purple-300 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 border-2 border-indigo-300 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-16 h-16 border-2 border-blue-300 rounded-lg rotate-12"></div>
      </div>

      <div className="relative z-10 p-8 md:p-12 h-full flex flex-col items-center justify-center text-center">
        {/* Main Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
        >
          Project Outline
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-600 mb-8 max-w-md"
        >
          We're crafting something amazing to help you structure and organize your projects like never before.
        </motion.p>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-lg"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
            >
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
              <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg"
        >
          <Zap className="w-5 h-5" />
          <span className="font-semibold">75% Complete</span>
        </motion.div>

        {/* Notify Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          Notify me when ready
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

const FlowchartComingSoon = () => {
  const features = [
    { icon: GitBranch, text: "Drag & drop flowchart builder", color: "text-emerald-500" },
    { icon: Lightbulb, text: "Smart auto-layout algorithms", color: "text-yellow-500" },
    { icon: Users, text: "Real-time collaborative editing", color: "text-pink-500" },
    { icon: Zap, text: "Export to multiple formats", color: "text-cyan-500" }
  ];

  return (
    <div className="min-h-[600px] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-100 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <defs>
            <pattern id="flowchart-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#flowchart-pattern)" />
        </svg>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-16 left-16 w-16 h-10 bg-emerald-200/30 rounded-lg border-2 border-emerald-300/50"
      />
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 right-20 w-12 h-12 bg-teal-200/30 rounded-full border-2 border-teal-300/50"
      />
      <motion.div
        animate={{ y: [-5, 15, -5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 left-1/4 w-20 h-8 bg-cyan-200/30 rounded-full border-2 border-cyan-300/50"
      />

      <div className="relative z-10 p-8 md:p-12 h-full flex flex-col items-center justify-center text-center">
        {/* Main Icon with Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
              <GitBranch className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
        >
          Flowchart Builder
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-600 mb-8 max-w-md"
        >
          An intuitive visual flowchart creator is in the works. Get ready to map out your ideas with style!
        </motion.p>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-lg"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
            >
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
              <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg"
        >
          <Clock className="w-5 h-5" />
          <span className="font-semibold">Coming Q2 2025</span>
        </motion.div>

        {/* Notify Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-full font-semibold shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          Get early access
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default function ComingSoon({ type }: ComingSoonProps) {
  if (type === 'project-outline') {
    return <ProjectOutlineComingSoon />;
  }
  
  if (type === 'flowchart') {
    return <FlowchartComingSoon />;
  }
  
  return null;
}