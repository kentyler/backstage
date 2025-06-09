import { useRef, useEffect, useState } from 'react';

/**
 * useScrollManager Hook
 * 
 * Manages auto-scrolling behavior for message containers.
 * Provides intelligent scrolling that respects user interaction and prevents
 * unwanted scrolling during specific operations like commenting.
 */
const useScrollManager = () => {
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [preventAutoScroll, setPreventAutoScroll] = useState(false);

  /**
   * Scroll to the bottom of the message container
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current && !preventAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Auto-scroll effect for new messages
   * Only scrolls if user is near the bottom of the container
   */
  useEffect(() => {
    if (preventAutoScroll) return;

    const container = messageContainerRef.current;
    if (!container) return;

    // Check if user is near the bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  });

  /**
   * Temporarily prevent auto-scrolling
   * @param {number} duration - Duration in milliseconds (default: 1000)
   */
  const preventAutoScrollTemporarily = (duration = 1000) => {
    setPreventAutoScroll(true);
    setTimeout(() => {
      setPreventAutoScroll(false);
    }, duration);
  };

  /**
   * Force scroll to bottom regardless of preventAutoScroll state
   */
  const forceScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Check if the user is at the bottom of the container
   */
  const isAtBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return true;
    
    return container.scrollHeight - container.scrollTop - container.clientHeight < 10;
  };

  return {
    messagesEndRef,
    messageContainerRef,
    preventAutoScroll,
    setPreventAutoScroll,
    scrollToBottom,
    preventAutoScrollTemporarily,
    forceScrollToBottom,
    isAtBottom
  };
};

export default useScrollManager;