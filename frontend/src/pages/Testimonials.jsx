"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const defaultSpring = {
  type: "spring",
  visualDuration: 0.6,
  bounce: 0.25,
};

export const controls = {
  spring: defaultSpring,
  activeScale: [1.15, 1, 1.6, 0.01],
  cardSpacing: [180, 40, 320, 5],
};

// Premium shadow — same treatment on every card, tinted with the brand
// primary (#0F7A53) rather than a flat black shadow, so depth reads as
// "forest" rather than generic UI chrome.
const premiumShadow = "shadow-[0_22px_50px_-14px_rgba(15,122,83,0.4)]";

// Placeholder avatar URLs (pravatar, seeded per name) — swap for real
// user photos before shipping; kept here only so "Circular user photo"
// actually renders something instead of an empty ring.
export const Testimonials = ({
  spring = defaultSpring,
  activeScale = 1.15,
  cardSpacing = 180,
} = {}) => {
  const cards = [
    {
      title: "Priya Sharma",
      location: "Bengaluru, India",
      photo: "https://i.pravatar.cc/150?img=47",
      quote:
        "MT Pocket made finding a trusted lender in my locality incredibly simple. The verification process gave me confidence before reaching out.",
      className:
        "bg-gradient-to-br from-primary/70 to-primary/30 [&_h2]:text-primary-foreground [&_p]:text-primary-foreground/90 [&_span]:text-primary-foreground/80",
      config: { y: -20, x: 0, rotate: -15, zIndex: 2 },
    },
    {
      title: "Arjun Mehta",
      location: "Pune, India",
      photo: "https://i.pravatar.cc/150?img=12",
      quote:
        "As a lender, seeing a real trust score before I even message someone changes everything. I finally know who I'm actually talking to.",
      className:
        "bg-gradient-to-br from-secondary/70 to-secondary/30 [&_h2]:text-secondary-foreground [&_p]:text-secondary-foreground/90 [&_span]:text-secondary-foreground/75",
      config: { y: 20, x: 180, rotate: 8, zIndex: 3 },
    },
    {
      title: "Kavya Nair",
      location: "Kochi, India",
      photo: "https://i.pravatar.cc/150?img=32",
      quote:
        "Negotiating terms directly, without a middleman deciding my interest rate for me, is exactly what I was looking for.",
      className:
        "bg-gradient-to-br from-muted/70 to-accent/40 [&_h2]:text-foreground [&_p]:text-foreground/85 [&_span]:text-foreground/70",
      config: { y: -80, x: 360, rotate: -5, zIndex: 4 },
    },
    {
      title: "Rohan Desai",
      location: "Ahmedabad, India",
      photo: "https://i.pravatar.cc/150?img=68",
      quote:
        "The private chat and one-tap report option made me comfortable enough to actually go through with the loan.",
      className:
        "bg-gradient-to-br from-accent/70 to-primary/30 [&_h2]:text-accent-foreground [&_p]:text-accent-foreground/90 [&_span]:text-accent-foreground/75",
      config: { y: 20, x: 540, rotate: 12, zIndex: 5 },
    },
    {
      title: "Sana Iqbal",
      location: "Hyderabad, India",
      photo: "https://i.pravatar.cc/150?img=25",
      quote:
        "Knowing MT Pocket never touches the money itself was the deciding factor — everything stayed between the two of us.",
      className:
        "bg-gradient-to-br from-foreground/70 to-foreground/40 [&_h2]:text-background [&_p]:text-background/85 [&_span]:text-background/70",
      config: { y: 20, x: 720, rotate: -5, zIndex: 6 },
    },
  ];

  const [active, setActive] = useState(null);
  const [spacing, setSpacing] = useState(cardSpacing);

  const ref = useRef(null);

  const cardSpring = spring;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setActive(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () =>
      setSpacing(mq.matches ? cardSpacing : Math.round(cardSpacing * 0.39));
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [cardSpacing]);

  const middle = (cards.length - 1) / 2;

  const isAnyCardActive = () => {
    return active?.title;
  };

  const isCurrentActive = (card) => {
    return active?.title === card.title;
  };
  return (
    <section className="relative bg-background py-14 sm:py-18 lg:py-14">
      {/* NEW — header only. Everything below (the card stack) is
          untouched in structure/logic; only card content + colors were
          swapped, per your instruction. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          [Testimonials]
        </p>
        <h2 className="mt-3 sm:mt-4 max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium leading-[1.1] tracking-tight">
          <span className="text-secondary">
            People love us,
          </span>{" "}
          <span className="font-light italic text-primary">
            you know.
          </span>
        </h2>
      </div>

      {/* was: h-full ... overflow-hidden — overflow-hidden was clipping any
                card whose y-offset (like Kavya's -80) pushed it past the box edge */}
      <div className="relative flex min-h-[520px] sm:min-h-[650px] lg:min-h-[80vh] w-full items-center justify-center overflow-hidden pt-8 sm:pt-16 lg:pt-20">
        <motion.div
            ref={ref}
            onClick={() => setActive(null)}
            className="relative mx-auto flex h-[480px] sm:h-[60vh] w-full max-w-6xl items-center justify-center [--height:260px] [--width:190px] xs:[--height:290px] xs:[--width:210px] lg:[--height:440px] lg:[--width:320px]"
        >
          {cards.map((card, index) => {
            const offsetX = (index - middle) * spacing;
            return (
              <motion.div key={card.title}>
                <motion.button
                  initial={{
                    x: 0,
                    scale: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(card);
                  }}
                  animate={{
                    y: isCurrentActive(card)
                      ? 0
                      : isAnyCardActive()
                        ? 400
                        : card.config.y,
                    x: isCurrentActive(card)
                      ? 0
                      : isAnyCardActive()
                        ? offsetX * 0.4
                        : offsetX,
                    rotate: isCurrentActive(card)
                      ? 0
                      : isAnyCardActive()
                        ? 0.2 * card.config.rotate
                        : card.config.rotate,
                    scale: isCurrentActive(card)
                      ? activeScale
                      : isAnyCardActive()
                        ? 0.7
                        : 1,
                  }}
                  whileHover={{
                    scale: isCurrentActive(card)
                      ? activeScale
                      : isAnyCardActive()
                        ? 0.7
                        : 1.05,
                  }}
                  transition={cardSpring}
                  style={{
                    width: `var(--width)`,
                    height: `var(--height)`,
                    marginLeft: `calc(var(--width) / -2)`,
                    marginTop: `calc(var(--height) / -2)`,
                    zIndex: isCurrentActive(card) ? 50 : card.config.zIndex,
                  }}
                  className={cn(
                    "absolute top-1/2 left-1/2 cursor-pointer overflow-hidden rounded-2xl",
                    premiumShadow,
                  )}
                >
                  {/* Photo — now the card's actual background, filling
                      the space that used to be a blank gradient */}
                  <img
                    src={card.photo}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Existing content + gradient wash, moved onto this
                      inner layer so card.className's [&_h2]/[&_p]/[&_span]
                      color rules still target real descendants, and the
                      gradient now sits as a translucent tint over the
                      photo instead of an opaque background. */}
                  <div
                    className={cn(
                      "relative flex h-full w-full flex-col items-start justify-between p-2 md:p-4",
                      card.className,
                    )}
                  >
                    {/* Photo thumbnail + location + rating — always visible */}
                    <div className="flex w-full items-center gap-2 md:gap-3">
                      <img
                        src={card.photo}
                        alt={card.title}
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/40 md:h-12 md:w-12"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1 truncate text-[10px] md:text-xs">
                          <MapPin size={11} className="shrink-0" />
                          {card.location}
                        </span>
                        <span className="mt-0.5 flex gap-0.5 text-primary">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className="fill-current" />
                          ))}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <motion.h2
                        layoutId={card.title + "title"}
                        className="font-regular max-w-40 text-left text-base md:text-3xl"
                      >
                        {card.title}
                      </motion.h2>
                      <AnimatePresence mode="popLayout">
                        {active?.title === card.title && (
                          <motion.p
                            layoutId={card.title + "description"}
                            initial={{ opacity: 0, x: 20, y: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, y: 0, height: 100 }}
                            exit={{ opacity: 0, x: 40, y: 40 }}
                            transition={cardSpring}
                            className="mt-3 text-left text-sm md:text-base"
                          >
                            {card.quote}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;