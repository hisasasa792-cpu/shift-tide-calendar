import unittest

from build_tide_data import parse_line

# Real line from JMA 2026/ZF.txt (勝浦, 2026-01-01).
FIXTURE = (" 72 96114125128123116108104104110120131139140132113 86 55 26  5 -5  0 16"
           "26 1 1ZF 349128133814199999999999999 8231032112 -599999999999999")


class ParseLineTest(unittest.TestCase):
    def test_date_station_and_hourly(self):
        date, rec = parse_line(FIXTURE)
        self.assertEqual(date, "2026-01-01")
        self.assertEqual(rec["station"], "ZF")
        self.assertEqual(len(rec["hourly"]), 24)
        self.assertEqual(rec["hourly"][:3], [72, 96, 114])
        self.assertEqual(rec["hourly"][21], -5)

    def test_high_and_low_skip_empty_slots(self):
        _, rec = parse_line(FIXTURE)
        self.assertEqual(rec["high"], [["03:49", 128], ["13:38", 141]])
        self.assertEqual(rec["low"], [["08:23", 103], ["21:12", -5]])


if __name__ == "__main__":
    unittest.main()
