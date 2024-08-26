"use client";

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import PianoTile from '@/components/PianoTile';

const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];

export default function Home() {
  const [activeTile, setActiveTile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [showSequence, setShowSequence] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/piano-note.mp3');
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
  }, []);

  const playNote = (note, index) => {
    setActiveTile(note);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    if (isPlaying && !showSequence) {
      const newPlayerSequence = [...playerSequence, note];
      setPlayerSequence(newPlayerSequence);

      if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
        handleWrongNote();
      } else if (newPlayerSequence.length === sequence.length) {
        handleCorrectSequence();
      }
    }
  };

  const handleWrongNote = () => {
    setLives(lives - 1);
    if (lives - 1 === 0) {
      endGame();
    } else {
      setPlayerSequence([]);
      playSequence();
    }
  };

  const handleCorrectSequence = () => {
    const newScore = score + level * 10;
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('highScore', newScore.toString());
    }
    setLevel(level + 1);
    startNewRound();
  };

  const endGame = () => {
    setIsPlaying(false);
    setLevel(1);
    setLives(3);
    setScore(0);
  };

  useEffect(() => {
    if (activeTile) {
      const timer = setTimeout(() => setActiveTile(null), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTile]);

  const startNewRound = () => {
    setPlayerSequence([]);
    const newSequence = Array(level + 3).fill().map(() => ({
      note: notes[Math.floor(Math.random() * notes.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setSequence(newSequence);
    playSequence();
  };

  const playSequence = () => {
    setShowSequence(true);
    sequence.forEach((item, index) => {
      setTimeout(() => {
        setActiveTile(item.note);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }, index * (800 - level * 50));
    });
    setTimeout(() => {
      setShowSequence(false);
      setActiveTile(null);
    }, sequence.length * (800 - level * 50));
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setLevel(1);
    setLives(3);
    startNewRound();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Piano Tiles Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="text-center">
        <h1 className="text-4xl font-bold mb-8">Piano Tiles Game</h1>
        <p className="text-lg mb-6">Wear Headset to listen to the Music</p>
        
        {!isPlaying ? (
          <button 
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded mb-8"
            onClick={startGame}
          >
            Start Game
          </button>
        ) : (
          <div>
            <p className="mb-4">Score: {score} | High Score: {highScore}</p>
            <p className="mb-4">Level: {level} | Lives: {lives}</p>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {notes.map((note, index) => (
                <PianoTile
                  key={note}
                  note={note}
                  active={activeTile === note}
                  color={sequence[playerSequence.length]?.color}
                  onClick={() => playNote(note, index)}
                  disabled={showSequence}
                  className="h-32 w-20"
                />
              ))}
            </div>
            <p>{showSequence ? "Watch the sequence!" : "Repeat the sequence!"}</p>
          </div>
        )}
      </main>


    </div>
  );
}
