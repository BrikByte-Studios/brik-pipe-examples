import sys
import json
from pathlib import Path

def load_metadata(path):
    if not path.is_file():
        print(f"ERROR: Metadata file not found: {path}")
        sys.exit(1)
    with open(path, "r") as f:
        return json.load(f)

baseline_path = Path(sys.argv[1])
sharded_path  = Path(sys.argv[2])

baseline_meta = load_metadata(baseline_path)
sharded_meta  = load_metadata(sharded_path)

baseline = float(baseline_meta.get("duration_seconds", 0))
sharded  = float(sharded_meta.get("duration_seconds", 0))

if baseline <= 0 or sharded <= 0:
    print("ERROR: Invalid durations in metadata.")
    sys.exit(1)

reduction = (baseline - sharded) / baseline * 100

print(f"Baseline: {baseline}")
print(f"Sharded: {sharded}")
print(f"Reduction (%): {reduction:.2f}")

# Exit code = 0 if ≥ 30% reduction, else 1
if reduction >= 30:
    print("PASS")
    sys.exit(0)
else:
    print("FAIL")
    sys.exit(1)
