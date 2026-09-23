from dataclasses import dataclass


@dataclass
class AudioConfig:
    sample_rate: int = 22050
    clip_seconds: float = 3.0
    n_mels: int = 64
    n_fft: int = 1024
    hop_length: int = 512
    fmin: float = 0.0
    fmax: float = 8000.0
    num_classes: int = 2  # SIREN, NON_SIREN


CONFIG = AudioConfig()
