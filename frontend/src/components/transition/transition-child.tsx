'use client';

import { motion } from "framer-motion";

const variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
};

export default function TransitionChild({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <motion.div
      layout
      key={id}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {children}
    </motion.div>
  );
}