import React, { useState, useEffect } from "react";
import { getSystemData, killProcess } from "./services/SystemMonitorService";

import {
  Cpu,
  Layers,
  Activity,
  Terminal,
  ShieldCheck
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";


// ===============================
// Metric Card
// ===============================
const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  progress
}: any) => (

  <div className="glass p-6 rounded-2xl relative bg-[#111827] border border-gray-800">

    <p className="text-slate-400 text-sm uppercase">
      {title}
    </p>

    <h3 className="text-3xl font-bold text-white mt-1">
      {value}
    </h3>

    <div className="mt-3 flex justify-between text-xs text-slate-400">
      <span>Load</span>
      <span>{progress}%</span>
    </div>

    <div className="w-full h-2 bg-white/10 rounded mt-2">

      <div
        className={`h-full rounded ${color}`}
        style={{ width: `${progress}%` }}
      />

    </div>

    <Icon className="absolute top-4 right-4 text-white opacity-60" />

  </div>
);


// ===============================
// Alert Modal
// ===============================
const AlertModal = ({
  isOpen,
  suggestion,
  handleAutoFix,
  handleManualFix,
  handleSkip
}: any) => {

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 flex justify-center items-center bg-black/70 z-50">

      <div className="bg-[#111827] border border-red-500 shadow-2xl rounded-2xl p-6 w-[420px]">

        <h2 className="text-xl font-bold text-red-400 mb-3">
          ⚠ System Alert
        </h2>

        <div className="bg-black/40 p-3 rounded-lg mb-4 text-gray-300 text-sm whitespace-pre-line">
          {suggestion}
        </div>

        <div className="flex flex-col gap-3">

          <button
            onClick={handleAutoFix}
            className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700"
          >
            🔥 Fix Automatically
          </button>

          <button
            onClick={handleManualFix}
            className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            🧠 Fix Manually
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            ⏭ Skip
          </button>

        </div>

      </div>

    </div>
  );
};


