import json
import urllib.request
import time

def seed_phase4():
    # Wait briefly for backend
    time.sleep(2)
    # Login
    login_req = urllib.request.Request(
        "http://localhost:8000/auth/login",
        data=b'{"username":"ammar","password":"changeme"}',
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(login_req) as resp:
        token = json.loads(resp.read().decode())["access_token"]

    modules = ["mfg", "fod", "phm", "prn"]
    for mod in modules:
        seed_url = f"http://localhost:8000/{mod}/seed"
        req = urllib.request.Request(
            seed_url,
            data=b"{}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                print(f"[{mod}] Seed result: {res}")
        except Exception as e:
            print(f"[{mod}] Error seeding: {e}")

        # Check summary
        sum_url = f"http://localhost:8000/{mod}/summary"
        sum_req = urllib.request.Request(
            sum_url,
            headers={"Authorization": f"Bearer {token}"}
        )
        try:
            with urllib.request.urlopen(sum_req) as resp:
                res = json.loads(resp.read().decode())
                print(f"[{mod}] Summary: {res}")
        except Exception as e:
            print(f"[{mod}] Error fetching summary: {e}")

if __name__ == "__main__":
    seed_phase4()
