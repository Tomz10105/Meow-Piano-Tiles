"use client";

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

const COLUMN_COUNT = 4;
const TILE_HEIGHT = 150;
const INITIAL_FALL_SPEED = 2;

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
    setTiles([generateNewTile()]);
    audioRef.current.play();
    gameLoop();
  };

  const generateNewTile = () => ({
    column: Math.floor(Math.random() * COLUMN_COUNT),
    y: -TILE_HEIGHT,
    tapped: false,
  });

  const gameLoop = () => {
    setTiles(prevTiles => {
      const newTiles = prevTiles.map(tile => ({
        ...tile,
        y: tile.y + fallSpeed,
      }));

      if (newTiles[newTiles.length - 1].y > 0) {
        newTiles.push(generateNewTile());
      }

      // Check if any untapped tile has passed the bottom of the game area
      if (newTiles.some(tile => tile.y > gameAreaRef.current.clientHeight && !tile.tapped)) {
        handleGameOver();
        return newTiles;
      }

      return newTiles.filter(tile => tile.y < gameAreaRef.current.clientHeight + TILE_HEIGHT);
    });

    setScore(prevScore => {
      const newScore = prevScore + 1;
      setFallSpeed(INITIAL_FALL_SPEED + Math.floor(newScore / 100));
      return newScore;
    });

    if (!gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleTileClick = (index) => {
    const clickedTile = tiles[index];
    if (!clickedTile.tapped) {
      setTiles(prevTiles =>
        prevTiles.map((tile, idx) =>
          idx === index ? { ...tile, tapped: true } : tile
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <Head>
        <title>Piano Tiles Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="text-center">
        <h1 className="text-6xl font-bold mb-8 text-shadow">Piano Tiles</h1>
        <p className="text-xl mb-6 text-shadow">Tap the black tiles before they reach the bottom!</p>

        {gameOver && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4 bg-white text-black p-6 rounded-lg shadow-lg"
          >
            <p className="text-3xl font-bold">Game Over!</p>
            <p className="text-2xl">Final Score: {score}</p>
          </motion.div>
        )}

        {!isPlaying ? (
          <motion.button 
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-full text-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            onClick={() => setIsPlaying(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Game
          </motion.button>
        ) : (
          <div>
            <p className="mb-4 text-4xl font-bold text-shadow">{score}</p>
            <div 
              ref={gameAreaRef}
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
              style={{ height: '600px', width: `${COLUMN_COUNT * TILE_HEIGHT}px` }}
            >
              {tiles.map((tile, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${tile.tapped ? 'bg-gray-700' : 'bg-white'} cursor-pointer`}
                  style={{
                    left: `${tile.column * TILE_HEIGHT}px`,
                    top: `${tile.y}px`,
                    width: `${TILE_HEIGHT}px`,
                    height: `${TILE_HEIGHT}px`,
                  }}
                  onClick={() => handleTileClick(index)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-white text-shadow">
        <p>High Score: {highScore}</p>
        <p className="mt-2">Created with Next.js and Tailwind CSS</p>
      </footer>
    </div>
  );
}