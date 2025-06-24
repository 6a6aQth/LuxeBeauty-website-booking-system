"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  tag: string;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  const contentVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const tagVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div ref={ref} className="relative w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="hidden md:block absolute left-1/2 -ml-px w-0.5 h-full bg-neutral-200 dark:bg-neutral-800">
        <motion.div
          style={{
            height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
            backgroundImage:
              "linear-gradient(to bottom, #9333ea, #3b82f6, transparent)",
          }}
          className="w-full h-full"
        />
      </div>
      <div className="md:hidden absolute left-4 w-0.5 h-full bg-neutral-200 dark:bg-neutral-800">
        <motion.div
          style={{
            height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
            backgroundImage:
              "linear-gradient(to bottom, #9333ea, #3b82f6, transparent)",
          }}
          className="w-full h-full"
        />
      </div>

      {data.map((item, index) => (
        <div key={index} className="relative mb-16">
          <div className="hidden md:flex items-center">
            {index % 2 === 0 ? (
              <>
                <motion.div
                  className="w-1/2 pr-8 text-right"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={tagVariants}
                >
                  <p className="text-2xl font-bold text-neutral-500">
                    {item.tag}
                  </p>
                </motion.div>
                <div className="w-1/2 pl-8"></div>
              </>
            ) : (
              <>
                <div className="w-1/2 pr-8"></div>
                <motion.div
                  className="w-1/2 pl-8 text-left"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={tagVariants}
                >
                  <p className="text-2xl font-bold text-neutral-500">
                    {item.tag}
                  </p>
                </motion.div>
              </>
            )}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="md:hidden flex items-center mb-4">
            <div className="absolute left-4 transform -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <motion.div
              className="pl-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={tagVariants}
            >
              <p className="text-2xl font-bold text-neutral-500">{item.tag}</p>
            </motion.div>
          </div>

          <motion.div
            className={`md:flex ${
              index % 2 === 0 ? "flex-row" : "flex-row-reverse"
            } items-center`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={contentVariants}
          >
            <div className="md:w-1/2 p-1">
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <div className="text-base font-normal text-neutral-600 dark:text-neutral-400">
                  {item.content}
                </div>
              </div>
            </div>
            <div className="w-1/2"></div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}; 