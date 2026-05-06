#!/usr/bin/env python3
"""Compare A/B verdicts. Auto-apply year corrections only when both passes agree.
Log all problems to AUDIT-CLAIMS.md."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
VERDICTS = ROOT/'.audit-cache'/'verdicts'/'all.json'
OUT = ROOT/'AUDIT-CLAIMS.md'

def parse_year(y):
    if y is None: return None
    if isinstance(y, (int, float)): return int(y)
    s = str(y).strip()
    m = re.match(r'-?\d+', s)
    return int(m.group(0)) if m else None

def fmt_year_str(yn):
    if yn < 0: return f"{abs(yn):,} BC"
    return f"{yn} AD"

def main():
    d = json.load(open(DATA))
    by_id = {t['id']: t for t in d['ticks']}
    verdicts = json.loads(VERDICTS.read_text())

    # Categorize
    auto_year_fixes = []   # (id, old, new, evidence)
    flag_year = []         # (id, A, B, reason)
    flag_claim = []        # (id, A, B, reason)
    no_pass = []           # (id, reason)

    for tid, vs in verdicts.items():
        if tid not in by_id: continue
        t = by_id[tid]
        A = vs.get('A', {})
        B = vs.get('B', {})

        if not A or not B:
            no_pass.append((tid, f"missing pass: A={'y' if A else 'n'} B={'y' if B else 'n'}"))
            continue

        a_year, b_year = A.get('year_verdict'), B.get('year_verdict')
        a_claim, b_claim = A.get('claim_verdict'), B.get('claim_verdict')
        a_sugg = parse_year(A.get('year_suggestion'))
        b_sugg = parse_year(B.get('year_suggestion'))

        # Auto-fix year: both WRONG, both have suggestions, suggestions agree ±10% (or ±15 post-1500)
        if a_year == 'WRONG' and b_year == 'WRONG' and a_sugg is not None and b_sugg is not None:
            tol = max(15, int(0.1 * abs(t['yearN']))) if t['yearN'] < 1500 else 15
            if abs(a_sugg - b_sugg) <= tol:
                # off from existing by enough?
                cur = t['yearN']
                avg = (a_sugg + b_sugg) // 2
                deviation_threshold = max(50, int(0.1 * abs(cur))) if cur < 1500 else 30
                if abs(avg - cur) > deviation_threshold:
                    auto_year_fixes.append((tid, cur, avg, A.get('evidence','')[:120]))
                    continue

        # Year disagreement
        if a_year != b_year and 'WRONG' in (a_year, b_year):
            flag_year.append((tid, A, B, f"year disagree: A={a_year} B={b_year}"))

        # Claim disagreement / both WRONG
        if a_claim == 'WRONG' and b_claim == 'WRONG':
            flag_claim.append((tid, A, B, "both passes say claim WRONG"))
        elif a_claim != b_claim and 'WRONG' in (a_claim, b_claim):
            flag_claim.append((tid, A, B, f"claim disagree: A={a_claim} B={b_claim}"))

    # Apply auto year fixes
    applied = 0
    for tid, old, new, ev in auto_year_fixes:
        t = by_id[tid]
        t['yearN'] = new
        t['year'] = fmt_year_str(new)
        applied += 1

    json.dump(d, open(DATA, 'w'), ensure_ascii=False)

    # Write report
    with open(OUT, 'w') as f:
        f.write("# Claim verification audit (multi-pass via DeepSeek V4 Flash)\n\n")
        f.write(f"Verdicts gathered: {len(verdicts)} ticks. Two independent passes, agreement required.\n\n")
        f.write(f"## Auto-applied year corrections ({applied})\n\n")
        f.write("Both passes flagged year as WRONG and suggested years within tolerance; existing year was off by >50/10%.\n\n")
        for tid, old, new, ev in auto_year_fixes:
            t = by_id[tid]
            f.write(f"- **{tid}** ({t['name']}): `{fmt_year_str(old)} → {fmt_year_str(new)}`\n  > {ev}\n")
        f.write(f"\n## Flagged: claim says WRONG (both passes) — needs human review ({len([x for x in flag_claim if 'both' in x[3]])})\n\n")
        for tid, A, B, reason in flag_claim:
            if 'both' not in reason: continue
            t = by_id[tid]
            f.write(f"- **{tid}** ({t['name']}, {t['year']}): claim mismatch\n")
            f.write(f"  - A: {A.get('evidence','')[:200]}\n")
            f.write(f"  - B: {B.get('evidence','')[:200]}\n")
        f.write(f"\n## Flagged: year disagreement between passes ({len(flag_year)})\n\n")
        for tid, A, B, reason in flag_year:
            t = by_id[tid]
            f.write(f"- **{tid}** ({t['year']}): {reason}\n")
            f.write(f"  - A_sugg={A.get('year_suggestion')}: {A.get('evidence','')[:150]}\n")
            f.write(f"  - B_sugg={B.get('year_suggestion')}: {B.get('evidence','')[:150]}\n")
        f.write(f"\n## Flagged: claim disagreement between passes ({len([x for x in flag_claim if 'both' not in x[3]])})\n\n")
        for tid, A, B, reason in flag_claim:
            if 'both' in reason: continue
            t = by_id[tid]
            f.write(f"- **{tid}** ({t['year']}): {reason}\n")
        f.write(f"\n## No verdict gathered ({len(no_pass)})\n\n")
        for tid, reason in no_pass:
            f.write(f"- {tid}: {reason}\n")

    print(f"Applied {applied} auto year corrections.")
    print(f"Flagged year disagreements: {len(flag_year)}")
    print(f"Flagged claim issues: {len(flag_claim)}")
    print(f"No verdict: {len(no_pass)}")
    print(f"Report: {OUT}")

if __name__ == '__main__':
    main()
