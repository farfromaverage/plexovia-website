"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--pub-bg)] px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-2xl bg-[var(--accent-bg-pub)] text-[var(--accent)] flex items-center justify-center mb-6"
        >
          <FileQuestion size={32} strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-[var(--pub-text)] mb-3"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          404. Page missing.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-[var(--pub-muted)] mb-8 text-lg"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          The page you are looking for has been moved or doesn&apos;t exist. If you reached this via a broken link, please let us know.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Link href="/" className="btn-gold flex-1 sm:flex-none">
            Return to Homepage
          </Link>
          <Link href="/dashboard" className="btn-secondary flex-1 sm:flex-none">
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
