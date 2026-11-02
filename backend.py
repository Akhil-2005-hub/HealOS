"""Local HealOS API for Windows system metrics and guarded app closing."""

from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil


app = Flask(__name__)

# The development UI is served locally. The API is bound to loopback below and
# only accepts browser requests from these local development origins.
LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
CORS(app, resources={r"/*": {"origins": LOCAL_ORIGINS}})

SAFE_TO_CLOSE = {"chrome.exe", "msedge.exe", "code.exe", "discord.exe", "spotify.exe"}
PROTECTED_NAMES = {
    "system idle process",
    "idle",
    "system",
    "registry",
    "svchost.exe",
    "services.exe",
    "lsass.exe",
    "wininit.exe",
    "csrss.exe",
    "smss.exe",
    "winlogon.exe",
    "dwm.exe",
    "explorer.exe",
}


@app.get("/system")
def system():
    """Return current CPU, memory, and the busiest visible processes."""
    processes = []
    blocked = PROTECTED_NAMES

    for proc in psutil.process_iter(["pid", "name", "memory_info"]):
        try:
            name = proc.info.get("name")
            if not name or name.casefold() in blocked:
                continue

            # A non-blocking sample avoids delaying this API once per process.
            cpu = round(proc.cpu_percent(interval=None), 1)
            memory_info = proc.info.get("memory_info")
            if memory_info is None:
                memory_info = proc.memory_info()

            processes.append({
                "pid": proc.pid,
                "name": name,
                "cpu": cpu,
                "memory": round(memory_info.rss / (1024 * 1024), 1),
                "can_close": name.casefold() in SAFE_TO_CLOSE,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes.sort(key=lambda item: item["cpu"], reverse=True)
    return jsonify({
        "cpu": round(psutil.cpu_percent(interval=0.4), 1),
        "memory": round(psutil.virtual_memory().percent, 1),
        "processes": processes[:20],
    })


@app.post("/kill")
def kill_process():
    """Close one explicitly confirmed, allow-listed process by PID and name."""
    if request.headers.get("Origin") not in LOCAL_ORIGINS:
        return jsonify(success=False, message="Request must come from the local HealOS dashboard."), 403

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify(success=False, message="The request body must be a JSON object."), 400
    try:
        pid = int(data.get("pid"))
    except (TypeError, ValueError):
        return jsonify(success=False, message="A valid process ID is required."), 400

    expected_name = str(data.get("name", "")).strip().casefold()
    if pid <= 4:
        return jsonify(success=False, message="Protected Windows process IDs cannot be closed."), 403
    if expected_name not in SAFE_TO_CLOSE:
        return jsonify(success=False, message="HealOS can only close a supported app selected from its process list."), 403

    try:
        process = psutil.Process(pid)
        actual_name = (process.name() or "").casefold()
        if actual_name != expected_name:
            return jsonify(success=False, message="That process has changed since the dashboard displayed it. Refresh and try again."), 409
        if actual_name in PROTECTED_NAMES:
            return jsonify(success=False, message="Windows protects this process."), 403

        process.terminate()
        process.wait(timeout=3)
        return jsonify(success=True, message=f"{process.name()} was closed.")
    except psutil.NoSuchProcess:
        return jsonify(success=False, message="That process is no longer running."), 404
    except psutil.AccessDenied:
        return jsonify(success=False, message="Windows denied permission to close that process."), 403
    except psutil.TimeoutExpired:
        return jsonify(success=False, message="The process is still present after the close request. Check it manually before retrying."), 408


if __name__ == "__main__":
    print("HealOS local backend running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
