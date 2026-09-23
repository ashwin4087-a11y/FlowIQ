import argparse
import json
import sys
from pathlib import Path

import torch

from model import SirenCNN
from preprocess import load_and_preprocess_waveform, waveform_to_log_mel

LABELS = ["NON_SIREN", "SIREN"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--model", required=True)
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(json.dumps({"status": "error", "message": "file not found"}))
        sys.exit(1)
    if not Path(args.model).exists():
        print(json.dumps({"status": "model_not_loaded"}))
        sys.exit(2)

    raw = path.read_bytes()
    waveform = load_and_preprocess_waveform(raw)
    spec = waveform_to_log_mel(waveform).unsqueeze(0).unsqueeze(0)

    model = SirenCNN()
    model.load_state_dict(torch.load(args.model, map_location="cpu"))
    model.eval()
    with torch.no_grad():
        logits = model(spec)
        probs = torch.softmax(logits, dim=1)[0]
        idx = int(probs.argmax().item())
        print(
            json.dumps(
                {
                    "event": LABELS[idx],
                    "probability": float(probs[1].item()),
                    "probabilities": {LABELS[i]: float(probs[i].item()) for i in range(2)},
                }
            )
        )


if __name__ == "__main__":
    main()
