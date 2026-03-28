import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const dateString = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-sm text-gray-400"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono">{timeString}</span>
        <span>•</span>
        <span>{dateString}</span>
      </div>
    </motion.div>
  );
}
