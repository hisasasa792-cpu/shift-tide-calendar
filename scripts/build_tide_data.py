"""Convert JMA yearly tide tables into data/tide/<year>.json.

Usage: py scripts/build_tide_data.py 2026 2027
Run once a year to add the next year's tables.
"""
import json
import sys
import urllib.request
from pathlib import Path

STATIONS = ["ZF", "MR"]  # 勝浦, 布良
URL = "https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/{year}/{code}.txt"
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "tide"


def _events(field):
    """Four slots of HHMM (4 chars) + height (3 chars); 9999/999 means empty."""
    out = []
    for i in range(4):
        slot = field[i * 7:(i + 1) * 7]
        hhmm, height = slot[:4], slot[4:]
        if hhmm.strip() == "9999":
            continue
        hhmm = hhmm.replace(" ", "0")
        out.append([f"{hhmm[:2]}:{hhmm[2:]}", int(height)])
    return out


def parse_line(line):
    hourly = [int(line[i * 3:(i + 1) * 3]) for i in range(24)]
    yy, mm, dd = (int(line[72 + i * 2:74 + i * 2]) for i in range(3))
    date = f"{2000 + yy:04d}-{mm:02d}-{dd:02d}"
    return date, {
        "station": line[78:80],
        "hourly": hourly,
        "high": _events(line[80:108]),
        "low": _events(line[108:136]),
    }


def build(year, stations=STATIONS):
    data = {}
    for code in stations:
        with urllib.request.urlopen(URL.format(year=year, code=code)) as res:
            text = res.read().decode("ascii")
        days = {}
        for line in text.splitlines():
            if len(line) < 136:
                continue
            date, rec = parse_line(line)
            del rec["station"]
            days[date] = rec
        data[code] = days
    return data


def main(years):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for year in years:
        path = OUT_DIR / f"{year}.json"
        path.write_text(json.dumps(build(int(year)), separators=(",", ":")), encoding="utf-8")
        print(f"wrote {path}")


if __name__ == "__main__":
    main(sys.argv[1:])
