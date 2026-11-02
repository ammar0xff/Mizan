"""Seed all Phase 6 modules: BNK, INS, GOV, ENT, OIL in PostgreSQL."""
import json
import urllib.request

def main():
    # 1. Login
    login_req = urllib.request.Request(
        "http://localhost:8000/auth/login",
        data=b'{"username":"ammar","password":"changeme"}',
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(login_req) as resp:
        auth = json.loads(resp.read().decode())
        token = auth["access_token"]
        print(f"Logged in successfully. User: {auth['username']}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 2. Trigger seed endpoints
    modules = ["bnk", "ins", "gov", "ent", "oil"]
    for mod in modules:
        try:
            req = urllib.request.Request(f"http://localhost:8000/{mod}/seed", data=b'{}', headers=headers)
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                print(f"[{mod.upper()}] Seed response:", res)
        except Exception as e:
            print(f"[{mod.upper()}] Seed error:", e)

    # 3. Verify summaries
    print("\n--- Phase 6 Live Summaries ---")
    for mod in modules:
        try:
            req = urllib.request.Request(f"http://localhost:8000/{mod}/summary", headers=headers)
            with urllib.request.urlopen(req) as resp:
                summary = json.loads(resp.read().decode())
                print(f"[{mod.upper()}] Summary:", json.dumps(summary, ensure_ascii=False))
        except Exception as e:
            print(f"[{mod.upper()}] Summary error:", e)

if __name__ == "__main__":
    main()
