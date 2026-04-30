import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  closeTime: number;
  drawTime: number;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-10 h-12 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg border border-amber-500/30"
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <span className="text-amber-300 text-xs mt-1">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ closeTime, drawTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [status, setStatus] = useState<'betting' | 'closed'>('betting');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const targetTime = status === 'betting' ? closeTime : drawTime;
      const diff = targetTime - now;

      if (diff <= 0) {
        if (status === 'betting') {
          setStatus('closed');
        }
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [closeTime, drawTime, status]);

  return (
    <div className="flex flex-col items-end">
      <div className="text-amber-400 text-xs mb-2 font-medium">
        {status === 'betting' ? '距离封盘' : '距离开奖'}
      </div>
      <div className="flex items-center gap-2">
        <TimeUnit value={timeLeft.hours} label="时" />
        <span className="text-amber-500 text-xl font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="分" />
        <span className="text-amber-500 text-xl font-bold">:</span>
        <TimeUnit value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
}
