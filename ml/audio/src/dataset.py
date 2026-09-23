import io
import json
import zipfile
from pathlib import Path

import torch
import torchaudio
from torch.utils.data import Dataset

from config import CONFIG
from preprocess import load_and_preprocess_waveform, waveform_to_log_mel


class FlowIQAudioDataset(Dataset):
    def __init__(self, split: str):
        splits_path = Path(__file__).resolve().parents[1] / "data" / "manifests" / "splits.json"
        with splits_path.open(encoding="utf-8") as f:
            all_rows = json.load(f)
        self.rows = [r for r in all_rows if r["split"] == split]
        self.label_to_idx = {"NON_SIREN": 0, "SIREN": 1}

    def __len__(self):
        return len(self.rows)

    def _read_bytes(self, path: str) -> bytes:
        if path.startswith("zip://"):
            rest = path[6:]
            zip_path, inner = rest.split("!", 1)
            with zipfile.ZipFile(zip_path) as z:
                return z.read(inner)
        return Path(path).read_bytes()

    def __getitem__(self, idx):
        row = self.rows[idx]
        raw = self._read_bytes(row["path"])
        waveform = load_and_preprocess_waveform(raw)
        spec = waveform_to_log_mel(waveform)
        label = self.label_to_idx[row["flowiq_label"]]
        return spec.unsqueeze(0), torch.tensor(label, dtype=torch.long)