// ===============================
// MAIN APP
// ===============================
export default function App() {

  const [cpu, setCpu] = useState(0);

  const [memory, setMemory] = useState(0);

  const [processes, setProcesses] = useState<any[]>([]);

  const [chartData, setChartData] = useState<any[]>([]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [suggestion, setSuggestion] = useState("");

  // SETTINGS
  const [showSettings, setShowSettings] = useState(false);

  // ALLOWED APPS
  const [allowedApps, setAllowedApps] = useState([

    "chrome.exe",

    "msedge.exe",

    "code.exe",

    "discord.exe",

    "spotify.exe"

  ]);


  // ===============================
  // FETCH DATA
  // ===============================
  const fetchData = async () => {

    try {

      const data = await getSystemData();

      if (!data) return;

      setCpu(data.cpu);

      setMemory(data.memory);

      setProcesses(data.processes);

      // ===============================
      // CHART UPDATE
      // ===============================
      setChartData((prev) => [

        ...prev.slice(-19),

        {
          time: new Date().toLocaleTimeString(),
          cpu: data.cpu,
          memory: data.memory
        }

      ]);

      // ===============================
      // HEAVY APPS DETECTION
      // ===============================
      const validProcesses = data.processes.filter(

        (p: any) =>

          p.cpu > 10 &&

          allowedApps.includes(
            p.name.toLowerCase()
          )

      );

      // ===============================
      // ALERT
      // ===============================
      if (validProcesses.length > 0) {

        if (!isAlertOpen) {

          setIsAlertOpen(true);

          const top = validProcesses[0];

          let suggestionText = "";

          if (
            top.name.toLowerCase().includes("chrome")
          ) {

            suggestionText =
              "Too many Chrome tabs are open.";

          } else if (
            top.name.toLowerCase().includes("code")
          ) {

            suggestionText =
              "VS Code is consuming high CPU.";

          } else {

            suggestionText =
              "Close unnecessary applications.";
          }

          setSuggestion(

`${top.name}

CPU Usage: ${top.cpu}%

Suggestion:
${suggestionText}`

          );
        }

      }

    } catch (error) {

      console.error(error);
    }
  };


  // ===============================
  // AUTO FIX
  // ===============================
  const handleAutoFix = async () => {

    const validProcesses = processes.filter(

      (p: any) =>

        p.cpu > 10 &&

        allowedApps.includes(
          p.name.toLowerCase()
        )

    );

    if (validProcesses.length === 0) {

      setSuggestion(
        "✅ No heavy process found"
      );

      return;
    }

    const top = validProcesses[0];

    const result = await killProcess(top.pid);

    if (result?.success) {

      setSuggestion(
`✅ ${top.name} closed successfully`
      );

    } else {

      setSuggestion(
`❌ Failed to close ${top.name}`
      );
    }

    fetchData();
  };


  // ===============================
  // MANUAL FIX
  // ===============================
  const handleManualFix = () => {

    setSuggestion(

`🛠 Manual Optimization Tips

• Close extra browser tabs

• Restart heavy applications

• Clear unnecessary background apps

• Restart your computer for best performance`

    );

  };


  // ===============================
  // SKIP
  // ===============================
  const handleSkip = () => {

    setIsAlertOpen(false);

    setSuggestion("");
  };


  // ===============================
  // AUTO REFRESH
  // ===============================
  useEffect(() => {

    fetchData();

    const interval = setInterval(

      fetchData,

      3000

    );

    return () => clearInterval(interval);

  }, []);


  // ===============================
  // UI
  // ===============================
  return (

    <div className="min-h-screen bg-black p-6 max-w-6xl mx-auto text-white">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">

        <ShieldCheck className="text-blue-500" />

        <h1 className="text-3xl font-bold">

          Heal

          <span className="text-blue-500">
            OS
          </span>

        </h1>

        {/* SETTINGS BUTTON */}
        <button
          onClick={() => setShowSettings(true)}
          className="ml-auto bg-[#111827] border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800"
        >
          ⚙ Settings
        </button>

      </div>


      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <MetricCard
          title="CPU Usage"
          value={`${cpu}%`}
          icon={Cpu}
          color="bg-blue-500"
          progress={cpu}
        />

        <MetricCard
          title="Memory Usage"
          value={`${memory}%`}
          icon={Layers}
          color="bg-purple-500"
          progress={memory}
        />

        <MetricCard
          title="Processes"
          value={processes.length}
          icon={Activity}
          color="bg-cyan-500"
          progress={processes.length}
        />

      </div>


      {/* CHART */}
      <div className="mt-8 h-[300px] bg-[#111827] p-4 rounded-xl">

        <h2 className="mb-4 text-sm text-slate-400 flex gap-2">

          <Activity />

          Real-Time Performance

        </h2>

        <ResponsiveContainer>

          <AreaChart data={chartData}>

            <CartesianGrid stroke="#333" />

            <XAxis dataKey="time" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Area
              dataKey="cpu"
              stroke="#3b82f6"
              fill="#3b82f6"
            />

            <Area
              dataKey="memory"
              stroke="#a855f7"
              fill="#a855f7"
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>


      {/* PROCESS LIST */}
      <div className="mt-8">

        <h2 className="flex gap-2 mb-3">

          <Terminal />

          Running Processes

        </h2>

        {processes.map((p, i) => (

          <div
            key={i}
            className="flex justify-between border-b border-gray-800 py-2"
          >

            <span>{p.name}</span>

            <span>{p.cpu}%</span>

          </div>

        ))}

      </div>


      {/* ALERT */}
      <AlertModal
        isOpen={isAlertOpen}
        suggestion={suggestion}
        handleAutoFix={handleAutoFix}
        handleManualFix={handleManualFix}
        handleSkip={handleSkip}
      />


      {/* SETTINGS MODAL */}
      {showSettings && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-[#081028] w-[650px] h-[500px] rounded-3xl p-6 overflow-hidden border border-blue-900">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-3xl font-bold text-white">
                ⚙ HealOS Settings
              </h2>

              <button
                onClick={() => setShowSettings(false)}
                className="text-red-500 text-3xl"
              >
                ×
              </button>

            </div>

            <p className="text-gray-400 mb-4">
              Select apps HealOS can close automatically
            </p>

            <div className="overflow-y-auto h-[350px] pr-2">

              {processes.map((p, i) => (

                <div
                  key={i}
                  className="flex justify-between items-center bg-[#0b1736] p-4 rounded-xl mb-4"
                >

                  <span className="text-xl">
                    {p.name}
                  </span>

                  {/* TOGGLE BUTTON */}
                  <button

                    onClick={() => {

                      const appName =
                        p.name.toLowerCase();

                      if (
                        allowedApps.includes(appName)
                      ) {

                        setAllowedApps(

                          allowedApps.filter(
                            (a) => a !== appName
                          )

                        );

                      } else {

                        setAllowedApps([
                          ...allowedApps,
                          appName
                        ]);

                      }

                    }}

                    className={`px-5 py-2 rounded-xl font-semibold ${
                      allowedApps.includes(
                        p.name.toLowerCase()
                      )
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >

                    {allowedApps.includes(
                      p.name.toLowerCase()
                    )
                      ? "Allowed"
                      : "Blocked"}

                  </button>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}