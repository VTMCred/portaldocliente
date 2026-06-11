import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  // Prevent body scroll when bottom sheet is open on desktop/mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Dark overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-[#000000] cursor-pointer"
            aria-hidden="true"
          />

          {/* Bottom sheet content container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] border-t border-gray-100"
          >
            {/* Elegant gray top pill pulling handle for premium mobile feel */}
            <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header Close button */}
            <button
              onClick={onClose}
              id="close-bottom-sheet-btn"
              className="absolute top-4 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-royal-blue/20"
              aria-label="Fecar"
            >
              <X size={20} />
            </button>

            {/* Scrollable interior content to support display with keyboard open */}
            <div className="overflow-y-auto px-6 pb-8 pt-2 scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
