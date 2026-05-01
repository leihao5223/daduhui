import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { banner01, banner02, banner03, banner04, banner05 } from '../gameAssets';

const banners = [
  {
    id: 1,
    image: banner01,
    title: '快餐',
    subtitle: '199',
  },
  {
    id: 2,
    image: banner02,
    title: '包夜',
    subtitle: '999',
  },
  {
    id: 3,
    image: banner03,
    title: '跑单',
    subtitle: '打成狗',
  },
  {
    id: 4,
    image: banner04,
    title: '射完',
    subtitle: '赶紧走',
  },
  {
    id: 5,
    image: banner05,
    title: '',
    subtitle: '',
  },
];

const Banner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="banner-section">
      <div className="banner-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={banners[currentIndex].id}
            className="banner-slide"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            style={{ backgroundImage: `url(${banners[currentIndex].image})` }}
          >
            <div className="banner-overlay"></div>
            <div className="banner-content">
              {banners[currentIndex].title ? (
                <motion.h2
                  className="banner-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {banners[currentIndex].title}
                </motion.h2>
              ) : null}
              {banners[currentIndex].subtitle ? (
                <motion.p
                  className="banner-subtitle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {banners[currentIndex].subtitle}
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
                立即体验
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`切换到第 ${index + 1} 张`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Banner;
