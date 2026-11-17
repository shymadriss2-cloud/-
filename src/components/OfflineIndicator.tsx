import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          role="status"
          className="fixed bottom-20 left-4 z-40 inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] shadow-md lg:bottom-5 lg:left-6"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
          <span>وضع عدم الاتصال — جميع بياناتك محفوظة محلياً</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
