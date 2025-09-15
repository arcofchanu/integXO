import React, { useRef, useEffect } from 'react';

export const LiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: {
      x: number;
      y: number;
      prevX: number;
      prevY: number;
      life: number;
      maxLife: number;
    }[] = [];
    const particleCount = 700;
    let time = 0;
    
    const resizeCanvas = () => {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const p = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                prevX: 0,
                prevY: 0,
                life: 0,
                maxLife: Math.random() * 150 + 50
            };
            p.prevX = p.x;
            p.prevY = p.y;
            particles.push(p);
        }
    };
    
    const resetParticle = (p: typeof particles[0]) => {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.prevX = p.x;
        p.prevY = p.y;
        p.life = 0;
    };
    
    const animate = () => {
      time++;
      
      // Use a low-alpha fill to create motion trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(229, 231, 235, 0.4)';
      ctx.lineWidth = 0.5;

      particles.forEach(p => {
        // A unique flow field using sine and cosine waves for a smoke-like effect
        const scaleX = 0.003;
        const scaleY = 0.006;
        const timeScale = 0.0005;
        
        const angle = Math.sin(p.x * scaleX + time * timeScale) * Math.PI + Math.cos(p.y * scaleY) * Math.PI;
        const speed = 1;

        p.prevX = p.x;
        p.prevY = p.y;
        
        p.x += Math.cos(angle) * speed;
        p.y += Math.sin(angle) * speed;
        
        p.life++;
        
        // Reset particle if it goes off-screen or its life ends
        if (p.x > canvas.width || p.x < 0 || p.y > canvas.height || p.y < 0 || p.life > p.maxLife) {
            resetParticle(p);
        }

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentElement) {
        resizeObserver.unobserve(canvas.parentElement);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};
