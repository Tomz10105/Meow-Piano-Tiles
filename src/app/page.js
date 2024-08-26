"use client";

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

const COLUMN_COUNT = 4;
const INITIAL_FALL_SPEED = 3;
const SPEED_INCREMENT = 0.5; // Speed increase every 1000 points
const GRADUAL_SPEED_MULTIPLIER = 1.0001; // Slight continuous speed increase

export default function Home() {
  const [tiles, setTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fallSpeed, setFallSpeed] = useState(INITIAL_FALL_SPEED);
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));

    audioRef.current = new Audio('/piano-note.mp3');
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startGame();
    } else {
      cancelAnimationFrame(animationFrameRef.current);
      stopSound();
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setFallSpeed(INITIAL_FALL_SPEED);
    setTiles([generateNewTile(0)]);
    audioRef.current.play();
    lastUpdateTimeRef.current = performance.now();
    gameLoop();
  };

  const generateNewTile = (yPosition) => ({
    id: Math.random(),
    column: Math.floor(Math.random() * COLUMN_COUNT),
    y: yPosition,
    tapped: false,
  });

  const gameLoop = (currentTime) => {
    const deltaTime = currentTime - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = currentTime;

    setTiles(prevTiles => {
      const gameAreaHeight = gameAreaRef.current.clientHeight;
      const tileHeight = gameAreaHeight / 4;

      let newTiles = prevTiles.map(tile => ({
        ...tile,
        y: tile.y + fallSpeed * (deltaTime / 16.67), // Adjust for frame rate
      }));

      // Add new tile if needed
      if (newTiles.length === 0 || newTiles[newTiles.length - 1].y > 0) {
        newTiles.push(generateNewTile(-tileHeight));
      }

      // Check for game over
      if (newTiles.some(tile => tile.y > gameAreaHeight && !tile.tapped)) {
        handleGameOver();
        return newTiles;
      }

      // Remove off-screen tiles
      newTiles = newTiles.filter(tile => tile.y < gameAreaHeight + tileHeight);

      return newTiles;
    });

    setScore(prevScore => {
      const newScore = prevScore + 1;
      // Increase speed based on score milestones and gradual increase
      setFallSpeed(prevSpeed => {
        const incrementalIncrease = Math.floor(newScore / 1000) * SPEED_INCREMENT;
        return (INITIAL_FALL_SPEED + incrementalIncrease) * Math.pow(GRADUAL_SPEED_MULTIPLIER, newScore);
      });
      return newScore;
    });

    if (!gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  const handleTileClick = (clickedTile) => {
    if (!clickedTile.tapped) {
      setTiles(prevTiles =>
        prevTiles.map(tile =>
          tile.id === clickedTile.id ? { ...tile, tapped: true } : tile
        )
      );
      setScore(prevScore => prevScore + 10);
    } else {
      handleGameOver();
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
    stopSound();
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', score.toString());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-600 to-purple-700 text-white p-4">
      <Head>
        <title>Piano Tiles Game</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <main className="text-center w-full max-w-md">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 md:mb-8 text-shadow">Piano Tiles</h1>
        <p className="text-lg md:text-xl mb-4 md:mb-6 text-shadow">Tap the black tiles before they reach the bottom!</p>

        {gameOver && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4 bg-white text-black p-4 md:p-6 rounded-lg shadow-lg"
          >
            <p className="text-2xl md:text-3xl font-bold">Game Over!</p>
            <p className="text-xl md:text-2xl">Final Score: {score}</p>
          </motion.div>
        )}

        {!isPlaying ? (
          <motion.button 
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 md:py-3 md:px-6 rounded-full text-lg md:text-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            onClick={() => setIsPlaying(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Game
          </motion.button>
        ) : (
          <div className="w-full">
            <p className="mb-2 md:mb-4 text-3xl md:text-4xl font-bold text-shadow">{score}</p>
            <div 
              ref={gameAreaRef}
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl mx-auto"
              style={{ height: '70vh', maxHeight: '600px', width: '100%', maxWidth: '400px' }}
            >
              {tiles.map((tile) => {
                const tileHeight = gameAreaRef.current ? gameAreaRef.current.clientHeight / 4 : 150;
                return (
                  <motion.div
                    key={tile.id}
                    className={`absolute ${tile.tapped ? 'bg-gray-700' : 'bg-white'} cursor-pointer`}
                    style={{
                      left: `${(tile.column / COLUMN_COUNT) * 100}%`,
                      top: `${tile.y}px`,
                      width: `${100 / COLUMN_COUNT}%`,
                      height: `${tileHeight}px`,
                    }}
                    onClick={() => handleTileClick(tile)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-4 md:mt-8 text-center text-white text-shadow">
        <p className="text-lg md:text-xl">High Score: {highScore}</p>
        <p className="mt-2 text-sm md:text-base">Created with Next.js and Tailwind CSS</p>
      </footer>
    </div>
  );
}