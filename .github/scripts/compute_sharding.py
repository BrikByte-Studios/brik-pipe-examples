import json
import sys
from pathlib import Path

def load_duration(path: str) -> float:
    p = Path(path)
    if not p.is_file():
        print(f"ERROR: metadata file not found: {p}", file=sys.stderr)
        sys.exit(1)
    data = json.loads(p.read_text())
    return float(data.get("duration_seconds", 0))

def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: compute_sharding.py BASELINE_META SHARDED_META [THRESHOLD_PERCENT] [ENFORCE]", file=sys.stderr)
        sys.exit(1)

    baseline_meta = sys.argv[1]
    sharded_meta = sys.argv[2]

    # Default KPI = 30%
    threshold = float(sys.argv[3]) if len(sys.argv) >= 4 else 30.0
    # ENFORCE can be "true"/"false" (case-insensitive), default = false (advisory mode)
    enforce = (len(sys.argv) >= 5 and sys.argv[4].lower() == "true")

    baseline = load_duration(baseline_meta)
    sharded = load_duration(sharded_meta)

    print(f"Baseline: {baseline}")
    print(f"Sharded: {sharded}")

    if baseline <= 0 or sharded <= 0:
        print("ERROR: Invalid durations in metadata.", file=sys.stderr)
        # This is a real error – still fail.
        sys.exit(1)

    reduction = (baseline - sharded) / baseline * 100.0
    print(f"Reduction (%): {reduction:.2f}")
    print(f"Threshold (%): {threshold:.2f}")
    print(f"Mode: {'ENFORCING' if enforce else 'ADVISORY'}")

    if reduction >= threshold:
        print("✅ Sharding impact meets or exceeds threshold.")
        sys.exit(0)
    else:
        msg = "⚠️ Sharding impact below threshold."
        if enforce:
            print(msg + " (ENFORCING → failing job)")
            sys.exit(1)
        else:
            print(msg + " (ADVISORY → job will still pass)")
            # Advisory mode: don’t fail the workflow
            sys.exit(0)

if __name__ == "__main__":
    main()