import React, { useEffect, useRef, useState } from "react";
import { Soundwave } from "react-bootstrap-icons";

import {
  ExtraControls,
  PlayerControls,
  Progress,
  SongDetails,
  Volume,
} from "./components";
import songs from "./data/songs";

class AudioAnalyser {
  constructor(audioElement) {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.source = this.context.createMediaElementSource(audioElement);
    this.analyserNode = this.context.createAnalyser();
    this.source.connect(this.analyserNode);
    this.analyserNode.connect(this.context.destination);
  }
}

const App = () => {
  const audioRef = useRef();
  const [playlist, setPlaylist] = useState(songs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [songLength, setSongLength] = useState(0);
  const [songFinished, setSongFinished] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const [analyser, setAnalyser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [visualizer, setVisualizer] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState(songs);

  const onTimeUpdate = () => {
    console.log("TIME UPDATE");
    const audio = audioRef.current;
    const currentTime = audio.currentTime;
    const progress = currentTime
      ? Number(((currentTime * 100) / audio.duration).toFixed(1))
      : 0;
    setTimeElapsed(currentTime);

    !dragging && setProgress(progress);
  };

  const onLoadedData = async () => {
    /* Updates the song length when the audio data is loaded */
    console.log("LOADED DATA");
    const audio = audioRef.current;
    !analyser && setAnalyser(new AudioAnalyser(audio));
    setTimeElapsed(audio.currentTime);
    setSongLength(audio.duration);
  };

  const onEnded = () => {
    console.log("FINISHED");
    setSongFinished(true);
  };

  const playSong = async () => {
    await analyser.context.resume();
    setIsPlaying(true);
    await audioRef.current.play();
  };

  const shufflePlaylist = () => {
    setShuffledPlaylist((playlist) => {
      if (playlist.length === 1) return playlist;

      const newPlaylist = playlist.filter(
        (song) => song.id !== playlist[currentSongIndex].id
      );

      let shuffledPlaylist = newPlaylist.sort(() => Math.random() - 0.5);

      shuffledPlaylist = [playlist[currentSongIndex], ...shuffledPlaylist];

      return shuffledPlaylist;
    });
  };

  const next = () => {
    const currentSongId = playlist[currentSongIndex].id;
    const newPlaylist = shuffle ? shuffledPlaylist : songs;
    setPlaylist(newPlaylist);
    setCurrentSongIndex(() => {
      const currentSongIndex = newPlaylist.findIndex(
        (song) => song.id === currentSongId
      );
      const prevIndex = currentSongIndex - 1;
      const newIndex = prevIndex < 0 ? newPlaylist.length - 1 : prevIndex;
      return newIndex;
    });
    playSong();
  };

  const prev = () => {
    const currentSongId = playlist[currentSongIndex].id;
    const newPlaylist = shuffle ? shuffledPlaylist : songs;
    setPlaylist(newPlaylist);
    setCurrentSongIndex(() => {
      const currentSongIndex = newPlaylist.findIndex(
        (song) => song.id === currentSongId
      );
      const prevIndex = currentSongIndex - 1;
      const newIndex = prevIndex < 0 ? newPlaylist.length - 1 : prevIndex;
      return newIndex;
    });
    playSong();
  };

  const updateCurrentTime = (value) => {
    const audio = audioRef.current;
    const currentTime = (value * audio.duration) / 100;
    audio.currentTime = currentTime;
  };

  const progressSeekEnd = (e) => {
    updateCurrentTime(e.target.value);
    setDragging(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const playOrPause = async () => {
      if (isPlaying) {
        await analyser?.context?.resume();
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    };

    playOrPause();
  }, [isPlaying, analyser?.context]);

  useEffect(() => {
    if (shuffle) shufflePlaylist();
  }, [shuffle]);

  useEffect(() => {
    if (songFinished) {
      if (!repeat) next();
      setSongFinished(false);
    }
  }, [songFinished]);

  return (
    <div className="app">
      <audio
        src={playlist[currentSongIndex].src}
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedData={onLoadedData}
        onEnded={onEnded}
        loop={repeat}
        crossOrigin="anonymous"
      />
      <div className="layout">
        <SongDetails
          visualizer={visualizer}
          source={analyser?.source}
          analyser={analyser?.analyserNode}
          currentSongIndex={currentSongIndex}
          song={playlist[currentSongIndex]}
        />
        <ExtraControls>
          <Volume
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
          />
          <button
            aria-label={visualizer ? "Disable visualizer" : "Enable visualizer"}
            onClick={() => setVisualizer((prev) => !prev)}
          >
            <Soundwave color="var(--primary-color)" size={25} />
            {visualizer && <div className="dot" />}
          </button>
        </ExtraControls>
        <Progress
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          progressSeekStart={() => setDragging(true)}
          progressSeekEnd={progressSeekEnd}
          timeElapsed={formatTime(timeElapsed)}
          songLength={formatTime(songLength)}
        />
        <PlayerControls
          next={next}
          prev={prev}
          isPlaying={isPlaying}
          toggleIsPlaying={() => setIsPlaying((prevValue) => !prevValue)}
          shuffle={shuffle}
          toggleShuffle={() => setShuffle((prevValue) => !prevValue)}
          repeat={repeat}
          toggleRepeat={() => setRepeat((prevValue) => !prevValue)}
        />
      </div>
    </div>
  );
};

export default App;
