#!/usr/bin/env python3
"""
Run your agent against all four regions in sequence (or parallel),
injecting a working regional proxy for each run.

Usage:
    python agent_test_runner.py                  # test all regions
    python agent_test_runner.py UK USA           # test specific regions
"""

import sys
import json
import concurrent.futures
from proxy_manager import get_working_proxies, rotate_request, REGIONS


# ── Plug your agent call in here ──────────────────────────────────────────────
def run_agent(region_key: str, proxy: dict) -> dict:
    """
    Replace the body of this function with your actual agent invocation.
    `proxy` is a dict with keys: ip, port, protocol, country.

    Example for an HTTP-based agent endpoint:
        from proxy_manager import proxy_dict
        resp = requests.post(
            "https://your-agent-endpoint/run",
            json={"region": region_key},
            proxies=proxy_dict(proxy),
            timeout=15,
        )
        return resp.json()
    """
    from proxy_manager import proxy_dict
    import requests

    # Demo: just hit httpbin to show the apparent IP/region
    resp = requests.get(
        "https://httpbin.org/ip",
        proxies=proxy_dict(proxy),
        timeout=10,
    )
    return {"region": region_key, "apparent_ip": resp.json().get("origin"), "status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────

def test_region(region_key: str) -> dict:
    label = REGIONS[region_key]["label"]
    print(f"\n{'='*50}")
    print(f"  Testing region: {label}")
    print(f"{'='*50}")

    proxies = get_working_proxies(region_key, max_test=20)
    if not proxies:
        return {"region": region_key, "status": "error", "reason": "no working proxies"}

    proxy = proxies[0]
    try:
        result = run_agent(region_key, proxy)
        result["proxy_used"] = f"{proxy['ip']}:{proxy['port']}"
        return result
    except Exception as e:
        return {"region": region_key, "status": "error", "reason": str(e)}


def main(regions: list[str], parallel: bool = False):
    results = {}

    if parallel:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
            futures = {ex.submit(test_region, r): r for r in regions}
            for fut in concurrent.futures.as_completed(futures):
                r = futures[fut]
                results[r] = fut.result()
    else:
        for r in regions:
            results[r] = test_region(r)

    print("\n\n=== RESULTS ===")
    print(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    target_regions = [r.upper() for r in sys.argv[1:]] if len(sys.argv) > 1 else list(REGIONS.keys())
    invalid = [r for r in target_regions if r not in REGIONS]
    if invalid:
        print(f"[!] Unknown regions: {invalid}. Valid: {list(REGIONS.keys())}")
        sys.exit(1)

    main(target_regions, parallel="--parallel" in sys.argv)
