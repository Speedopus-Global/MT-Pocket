import { Children, useLayoutEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';



export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div
    className={`scroll-stack-card relative min-h-screen w-screen max-w-none overflow-hidden ${itemClassName}`.trim()}
    style={{
      backfaceVisibility: 'hidden',
      boxSizing: 'border-box',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      width: '100vw'
    }}
  >
  <div
  className="scroll-stack-sticky sticky top-0 flex h-screen w-full items-center justify-center overflow-visible"
>
      {children}
    </div>
  </div>
);

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 10,
  stackPosition = '0%',
  scaleEndPosition = '0%',
  baseScale = 0.92,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete
}) => {
  const scrollerRef = useRef(null);
  const stackCompletedRef = useRef(false);
  const lenisFrameRef = useRef(null);
  const updateFrameRef = useRef(null);
  const lenisRef = useRef(null);
  const cardsRef = useRef([]);
  const lastTransformsRef = useRef(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop, start, end) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value, containerHeight) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (Number.parseFloat(value) / 100) * containerHeight;
    }
    return Number.parseFloat(value);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight
      };
    }

    const scroller = scrollerRef.current;
    return {
      scrollTop: scroller?.scrollTop ?? 0,
      containerHeight: scroller?.clientHeight ?? window.innerHeight
    };
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    element => {
      if (!element) return 0;
      if (useWindowScroll) {
        const rect = element.getBoundingClientRect();
        return rect.top + window.scrollY;
      }
      return element.offsetTop;
    },
    [useWindowScroll]
  );

  const getTopCardIndex = useCallback((scrollTop, stackPositionPx, cardMetrics) => {
    let topCardIndex = 0;

    for (let j = 0; j < cardMetrics.length; j += 1) {
      const jTop = cardMetrics[j].top;
      const jTriggerStart = jTop - stackPositionPx - itemStackDistance * j;
      if (scrollTop >= jTriggerStart) {
        topCardIndex = j;
      }
    }

    return topCardIndex;
  }, [itemStackDistance]);

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

    const endElement = scrollerRef.current?.querySelector('.scroll-stack-end');
    const endElementTop = endElement ? getElementOffset(endElement) : scrollTop + containerHeight;

    const cardMetrics = cardsRef.current.map(card => ({
      card,
      target: card.querySelector('.scroll-stack-sticky') || card,
      top: getElementOffset(card)
    }));

    cardMetrics.forEach(({ card, target, top }, i) => {

      if (!card || !target) return;
      card.style.zIndex = 1000 - i;

      const triggerStart = top - stackPositionPx - itemStackDistance * i;
      const triggerEnd = top - scaleEndPositionPx;
      const pinStart = triggerStart;
      const pinEnd = i < cardMetrics.length - 1
  ? cardMetrics[i + 1].top - stackPositionPx - itemStackDistance * (i + 1)
  : endElementTop - containerHeight / 2;
      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;
      const blur = blurAmount ? Math.max(0, (getTopCardIndex(scrollTop, stackPositionPx, cardMetrics) - i) * blurAmount) : 0;
      const translateY = scrollTop >= pinStart && scrollTop <= pinEnd
        ? scrollTop - top + stackPositionPx + itemStackDistance * i
        : scrollTop > pinEnd
          ? pinEnd - top + stackPositionPx + itemStackDistance * i
          : 0;

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        (blurAmount > 0 && Math.abs(lastTransform.blur - newTransform.blur) > 0.1);

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        target.style.transform = transform;

        if (blurAmount > 0) {
          target.style.filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';
        } else {
          target.style.filter = '';
        }

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardMetrics.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset,
    getTopCardIndex
  ]);

  const scheduleUpdate = useCallback(() => {
    if (updateFrameRef.current) return;

    updateFrameRef.current = requestAnimationFrame(() => {
      updateFrameRef.current = null;
      updateCardTransforms();
    });
  }, [updateCardTransforms]);

  const handleScroll = useCallback(() => {
    scheduleUpdate();
  }, [scheduleUpdate]);

  const setupLenis = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) return null;

    const lenis = new Lenis({
      ...(useWindowScroll ? {} : { wrapper: scroller, content: scroller.querySelector('.scroll-stack-inner') }),
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075
    });

    lenis.on('scroll', handleScroll);

    const raf = time => {
      lenis.raf(time);
      lenisFrameRef.current = requestAnimationFrame(raf);
    };

    lenisFrameRef.current = requestAnimationFrame(raf);

    lenisRef.current = lenis;
    return lenis;
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    cards.forEach(card => {
      const target = card.querySelector('.scroll-stack-sticky') || card;
      card.style.willChange = 'transform';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      target.style.willChange = 'transform';
      target.style.transformOrigin = 'top center';
      target.style.backfaceVisibility = 'hidden';
      target.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
    });

    setupLenis();
    updateCardTransforms();

    return () => {
      if (lenisFrameRef.current) {
        cancelAnimationFrame(lenisFrameRef.current);
      }
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms
  ]);

  const containerStyles = useWindowScroll
    ? {
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }
    : {
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        willChange: 'scroll-position'
      };

  const containerClassName = useWindowScroll
    ? `relative w-full min-h-screen ${className}`.trim()
    : `relative w-full h-full overflow-y-auto overflow-x-visible ${className}`.trim();

  const childCount = Children.toArray(children).length;
  const contentHeight = `${childCount * 130}vh`;

  return (
    <div className={containerClassName} ref={scrollerRef} style={containerStyles}>
      <div className="scroll-stack-inner w-full" style={{ minHeight: contentHeight }}>
        {children}
        <div className="scroll-stack-end h-full w-full" />
      </div>
    </div>
  );
};

export default ScrollStack;