/** Longest a visitor waits on the arrival video (to start, and again for hiccups once playing). */
export const MAX_WAIT_MS = 5000;

/**
 * Plays an arrival video only once it is fully loaded, so it never freezes
 * part-way. Calls `skip` instead when it is not loaded in time, fails, stalls,
 * or the browser refuses to play it. Returns a cleanup function.
 */
export function playWhenReady(video: HTMLVideoElement, skip: () => void): () => void {
  let poll: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const stop = () => { clearInterval(poll); clearTimeout(deadline); };
  // Something else may press play (the browser's autoplay, a video component); keep it paused until ready.
  const hold = () => video.pause();
  const giveUp = () => { stop(); video.removeEventListener("play", hold); video.pause(); skip(); };
  let started = false;
  const start = () => {
    stop();
    started = true;
    video.removeEventListener("play", hold);
    deadline = setTimeout(giveUp, MAX_WAIT_MS);
    video.play().catch(giveUp);
  };
  // Once it is really playing, allow its remaining length plus the same grace before giving up on it.
  const playing = () => {
    if (!started) return;
    stop();
    deadline = setTimeout(giveUp, (video.duration - video.currentTime) * 1000 + MAX_WAIT_MS);
  };
  const loaded = () => video.duration > 0 && video.buffered.length > 0 && video.buffered.end(video.buffered.length - 1) >= video.duration - 0.1;
  // Network state 1 is "idle": the browser will not load any more while paused (iOS does this), so let it play.
  const ready = () => loaded() || video.networkState === 1;

  video.addEventListener("error", giveUp);
  video.addEventListener("ended", stop);
  video.addEventListener("playing", playing);
  if (video.error) giveUp();
  else if (ready()) start();
  else {
    video.addEventListener("play", hold);
    video.pause();
    poll = setInterval(() => { if (ready()) start(); }, 100);
    deadline = setTimeout(giveUp, MAX_WAIT_MS);
  }
  return () => { stop(); video.removeEventListener("error", giveUp); video.removeEventListener("ended", stop); video.removeEventListener("playing", playing); video.removeEventListener("play", hold); };
}
