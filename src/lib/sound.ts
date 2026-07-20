// Sunet de memento generat cu Web Audio (fara fisier audio, functioneaza offline).
// Doua tonuri scurte, ca un "ding-ding".

export function playReminderSound() {
  try {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const tones = [
      { at: 0, freq: 880 },
      { at: 0.18, freq: 1180 },
    ];
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = tone.freq;
      gain.gain.setValueAtTime(0.0001, now + tone.at);
      gain.gain.exponentialRampToValueAtTime(0.3, now + tone.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.at + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + tone.at);
      osc.stop(now + tone.at + 0.18);
    }
    window.setTimeout(() => ctx.close(), 600);
  } catch {
    /* audio indisponibil */
  }
}
