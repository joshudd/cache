"use client";
import { AnimatePresence } from "framer-motion";

export default function TransitionContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>;
}