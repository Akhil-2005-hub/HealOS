from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import subprocess

app = Flask(__name__)
CORS(app)

# ===============================
# SYSTEM DATA API
# ===============================
@app.route("/system")
def system():

    # ✅ REAL CPU
    cpu = round(
        psutil.cpu_percent(interval=1),
        1
    )

    # ✅ REAL MEMORY
    memory = round(
        psutil.virtual_memory().percent,
        1
    )

    processes = []

    # ✅ BLOCKED SYSTEM APPS
    blocked = [

        "System Idle Process",
        "Idle",
        "System",
        "Registry",

        "svchost.exe",
        "services.exe",
        "lsass.exe",
        "wininit.exe",
        "csrss.exe",
        "smss.exe",

        "dwm.exe",
        "SearchIndexer.exe",
        "RuntimeBroker.exe"
    ]

    # ✅ GET RUNNING PROCESSES
    for proc in psutil.process_iter(['pid', 'name']):

        try:

            if not proc.info['name']:
                continue

            name = proc.info['name']

            # skip system apps
            if name in blocked:
                continue

            p = psutil.Process(proc.info['pid'])

            process_cpu = round(
                p.cpu_percent(interval=0.2),
                1
            )

            # ignore 0%
            if process_cpu <= 0:
                continue

            processes.append({

                "pid": proc.info['pid'],

                "name": name,

                "cpu": process_cpu,

                "memory": round(
                    p.memory_info().rss / (1024 * 1024),
                    1
                )

            })

        except:
            pass

    # ✅ SORT BY CPU
    processes = sorted(
        processes,
        key=lambda x: x['cpu'],
        reverse=True
    )

    return jsonify({

        "cpu": cpu,

        "memory": memory,

        "processes": processes[:10]

    })


# ===============================
# KILL PROCESS API
# ===============================
@app.route("/kill", methods=["POST"])
def kill_process():

    data = request.get_json()

    pid = data.get("pid")

    try:

        result = subprocess.run(
            ["taskkill", "/F", "/PID", str(pid)],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:

            return jsonify({

                "success": True

            })

        else:

            return jsonify({

                "success": False,

                "message": result.stderr

            })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        })


# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":

    print("🚀 HealOS Backend Running")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )