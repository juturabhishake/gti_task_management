/* eslint-disable react-hooks/exhaustive-deps */
//hover:scale-105
"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
};

export const KpiCard = ({ title, value, icon: Icon }: KpiCardProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value]);

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-primary/20"> 
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <motion.div className="text-4xl font-bold tracking-tighter font-sans">
            {rounded}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};