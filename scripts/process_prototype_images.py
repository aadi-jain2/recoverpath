"""Remove white backgrounds from prototype CAD renders and save to images/prototype/."""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = Path(r"C:\Users\dnsja\Downloads")
OUT = ROOT / "images" / "prototype"
OUT.mkdir(parents=True, exist_ok=True)

# source filename in Downloads -> output filename in repo
FILES = {
    "full.png": "full.png",
    "color.png": "top-shell.png",
    "base.png": "base.png",
    "basewlayer.png": "base-interior.png",
    "bottomface.png": "sensor-pcb.png",
    "sensor view.png": "side-profile.png",
}


def remove_white_bg(src: Path, dst: Path, threshold: int = 235, soften: int = 12):
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    rgb = data[..., :3]
    # Distance from pure white — soft alpha for anti-aliased CAD edges
    dist = 255.0 - rgb.min(axis=2)
    alpha = np.clip((dist - (255 - threshold)) / max(soften, 1), 0, 1) * 255.0
    data[..., 3] = alpha
    out = Image.fromarray(data.astype(np.uint8), "RGBA")
    # Trim excess transparent padding
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst, optimize=True)
    print(f"  {src.name} -> {dst.name}  ({out.size[0]}x{out.size[1]})")


def main():
    for src_name, out_name in FILES.items():
        src = DOWNLOADS / src_name
        if not src.exists():
            raise FileNotFoundError(f"Missing: {src}")
        remove_white_bg(src, OUT / out_name)
    print(f"\nDone — {len(FILES)} images in {OUT}")


if __name__ == "__main__":
    main()
