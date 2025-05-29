import type { AlarmPreset } from "./types";

/** アラーム音のプリセット定義 */
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
    const STEP = 0.25; // 2 Hz
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
      // 3 回繰り返す
      dt += arpeggio(ctx, t + dt, g, [660, 880, 660], NOTE, "sine");
      dt += GAP;
    }
    return dt;
  },

  retro(ctx, t, g) {
    const NOTE = 0.09; // 1 音の長さ
    const GAP = 0.25; // セット間の休止
    let dt = 0;
    for (let r = 0; r < 3; r++) {
      // 3 回繰り返す
      dt += arpeggio(
        ctx,
        t + dt,
        g,
        [784, 1046.5, 1318.5, 1567.98],
        NOTE,
        "square"
      );
      dt += GAP; // セット間インターバル
    }
    return dt;
  },

  levelup(ctx, t, g) {
    // ドラゴンクエストのレベルアップ音「テレテレッテッテッテー」
    let dt = 0;

    // 3回繰り返し
    for (let r = 0; r < 3; r++) {
      // テレテレッテッテッテー のメロディー
      // G4  G4  C5  G4  C5  E5ー (音程とリズム)

      // テ (短)
      tone(ctx, t + dt, 392.0, 0.1, "square", g); // G4
      dt += 0.12;

      // レ (短)
      tone(ctx, t + dt, 392.0, 0.1, "square", g); // G4
      dt += 0.12;

      // テ (短・高め)
      tone(ctx, t + dt, 523.25, 0.1, "square", g); // C5
      dt += 0.12;

      // ッ (短)
      tone(ctx, t + dt, 392.0, 0.08, "square", g); // G4
      dt += 0.1;

      // テ (短・高め)
      tone(ctx, t + dt, 523.25, 0.08, "square", g); // C5
      dt += 0.1;

      // ッ (短・さらに高め)
      tone(ctx, t + dt, 659.25, 0.08, "square", g); // E5
      dt += 0.1;

      // テー (長め・クライマックス)
      tone(ctx, t + dt, 659.25, 0.3, "square", g); // E5
      dt += 0.35;

      // セット間の休止（最後以外）
      if (r < 2) {
        dt += 0.25;
      }
    }

    return dt;
  },
};

/* ========== 共通ユーティリティ ========== */

/** 単音トーン生成 */
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

/** オシレータ生成だけ分離 */
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

/** アルペジオ系：順番に複数トーン鳴らす */
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

// アラーム再生中フラグ（グローバルで管理）
let isAlarmPlaying = false;

/** アラーム音を再生する関数 */
export function playAlarm(preset: AlarmPreset) {
  console.log("playAlarm called with preset:", preset);

  // 既に再生中の場合は重複を防ぐ
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

    // アラーム再生中フラグを設定
    isAlarmPlaying = true;

    // AudioContextの状態をチェック
    console.log("AudioContext state:", ctx.state);

    // もしsuspendedなら resume する
    if (ctx.state === "suspended") {
      console.log("Resuming suspended AudioContext");
      ctx
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
          playAlarmSound(ctx, preset);
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);
          isAlarmPlaying = false; // エラー時はフラグをリセット
        });
    } else {
      playAlarmSound(ctx, preset);
    }
  } catch (error) {
    console.error("Error playing alarm:", error);
    isAlarmPlaying = false; // エラー時はフラグをリセット
  }
}

function playAlarmSound(ctx: AudioContext, preset: AlarmPreset) {
  const gain = ctx.createGain();
  gain.gain.value = 0.15; // 全体音量（0.0–1.0）
  gain.connect(ctx.destination);

  const t0 = ctx.currentTime;
  const presetFunction = presets[preset];

  if (!presetFunction) {
    console.error("Preset not found:", preset);
    isAlarmPlaying = false; // エラー時はフラグをリセット
    return;
  }

  console.log("Executing preset function for:", preset);
  const duration = presetFunction(ctx, t0, gain);
  console.log("Preset duration:", duration);

  /* 参考：必要なら終了後に Context を解放 */
  if (duration) {
    setTimeout(
      () => {
        console.log("Closing audio context for preset:", preset);
        ctx.close();
        isAlarmPlaying = false; // 再生終了時にフラグをリセット
      },
      duration * 1000 + 500
    );
  } else {
    // durationが0の場合も即座にフラグをリセット
    setTimeout(() => {
      isAlarmPlaying = false;
    }, 100);
  }
}

// フォールバック音再生中フラグ
let isFallbackPlaying = false;

/** フォールバック音を再生する関数 */
export function playFallbackSound(type: "work" | "break") {
  console.log("Playing fallback sound for type:", type);

  // 既に再生中の場合は重複を防ぐ
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

    // フォールバック音再生中フラグを設定
    isFallbackPlaying = true;

    // AudioContextの状態をチェック
    console.log("Fallback AudioContext state:", audioContext.state);

    const playSound = () => {
      const frequencies =
        type === "work"
          ? [523.25, 659.25, 783.99] // C5, E5, G5 (明るいメジャーコード)
          : [349.23, 440.0, 523.25]; // F4, A4, C5 (やわらかい音)

      console.log("Playing fallback frequencies:", frequencies);

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = "sine";

        // 音量の変化（フェードイン・フェードアウト）
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.1,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5 + index * 0.1
        );

        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + 0.5 + index * 0.1);
      });

      // 最後の音が終わったらフラグをリセット
      setTimeout(
        () => {
          isFallbackPlaying = false;
        },
        (0.5 + (frequencies.length - 1) * 0.1) * 1000 + 100
      );
    };

    // もしsuspendedなら resume する
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
          isFallbackPlaying = false; // エラー時はフラグをリセット
        });
    } else {
      playSound();
    }
  } catch (error) {
    console.log("効果音の再生に失敗しました:", error);
    isFallbackPlaying = false; // エラー時はフラグをリセット
  }
}

/** タイマー音を再生する統合関数 */
export function playTimerSound(type: "work" | "break", preset?: AlarmPreset) {
  console.log("playTimerSound called:", { type, preset });

  if (preset) {
    console.log("Playing alarm preset:", preset);
    playAlarm(preset);
    return;
  }

  console.log("Playing fallback sound for type:", type);
  playFallbackSound(type);
}
