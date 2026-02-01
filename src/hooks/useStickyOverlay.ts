import { useState, useEffect, useCallback, type RefObject } from 'react';

interface Coords {
    top: number;
    left: number;
    width: number;
}

export const useStickyOverlay = (
    triggerRef: RefObject<HTMLElement | null>,
    isOpen: boolean,
    offset: number = 4
) => {
    const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, width: 0 });

    const updateCoords = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + offset,
                left: rect.left,
                width: rect.width
            });
        }
    }, [triggerRef, offset]);

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            // Use capture phase to catch scroll events from any parent
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen, updateCoords]);

    return coords;
};
