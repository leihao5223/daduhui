import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { homeBannerSlides, homeContent } from '../content/home';

const Banner: React.FC = () => {
  const slides = [...homeBannerSlides];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="banner-section">
      <div className="banner-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[currentIndex].id}
            className="banner-slide"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
          >
            <div className="banner-overlay"></div>
            <div className="banner-content">
              {slides[currentIndex].title ? (
                <motion.h2
                  className="banner-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {slides[currentIndex].title}
                </motion.h2>
              ) : null}
              {slides[currentIndex].subtitle ? (
                <motion.p
                  className="banner-subtitle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {slides[currentIndex].subtitle}
                </motion.p>
              ) : null}
              <motion.button
                type="button"
                className="banner-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {homeContent.bannerCta}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="banner-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={homeContent.bannerDotAria(index + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Banner;
