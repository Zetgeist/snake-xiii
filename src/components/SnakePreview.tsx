import React, { useRef, useEffect } from 'react';

export const SnakePreview = ({ color }: { color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const headColor = darkenColor(color, 30);
      
      const headShape = (() => {
        switch (color.toLowerCase()) {
          case '#f425af': return 'heart';
          case '#06b6d4': return 'diamond';
          case '#10b981': return 'triangle';
          case '#f59e0b': return 'star';
          case '#8b5cf6': return 'square';
          default: return 'circle';
        }
      })();

      // Draw body
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 10;
      
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = Math.sin(frame * 0.05 + i * 0.3) * 0.5;
        points.push({
          x: centerX - i * 8,
          y: centerY + angle * 10
        });
      }

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Draw head
      const head = points[0];
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(Math.sin(frame * 0.05) * 0.5);
      ctx.fillStyle = headColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = headColor;
      
      const size = 12;
      ctx.beginPath();
      switch (headShape) {
        case 'heart':
          ctx.moveTo(0, -size);
          ctx.bezierCurveTo(size, -size * 1.5, size * 1.5, 0, 0, size);
          ctx.bezierCurveTo(-size * 1.5, 0, -size, -size * 1.5, 0, -size);
          break;
        case 'diamond':
          ctx.moveTo(size, 0); ctx.lineTo(0, size); ctx.lineTo(-size, 0); ctx.lineTo(0, -size);
          break;
        case 'triangle':
          ctx.moveTo(size, 0); ctx.lineTo(-size, size); ctx.lineTo(-size, -size);
          break;
        case 'square':
          ctx.rect(-size/2, -size/2, size, size);
          break;
        case 'star':
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((i * 2 * Math.PI) / 5) * size, Math.sin((i * 2 * Math.PI) / 5) * size);
            ctx.lineTo(Math.cos(((i + 0.5) * 2 * Math.PI) / 5) * (size / 2), Math.sin(((i + 0.5) * 2 * Math.PI) / 5) * (size / 2));
          }
          break;
        default:
          ctx.arc(0, 0, size, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [color]);

  return <canvas ref={canvasRef} width={96} height={96} className="w-full h-full" />;
};
