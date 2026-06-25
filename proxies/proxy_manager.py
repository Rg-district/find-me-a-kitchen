#!/usr/bin/env python3
"""
Proxy manager for regional testing — UK, USA, Canada, Dubai.
Fetches free proxies, validates them, and returns working ones by country.
"""

import json
import time
import random
import requests
from typing import Optional

# Country code mappings for target regions
REGIONS = {
    "UK":     {"codes": ["GB"], "label": "United Kingdom"},
    "USA":    {"codes": ["US"], "label": "United States"},
    "CA":     {"codes": ["CA"], "label": "Canada"},
    "AE":     {"codes": ["AE"], "label": "Dubai / UAE"},
}

PROXY_SOURCES = [
    "https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc&country={cc}&protocols=http,https,socks5",
]

TEST_URL = "https://httpbin.org/ip"
TIMEOUT  = 8


def fetch_proxies(country_code: str) -> list[dict]:
    proxies = []
    for source in PROXY_SOURCES:
        url = source.format(cc=country_code)
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            data = r.json()
            for entry in data.get("data", []):
                proxies.append({
                    "ip":       entry.get("ip"),
                    "port":     entry.get("port"),
                    "protocol": entry.get("protocols", ["http"])[0],
                    "country":  entry.get("country"),
                })
        except Exception as e:
            print(f"[warn] source fetch failed ({url[:60]}...): {e}")
    return proxies


def test_proxy(proxy: dict) -> bool:
    proto    = proxy["protocol"]
    addr     = f"{proxy['ip']}:{proxy['port']}"
    proxy_map = {
        "http":   f"http://{addr}",
        "https":  f"http://{addr}",
        "socks5": f"socks5://{addr}",
    }
    try:
        r = requests.get(
            TEST_URL,
            proxies={"http": proxy_map[proto], "https": proxy_map[proto]},
            timeout=TIMEOUT,
        )
        return r.status_code == 200
    except Exception:
        return False


def get_working_proxies(region_key: str, max_test: int = 20) -> list[dict]:
    region = REGIONS.get(region_key.upper())
    if not region:
        raise ValueError(f"Unknown region '{region_key}'. Choose from: {list(REGIONS)}")

    print(f"\n[*] Fetching proxies for {region['label']} ...")
    all_proxies: list[dict] = []
    for cc in region["codes"]:
        all_proxies.extend(fetch_proxies(cc))

    print(f"[*] Found {len(all_proxies)} candidates — testing up to {max_test} ...")
    random.shuffle(all_proxies)

    working = []
    for proxy in all_proxies[:max_test]:
        label = f"{proxy['protocol']}://{proxy['ip']}:{proxy['port']}"
        if test_proxy(proxy):
            print(f"  [+] LIVE  {label}")
            working.append(proxy)
        else:
            print(f"  [-] dead  {label}")

    print(f"[*] {len(working)} working proxies found for {region['label']}\n")
    return working


def proxy_dict(proxy: dict) -> dict:
    """Return a requests-compatible proxy dict for the given proxy entry."""
    proto = proxy["protocol"]
    addr  = f"{proxy['ip']}:{proxy['port']}"
    url   = f"http://{addr}" if proto in ("http", "https") else f"socks5://{addr}"
    return {"http": url, "https": url}


def rotate_request(url: str, proxies: list[dict], retries: int = 3) -> Optional[requests.Response]:
    """Make a GET request rotating through the proxy list on failure."""
    pool = proxies.copy()
    random.shuffle(pool)
    for proxy in pool[:retries]:
        try:
            r = requests.get(url, proxies=proxy_dict(proxy), timeout=TIMEOUT)
            return r
        except Exception:
            continue
    return None


# ── CLI demo ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    region = sys.argv[1].upper() if len(sys.argv) > 1 else "USA"
    working = get_working_proxies(region, max_test=30)

    if working:
        print(json.dumps(working, indent=2))
        # Quick demo: hit httpbin through first working proxy
        resp = rotate_request("https://httpbin.org/ip", working)
        if resp:
            print(f"\n[demo] Apparent IP via {region} proxy: {resp.json()}")
    else:
        print("[!] No working proxies found — try again or check your network.")
        sys.exit(1)
