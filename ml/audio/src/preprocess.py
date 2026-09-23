import io

import numpy as np
import soundfile as sf
import torch
import torchaudio

from config import CONFIG


def load_and_preprocess_waveform(raw_bytes: bytes) -> torch.Tensor:
    data, sr = sf.read(io.BytesIO(raw_bytes), always_2d=True)
    waveform = torch.from_numpy(data.T.astype(np.float32))
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    if sr != CONFIG.sample_rate:
        waveform = torchaudio.functional.resample(waveform, sr, CONFIG.sample_rate)
    target_len = int(CONFIG.sample_rate * CONFIG.clip_seconds)
    if waveform.shape[1] > target_len:
        waveform = waveform[:, :target_len]
    elif waveform.shape[1] < target_len:
        pad = target_len - waveform.shape[1]
        waveform = torch.nn.functional.pad(waveform, (0, pad))
    max_abs = waveform.abs().max()
    if max_abs > 0:
        waveform = waveform / max_abs
    return waveform.squeeze(0)


def waveform_to_log_mel(waveform: torch.Tensor) -> torch.Tensor:
    mel = torchaudio.transforms.MelSpectrogram(
        sample_rate=CONFIG.sample_rate,
        n_fft=CONFIG.n_fft,
        hop_length=CONFIG.hop_length,
        n_mels=CONFIG.n_mels,
        f_min=CONFIG.fmin,
        f_max=CONFIG.fmax,
    )(waveform)
    log_mel = torch.log(mel + 1e-9)
    return log_mel
