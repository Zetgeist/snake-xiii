import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

interface GameEngineProps {
  onScoreUpdate: (score: number, speedLevel: number) => void;
  onGameOver: (win?: boolean) => void;
  isPaused: boolean;
  radius: number;
  skinColor: string;
  controlMode: 'keyboard' | 'mouse';
  difficulty: Difficulty;
}

const INITIAL_SPEEDS = {
  easy: 2,
  medium: 3,
  hard: 4.5
};

const SPEED_INCREMENTS = {
  easy: 1.10,
  medium: 1.15,
  hard: 1.20
};

const TURN_SPEED = 0.08;
const SEGMENT_DISTANCE = 8;
const INITIAL_LENGTH = 15;
const HEAD_RADIUS = 14;
const WIN_COUNT = 13;

// Helper to darken color
const darkenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
};

export const GameEngine: React.FC<GameEngineProps> = ({ onScoreUpdate, onGameOver, isPaused, radius, skinColor, controlMode, difficulty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const itemsEatenRef = useRef(0);
  const scoreRef = useRef(0);
  
  // Game state refs to avoid re-renders
  const snakeRef = useRef<Point[]>([]);
  const angleRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEEDS[difficulty]);
  const lastEatTimeRef = useRef(Date.now());
  const foodRef = useRef<Point>({ x: 0, y: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  const headShape = useMemo(() => {
    switch (skinColor.toLowerCase()) {
      case '#f425af': return 'heart';
      case '#06b6d4': return 'diamond';
      case '#10b981': return 'triangle';
      case '#f59e0b': return 'star';
      case '#8b5cf6': return 'square';
      default: return 'circle';
    }
  }, [skinColor]);

  const headColor = useMemo(() => darkenColor(skinColor, 30), [skinColor]);

  const spawnFood = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (radius - 40);
    foodRef.current = {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist
    };
  }, [radius]);

  const resetGame = useCallback(() => {
    snakeRef.current = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      snakeRef.current.push({ x: -i * SEGMENT_DISTANCE, y: 0 });
    }
    angleRef.current = 0;
    speedRef.current = INITIAL_SPEEDS[difficulty];
    lastEatTimeRef.current = Date.now();
    itemsEatenRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    onScoreUpdate(0, 1);
    spawnFood();
  }, [onScoreUpdate, spawnFood, difficulty]);

  useEffect(() => {
    resetGame();
    
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      // Mouse position relative to arena center
      mousePosRef.current = {
        x: e.clientX - rect.left - radius,
        y: e.clientY - rect.top - radius
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resetGame, radius]);

  const update = useCallback(() => {
    if (isPaused) return;

    if (controlMode === 'keyboard') {
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) angleRef.current -= TURN_SPEED;
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) angleRef.current += TURN_SPEED;
    } else {
      // Mouse control
      const head = snakeRef.current[0];
      if (head) {
        const targetAngle = Math.atan2(mousePosRef.current.y - head.y, mousePosRef.current.x - head.x);
        let diff = targetAngle - angleRef.current;
        
        // Normalize angle difference to [-PI, PI]
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        // Smoothly rotate towards target angle, limited by TURN_SPEED
        if (Math.abs(diff) > TURN_SPEED) {
          angleRef.current += Math.sign(diff) * TURN_SPEED;
        } else {
          angleRef.current = targetAngle;
        }
      }
    }

    const head = snakeRef.current[0];
    const newHead = {
      x: head.x + Math.cos(angleRef.current) * speedRef.current,
      y: head.y + Math.sin(angleRef.current) * speedRef.current
    };

    // Check boundary (tighter collision)
    const distFromCenter = Math.sqrt(newHead.x * newHead.x + newHead.y * newHead.y);
    if (distFromCenter > radius - (HEAD_RADIUS * 0.5)) {
      onGameOver(false);
      return;
    }

    // Check self collision (skip first few segments)
    // Mouth collision: check if head is close to any body segment
    // Skip first 6 segments (approx 48px along path) to avoid colliding with "neck"
    // Collision threshold 12 accounts for head and segment sizes
    for (let i = 6; i < snakeRef.current.length; i++) {
      const seg = snakeRef.current[i];
      const dist = Math.sqrt((newHead.x - seg.x) ** 2 + (newHead.y - seg.y) ** 2);
      if (dist < 12) {
        onGameOver(false);
        return;
      }
    }

    // Check food
    const distToFood = Math.sqrt((newHead.x - foodRef.current.x) ** 2 + (newHead.y - foodRef.current.y) ** 2);
    if (distToFood < 18) {
      const now = Date.now();
      const timeSinceLastEat = now - lastEatTimeRef.current;
      lastEatTimeRef.current = now;

      itemsEatenRef.current += 1;
      const currentItemsEaten = itemsEatenRef.current;
      
      // Increase speed incrementally based on difficulty
      speedRef.current *= SPEED_INCREMENTS[difficulty];

      // Multiplier based on speed of eating: faster = higher multiplier
      const speedBonus = Math.max(0, Math.floor(200 * (1 - Math.min(1, timeSinceLastEat / 5000))));
      const points = 100 + speedBonus;
      scoreRef.current += points;
      
      const newScore = scoreRef.current;
      setScore(newScore);
      onScoreUpdate(newScore, currentItemsEaten + 1);

      if (currentItemsEaten >= WIN_COUNT) {
        onGameOver(true);
        return;
      }

      spawnFood();
      // Grow snake
      for (let i = 0; i < 8; i++) {
        snakeRef.current.push({ ...snakeRef.current[snakeRef.current.length - 1] });
      }
    }

    // Move body
    const newSnake = [newHead];
    let prev = newHead;
    for (let i = 1; i < snakeRef.current.length; i++) {
      const curr = snakeRef.current[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > SEGMENT_DISTANCE) {
        const angle = Math.atan2(dy, dx);
        newSnake.push({
          x: prev.x - Math.cos(angle) * SEGMENT_DISTANCE,
          y: prev.y - Math.sin(angle) * SEGMENT_DISTANCE
        });
        prev = newSnake[newSnake.length - 1];
      } else {
        newSnake.push(curr);
        prev = curr;
      }
    }
    snakeRef.current = newSnake;
  }, [isPaused, onGameOver, onScoreUpdate, spawnFood, radius]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Draw food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0bda87';
    ctx.fillStyle = '#0bda87';
    ctx.beginPath();
    ctx.arc(foodRef.current.x, foodRef.current.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake body as a connected line
    if (snakeRef.current.length > 1) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = skinColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw body segments
      for (let i = 0; i < snakeRef.current.length - 1; i++) {
        const p1 = snakeRef.current[i];
        const p2 = snakeRef.current[i + 1];
        const opacity = Math.max(0.1, 1 - i / snakeRef.current.length);
        const width = Math.max(4, 14 - i * 0.2);
        
        ctx.beginPath();
        ctx.strokeStyle = `${skinColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = width;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Draw head
    const head = snakeRef.current[0];
    if (head) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = headColor;
      ctx.fillStyle = headColor;
      
      const headAngle = angleRef.current;
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(headAngle);

      ctx.beginPath();
      switch (headShape) {
        case 'heart':
          ctx.moveTo(0, -HEAD_RADIUS);
          ctx.bezierCurveTo(HEAD_RADIUS, -HEAD_RADIUS * 1.5, HEAD_RADIUS * 1.5, 0, 0, HEAD_RADIUS);
          ctx.bezierCurveTo(-HEAD_RADIUS * 1.5, 0, -HEAD_RADIUS, -HEAD_RADIUS * 1.5, 0, -HEAD_RADIUS);
          break;
        case 'diamond':
          ctx.moveTo(HEAD_RADIUS, 0);
          ctx.lineTo(0, HEAD_RADIUS);
          ctx.lineTo(-HEAD_RADIUS, 0);
          ctx.lineTo(0, -HEAD_RADIUS);
          break;
        case 'triangle':
          ctx.moveTo(HEAD_RADIUS, 0);
          ctx.lineTo(-HEAD_RADIUS, HEAD_RADIUS);
          ctx.lineTo(-HEAD_RADIUS, -HEAD_RADIUS);
          break;
        case 'square':
          ctx.rect(-HEAD_RADIUS/2, -HEAD_RADIUS/2, HEAD_RADIUS, HEAD_RADIUS);
          break;
        case 'star':
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((i * 2 * Math.PI) / 5) * HEAD_RADIUS, Math.sin((i * 2 * Math.PI) / 5) * HEAD_RADIUS);
            ctx.lineTo(Math.cos(((i + 0.5) * 2 * Math.PI) / 5) * (HEAD_RADIUS / 2), Math.sin(((i + 0.5) * 2 * Math.PI) / 5) * (HEAD_RADIUS / 2));
          }
          break;
        default:
          ctx.arc(0, 0, HEAD_RADIUS, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      const eyeOffset = 4;
      const eyeSize = 2;
      
      // Left eye
      ctx.beginPath();
      ctx.arc(eyeOffset, eyeOffset, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.arc(eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    ctx.restore();
  }, [skinColor]);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      width={radius * 2}
      height={radius * 2}
      className="w-full h-full"
    />
  );
};
