import React, { useEffect } from 'react';

interface ConfettiWebGLProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

export const ConfettiWebGL: React.FC<ConfettiWebGLProps> = ({ 
  isActive, 
  onComplete, 
  duration = 3000,
  particleCount = 50 
}) => {
  useEffect(() => {
    if (!isActive) return;

    console.log('🎉 Starting CSS confetti animation!');
    
    // Create confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.id = 'confetti-container';
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
      overflow: hidden;
    `;

    // Colors for confetti
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff6b6b'];
    
    // Create particles
    const particles: HTMLElement[] = [];
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 20 + 15; // 15-35px
      const left = Math.random() * 100; // 0-100%
      const delay = Math.random() * 0.5; // 0-0.5s delay
      
      particle.style.cssText = `
        position: absolute;
        top: -50px;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        transform: rotate(${Math.random() * 360}deg);
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall ${duration}ms linear ${delay}s forwards;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      `;
      
      confettiContainer.appendChild(particle);
      particles.push(particle);
    }

    // Add CSS animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Add container to body
    document.body.appendChild(confettiContainer);
    
    console.log('🎯 Created', particleCount, 'CSS confetti particles');

    // Clean up after animation
    setTimeout(() => {
      if (confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      console.log('🎉 CSS confetti animation completed!');
      onComplete?.();
    }, duration + 1000);

  }, [isActive, duration, particleCount, onComplete]);

  // Return null since we use DOM manipulation
  return null;
};

export default ConfettiWebGL;