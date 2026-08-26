import React, { useState, useRef, useCallback } from 'react';

interface UseSwipeDownOptions {
  onDismiss: () => void;
  threshold?: number;
}

export function useSwipeDownDismiss({ onDismiss, threshold = 80 }: UseSwipeDownOptions) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag-to-dismiss if starting from top or scroll container is at top
    const target = e.target as HTMLElement;
    const scrollContainer = target.closest('.overflow-y-auto');
    if (scrollContainer && scrollContainer.scrollTop > 0) {
      startYRef.current = null;
      return;
    }

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.touches[0].clientY - startYRef.current;

    // Only allow dragging downwards
    if (deltaY > 0) {
      currentYRef.current = e.touches[0].clientY;
      setDragY(deltaY);
      if (e.cancelable) {
        // Prevent background scrolling while pulling sheet down
        e.preventDefault();
      }
    } else {
      setDragY(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    if (dragY > threshold) {
      setDragY(400); // Slide out
      setTimeout(() => {
        onDismiss();
        setDragY(0);
        setIsDragging(false);
      }, 150);
    } else {
      setDragY(0);
      setIsDragging(false);
    }
    startYRef.current = null;
  }, [dragY, onDismiss, threshold]);

  // Pointer/Mouse events for desktop testing
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Only initiate on the top header/grabber area to prevent interfering with button clicks
    if (!target.closest('.modal-drag-handle')) return;

    startYRef.current = e.clientY;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.clientY - startYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (startYRef.current === null) return;
    if (dragY > threshold) {
      setDragY(400);
      setTimeout(() => {
        onDismiss();
        setDragY(0);
        setIsDragging(false);
      }, 150);
    } else {
      setDragY(0);
      setIsDragging(false);
    }
    startYRef.current = null;
  }, [dragY, onDismiss, threshold]);

  return {
    dragY,
    isDragging,
    dragProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    sheetStyle: {
      transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
      transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
  };
}
