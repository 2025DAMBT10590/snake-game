import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Trophy, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const GAME_SPEED = 120;

const TRACKS = [
  { id: 1, title: 'Neon Drive', artist: 'AI Generated', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cybernetic Pulse', artist: 'AI Generated', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Retro Glitch', artist: 'AI Generated', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // --- Audio Player State ---
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Handle Track End
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    };
    audio?.addEventListener('ended', handleEnded);
    return () => audio?.removeEventListener('ended', handleEnded);
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrack((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1));


  // --- Snake Game State ---
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const dirRef = useRef(direction);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { dirRef.current = direction; }, [direction]);

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when playing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dirRef.current.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dirRef.current.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dirRef.current.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dirRef.current.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ': // Spacebar to pause game
          setGamePaused(prev => !prev);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Game Loop
  useEffect(() => {
    if (gameOver || gamePaused) return;

    const intervalId = setInterval(() => {
      const head = snakeRef.current[0];
      const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        handleGameOver();
        return;
      }

      // Self collision
      if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];

      // Eat Food
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore(s => s + 10);
        // Spawn food not on snake
        let newFx, newFy;
        while (true) {
          newFx = Math.floor(Math.random() * GRID_SIZE);
          newFy = Math.floor(Math.random() * GRID_SIZE);
          // eslint-disable-next-line
          if (!newSnake.some(s => s.x === newFx && s.y === newFy)) break;
        }
        setFood({ x: newFx, y: newFy });
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, GAME_SPEED);

    return () => clearInterval(intervalId);
  }, [gameOver, gamePaused]);

  const handleGameOver = () => {
    setGameOver(true);
    setHighScore(prev => Math.max(prev, scoreRef.current));
  };
  
  // Need to sync score for handleGameOver
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setGamePaused(false);
    setFood({ x: 5, y: 5 });
  };

  return (
    <div className="min-h-screen bg-black text-white font-['VT323'] p-4 flex flex-col xl:flex-row items-center justify-center gap-16 uppercase overflow-hidden relative w-full">
      <div className="crt-overlay"></div>
      <div className="scanline"></div>
      <div className="static-noise"></div>

      <audio ref={audioRef} src={TRACKS[currentTrack].url} preload="auto" />

      {/* Main Game Section */}
      <div className="flex flex-col items-center z-10 w-full max-w-lg mt-10 md:mt-0">
        <h1 className="text-6xl md:text-7xl font-bold mb-8 glitch-text tracking-widest text-center" data-text="SYSTEM.SNAKE_EXE">
          SYSTEM.SNAKE_EXE
        </h1>

        {/* Game Stats */}
        <div className="flex w-full justify-between items-center mb-6 px-4 text-2xl md:text-3xl">
          <div className="flex items-center gap-2 border-b-2 border-[#0ff] pb-1">
            <span className="text-[#0ff]">SEQ_SCORE:</span>
            <span className="text-white bg-[#f0f] px-2 ml-2">{score}</span>
          </div>
          <div className="flex items-center gap-2 border-b-2 border-[#f0f] pb-1">
            <span className="text-[#f0f]">MAX_OVERRIDE:</span>
            <span className="text-white bg-[#0ff] px-2 ml-2">{highScore}</span>
            <Trophy className="w-6 h-6 text-[#0ff] ml-2 hidden sm:block" />
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative brutal-border bg-black p-2 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px]">
          {/* Game Canvas / Grid */}
          <div 
            className="game-grid relative w-full h-full bg-black/90"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {/* Snake */}
            {snake.map((segment, i) => (
              <div
                key={i}
                className={`w-full h-full ${i === 0 ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-[#0ff]'}`}
                style={{
                  gridColumn: segment.x + 1,
                  gridRow: segment.y + 1,
                }}
              />
            ))}
            {/* Food */}
            <div
              className="w-full h-full bg-[#f0f] animate-ping"
              style={{
                gridColumn: food.x + 1,
                gridRow: food.y + 1,
              }}
            />
          </div>

          {/* Overlays */}
          {gameOver && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/85 flex flex-col items-center justify-center z-20 text-center border-4 border-[#f0f]">
              <h2 className="text-5xl md:text-6xl text-[#f0f] glitch-text mb-4" data-text="FATAL_ERROR">FATAL_ERROR</h2>
              <p className="text-2xl md:text-3xl text-[#0ff] bg-black px-4 py-2 border-2 border-[#0ff] mb-8">CYCLES_COMPLETED: {score}</p>
              <button 
                onClick={resetGame}
                className="text-3xl bg-[#0ff] text-black px-8 py-3 hover:bg-[#f0f] hover:text-white transition-none uppercase border-4 border-white flex items-center gap-4 cursor-pointer active:translate-y-1 active:translate-x-1"
              >
                <RotateCcw className="w-8 h-8" />
                REBOOT_SEQ
              </button>
            </div>
          )}
          
          {gamePaused && !gameOver && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/75 flex items-center justify-center z-20 border-4 border-white">
              <h2 className="text-5xl font-bold tracking-widest text-[#0ff] glitch-text" data-text="PROCESS_PAUSED">PROCESS_PAUSED</h2>
            </div>
          )}
        </div>
        
        <p className="text-[#f0f] mt-6 text-xl tracking-widest flex items-center gap-2 border border-[#f0f] p-2 bg-black/50">
          <span className="animate-pulse">_</span> INPUT: [ARROWS/WASD] | HALT: [SPACE]
        </p>
      </div>

      {/* Side Music Player Widget */}
      <div className="w-full max-w-sm md:w-[400px] brutal-border-magenta bg-black p-8 flex flex-col items-center gap-8 z-10 relative">
        <div className="w-full bg-[#f0f] text-black px-4 py-2 text-2xl flex justify-between font-bold border-b-4 border-white">
          <span>AUDIO_DECODER</span>
          <span className="animate-pulse">_</span>
        </div>
        
        {/* Cover Art Placeholder */}
        <div className="relative w-56 h-56 border-8 border-[#0ff] bg-black overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-40 flex items-center justify-center text-[#f0f] text-3xl font-bold p-4 text-center break-all" style={{ wordBreak: 'break-all' }}>
            {isPlaying ? "01010101 01001011" : "AWAITING_SIGNAL"}
          </div>
          <Music className={`w-24 h-24 text-[#0ff] relative z-10 ${isPlaying ? 'animate-bounce' : ''}`} />
          {isPlaying && (
            <div className="absolute w-full h-2 bg-[#f0f] top-1/2 left-0 animate-[scan_2s_linear_infinite]" style={{mixBlendMode: 'difference'}}></div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center w-full bg-white text-black py-4 px-2 border-l-8 border-r-8 border-[#0ff] relative">
          <h3 className="font-bold text-3xl truncate px-2 mb-2">
            {TRACKS[currentTrack].title}
          </h3>
          <p className="text-[#f0f] text-xl bg-black inline-block px-4 py-1 border-2 border-[#f0f]">
            {TRACKS[currentTrack].artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex w-full justify-between items-center bg-[#0ff] text-black p-2 border-4 border-white relative">
          <button 
            onClick={prevTrack}
            className="hover:bg-black hover:text-[#0ff] p-4 border-2 border-transparent hover:border-[#0ff] transition-none cursor-pointer active:translate-y-1"
          >
            <SkipBack className="w-10 h-10" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="hover:bg-black hover:text-[#f0f] p-4 border-2 border-transparent hover:border-[#f0f] transition-none cursor-pointer active:translate-y-1 bg-black text-white"
          >
            {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
          </button>
          
          <button 
            onClick={nextTrack}
            className="hover:bg-black hover:text-[#0ff] p-4 border-2 border-transparent hover:border-[#0ff] transition-none cursor-pointer active:translate-y-1"
          >
            <SkipForward className="w-10 h-10" />
          </button>
        </div>

        {/* Volume / Visualizer fake */}
        <div className="w-full flex items-center gap-4 text-[#0ff] mt-2 bg-black border-2 border-[#f0f] p-3">
          <Volume2 className="w-8 h-8" />
          <div className="flex-1 h-6 border-2 border-[#0ff] flex p-1">
            {isPlaying ? (
              <div className="h-full bg-[#f0f] w-[78%] animate-pulse" />
            ) : (
                <div className="h-full bg-slate-800 w-[78%]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
