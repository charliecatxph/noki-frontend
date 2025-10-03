import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/VirtualKeyboard.module.css';

interface VirtualKeyboardProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  isVisible: boolean;
  onClose: () => void;
  initialValue?: string;
  onChange?: (value: string) => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ 
  onSubmit, 
  placeholder = "Type your message...", 
  isVisible, 
  onClose,
  initialValue = "",
  onChange
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  // Keyboard layout
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'BACKSPACE'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    if (onChange) {
      onChange(inputValue);
    }
  }, [inputValue, onChange]);

  const handleKeyPress = (key: string) => {
    if (key === 'BACKSPACE') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (key === 'SPACE') {
      setInputValue(prev => prev + ' ');
    } else if (key === 'ENTER') {
      onSubmit(inputValue);
      onClose();
    } else {
      setInputValue(prev => prev + key);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={styles.keyboardOverlay}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.4
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div className={styles.keyboard}>
            <div className={styles.keyboardHeader}>
              <h3>E-Noki Keyboard</h3>
              <button
                className={styles.closeButton}
                onClick={onClose}
              >
                ×
              </button>
            </div>

            <div className={styles.keyboardBody}>
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.keyboardRow}>
                  {row.map((key) => (
                    <button
                      key={key}
                      className={`${styles.key} ${key === 'BACKSPACE' ? styles.backspaceKey : ''}`}
                      onClick={() => handleKeyPress(key)}
                    >
                      {key === 'BACKSPACE' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              ))}

              {/* Space and Enter Row */}
              <div className={styles.keyboardRow}>
                <button
                  className={`${styles.key} ${styles.enterKey}`}
                  onClick={() => handleKeyPress('ENTER')}
                >
                  ENTER
                </button>
                <button
                  className={`${styles.key} ${styles.spaceKey}`}
                  onClick={() => handleKeyPress('SPACE')}
                >
                  SPACE
                </button>
                <button
                  className={`${styles.key} ${styles.enterKey}`}
                  onClick={() => handleKeyPress('ENTER')}
                >
                  ENTER
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VirtualKeyboard;
