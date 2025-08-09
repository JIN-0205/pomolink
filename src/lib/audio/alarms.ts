import type { AlarmPreset } from "./types";

const presets: Record<
  AlarmPreset,
  (ctx: AudioContext, t0: number, g: GainNode) => number
> = {
  buzzer(ctx, t, g) {
    const BEEP = 0.1,
      GAP = 0.07,
      SET_GAP = 0.4;
    let dt = 0;
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < 4; i++) {
        tone(ctx, t + dt, 2000, BEEP, "square", g);
        dt += BEEP + GAP;
      }
      dt += SET_GAP - GAP;
    }
    return dt;
  },

  siren(ctx, t, g) {
    const o = osc(ctx, 650, "sine", g);
    const STEP = 0.25;
    for (let i = 0; i < 12; i++) {
      const f = i % 2 ? 650 : 990;
      o.frequency.linearRampToValueAtTime(f, t + (i + 1) * STEP);
    }
    o.start(t);
    o.stop(t + 3);
    return 3;
  },

  kalimba(ctx, t, g) {
    const NOTE = 0.16;
    const GAP = 0.25;
    let dt = 0;
    for (let r = 0; r < 3; r++) {
      dt += arpeggio(ctx, t + dt, g, [660, 880, 660], NOTE, "sine");
      dt += GAP;
    }
    return dt;
  },

  retro(ctx, t, g) {
    const NOTE = 0.09;
    const GAP = 0.25;
    let dt = 0;
    for (let r = 0; r < 3; r++) {
      dt += arpeggio(
        ctx,
        t + dt,
        g,
        [784, 1046.5, 1318.5, 1567.98],
        NOTE,
        "square"
      );
      dt += GAP;
    }
    return dt;
  },

  levelup(ctx, t, g) {
    let dt = 0;

    for (let r = 0; r < 3; r++) {
      tone(ctx, t + dt, 392.0, 0.1, "square", g);
      dt += 0.12;

      tone(ctx, t + dt, 392.0, 0.1, "square", g);
      dt += 0.12;

      tone(ctx, t + dt, 523.25, 0.1, "square", g);
      dt += 0.12;

      tone(ctx, t + dt, 392.0, 0.08, "square", g);
      dt += 0.1;

      tone(ctx, t + dt, 523.25, 0.08, "square", g);
      dt += 0.1;

      tone(ctx, t + dt, 659.25, 0.08, "square", g);
      dt += 0.1;

      tone(ctx, t + dt, 659.25, 0.3, "square", g);
      dt += 0.35;

      if (r < 2) {
        dt += 0.25;
      }
    }

    return dt;
  },
};

function tone(
  ctx: AudioContext,
  t: number,
  freq: number,
  len: number,
  type: OscillatorType,
  g: GainNode,
  detune = 0
) {
  const o = osc(ctx, freq, type, g, detune);
  o.start(t);
  o.stop(t + len);
}

const osc = (
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  g: GainNode,
  detune = 0
) => {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.connect(g);
  return o;
};

function arpeggio(
  ctx: AudioContext,
  t: number,
  g: GainNode,
  freqs: number[],
  noteLen: number,
  type: OscillatorType,
  det: () => number = () => 0
) {
  let dt = 0;
  freqs.forEach((f) => {
    tone(ctx, t + dt, f, noteLen, type, g, det());
    dt += noteLen;
  });
  return dt;
}

let isAlarmPlaying = false;

export function playAlarm(preset: AlarmPreset, volume = 0.5) {
  console.log("playAlarm called with preset:", preset, "volume:", volume);

  if (isAlarmPlaying) {
    console.log("Alarm already playing, skipping duplicate");
    return;
  }

  interface WebkitWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
  }

  const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AC) {
    console.log("AudioContext が使えません");
    return;
  }

  try {
    const ctx = new AC();

    isAlarmPlaying = true;

    console.log("AudioContext state:", ctx.state);

    if (ctx.state === "suspended") {
      console.log("Resuming suspended AudioContext");
      ctx
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
          playAlarmSound(ctx, preset, volume);
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);
          isAlarmPlaying = false;
        });
    } else {
      playAlarmSound(ctx, preset, volume);
    }
  } catch (error) {
    console.error("Error playing alarm:", error);
    isAlarmPlaying = false;
  }
}

function playAlarmSound(ctx: AudioContext, preset: AlarmPreset, volume = 0.5) {
  const gain = ctx.createGain();
  gain.gain.value = volume; // 音量設定を使用
  gain.connect(ctx.destination);

  const t0 = ctx.currentTime;
  const presetFunction = presets[preset];

  if (!presetFunction) {
    console.error("Preset not found:", preset);
    isAlarmPlaying = false;
    return;
  }

  console.log("Executing preset function for:", preset);
  const duration = presetFunction(ctx, t0, gain);
  console.log("Preset duration:", duration);

  if (duration) {
    setTimeout(
      () => {
        console.log("Closing audio context for preset:", preset);
        ctx.close();
        isAlarmPlaying = false;
      },
      duration * 1000 + 500
    );
  } else {
    setTimeout(() => {
      isAlarmPlaying = false;
    }, 100);
  }
}

let isFallbackPlaying = false;

export function playFallbackSound(type: "work" | "break", volume = 0.5) {
  console.log("Playing fallback sound for type:", type, "volume:", volume);

  if (isFallbackPlaying) {
    console.log("Fallback sound already playing, skipping duplicate");
    return;
  }

  try {
    interface WebkitWindow extends Window {
      webkitAudioContext?: typeof AudioContext;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextConstructor) {
      console.log("AudioContextがサポートされていません");
      return;
    }

    const audioContext = new AudioContextConstructor();

    isFallbackPlaying = true;

    console.log("Fallback AudioContext state:", audioContext.state);

    const playSound = () => {
      const frequencies =
        type === "work" ? [523.25, 659.25, 783.99] : [349.23, 440.0, 523.25];

      console.log("Playing fallback frequencies:", frequencies);

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          volume * 0.2, // 音量設定を反映 (最大音量の20%まで)
          audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5 + index * 0.1
        );

        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + 0.5 + index * 0.1);
      });

      setTimeout(
        () => {
          isFallbackPlaying = false;
        },
        (0.5 + (frequencies.length - 1) * 0.1) * 1000 + 100
      );
    };

    if (audioContext.state === "suspended") {
      console.log("Resuming suspended fallback AudioContext");
      audioContext
        .resume()
        .then(() => {
          console.log("Fallback AudioContext resumed successfully");
          playSound();
        })
        .catch((error) => {
          console.error("Failed to resume fallback AudioContext:", error);
          isFallbackPlaying = false;
        });
    } else {
      playSound();
    }
  } catch (error) {
    console.log("効果音の再生に失敗しました:", error);
    isFallbackPlaying = false;
  }
}

export function playTimerSound(
  type: "work" | "break",
  preset?: AlarmPreset,
  volume = 0.5
) {
  console.log("playTimerSound called:", { type, preset, volume });

  if (preset) {
    console.log("Playing alarm preset:", preset);
    playAlarm(preset, volume);
    return;
  }

  console.log("Playing fallback sound for type:", type);
  playFallbackSound(type, volume);
}
