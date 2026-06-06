import subprocess
import time
import httpx
import os
import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

# Add services/api to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services", "api"))

from app.database.base import Base

async def setup_test_db():
    print("Creating test database tables...")
    db_path = os.path.join(os.path.dirname(__file__), "..", "test_run.db")
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
            
    engine = create_async_engine("sqlite+aiosqlite:///test_run.db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Database tables created successfully.")

def run_tests():
    # Run DB setup first
    asyncio.run(setup_test_db())

    print("==================================================")
    print("STARTING FASTAPI SERVER FOR INTEGRATION AUDIT")
    print("==================================================")

    # Set temporary environment variables for the subprocess
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite+aiosqlite:///test_run.db"
    env["SUPABASE_URL"] = "https://placeholder-project.supabase.co"
    env["ENV"] = "development"
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "api"))
    env["PYTHONUNBUFFERED"] = "1"

    # Start Uvicorn server in a subprocess and redirect output to a log file
    log_path = os.path.join(os.path.dirname(__file__), "..", "uvicorn_test.log")
    log_file = open(log_path, "w")
    server_process = subprocess.Popen(
        [
            sys.executable, "-u", "-m", "uvicorn", 
            "app.main:app", 
            "--host", "127.0.0.1", 
            "--port", "8001"
        ],
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        env=env,
        stdout=log_file,
        stderr=log_file
    )

    # Wait for server to start up, monitoring if it exits early or becomes ready
    print("Waiting for server to initialize on port 8001...")
    start_time = time.time()
    server_ready = False
    while time.time() - start_time < 15:
        if server_process.poll() is not None:
            log_file.flush()
            log_file.close()
            with open(log_path, "r") as f:
                logs = f.read()
            raise RuntimeError(f"Uvicorn process exited early with code {server_process.returncode}. Logs:\n{logs}")
        try:
            with httpx.Client(base_url="http://127.0.0.1:8001") as check_client:
                res = check_client.get("/ready", timeout=5.0)
                if res.status_code == 200:
                    server_ready = True
                    break
        except httpx.HTTPError:
            pass

        time.sleep(0.5)

    if not server_ready:
        log_file.flush()
        log_file.close()
        with open(log_path, "r") as f:
            logs = f.read()
        raise RuntimeError(f"Server failed to start on port 8001 within 15 seconds. Logs:\n{logs}")

    client = httpx.Client(base_url="http://127.0.0.1:8001")

    try:


        # 1. Test GET /ready
        print("\n[Audit 1] GET /ready (Readiness Check)")
        res = client.get("/ready")
        print(f"Request: GET /ready")
        print(f"Response Status: {res.status_code}")
        print(f"Response Body: {res.json()}")

        # 2. Test GET /health
        print("\n[Audit 2] GET /health (Health Check)")
        res = client.get("/health")
        print(f"Request: GET /health")
        print(f"Response Status: {res.status_code}")
        print(f"Response Body: {res.json()}")

        # 3. Test GET /api/v1/auth/me (Valid Mock Token - Dev Bypass)
        print("\n[Audit 3] GET /api/v1/auth/me (Valid Mock Token)")
        headers = {"Authorization": "Bearer mock-token-auditor-99"}
        res = client.get("/api/v1/auth/me", headers=headers)
        print(f"Request: GET /api/v1/auth/me with Auth header")
        print(f"Response Status: {res.status_code}")
        print(f"Response Body: {res.json()}")

        # 4. Test GET /api/v1/auth/me (Invalid Token)
        print("\n[Audit 4] GET /api/v1/auth/me (Invalid Token)")
        headers = {"Authorization": "Bearer invalid-token-123"}
        res = client.get("/api/v1/auth/me", headers=headers)
        print(f"Request: GET /api/v1/auth/me with Invalid Auth header")
        print(f"Response Status: {res.status_code}")
        print(f"Response Body: {res.json()}")

        # 5. Test GET /api/v1/auth/me (Missing Token)
        print("\n[Audit 5] GET /api/v1/auth/me (Missing Token)")
        res = client.get("/api/v1/auth/me")
        print(f"Request: GET /api/v1/auth/me with No Auth header")
        print(f"Response Status: {res.status_code}")
        print(f"Response Body: {res.json()}")

    except Exception as e:
        print(f"\nTest execution failed: {e}")
        # Print server log if available
        try:
            log_file.flush()
            log_file.close()
            with open(log_path, "r") as f:
                print("\n--- Uvicorn Server Logs ---")
                print(f.read())
                print("---------------------------")
        except Exception as log_err:
            print(f"Failed to read server logs: {log_err}")
        raise
    finally:
        # Terminate server process
        server_process.terminate()
        server_process.wait()
        print("\nFastAPI server terminated.")
        
        # Close log file if still open
        try:
            log_file.close()
        except Exception:
            pass
            
        # Delete temporary test DB
        db_path = os.path.join(os.path.dirname(__file__), "..", "test_run.db")
        # Give a small delay to release DB connection file handles
        time.sleep(1)
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
                print("Temporary database test_run.db deleted.")
            except Exception as e:
                print(f"Warning: Could not remove test_run.db: {e}")
                
        # Clean up log file
        if os.path.exists(log_path):
            try:
                os.remove(log_path)
            except Exception:
                pass

if __name__ == "__main__":
    run_tests()

