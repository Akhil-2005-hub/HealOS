const API_BASE_URL = "http://127.0.0.1:5000";

export type SystemProcess = {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  can_close: boolean;
};

export type SystemSnapshot = {
  cpu: number;
  memory: number;
  processes: SystemProcess[];
};

export async function getSystemData(): Promise<SystemSnapshot> {
  const response = await fetch(`${API_BASE_URL}/system`);
  if (!response.ok) {
    throw new Error(`HealOS backend returned HTTP ${response.status}.`);
  }
  return response.json() as Promise<SystemSnapshot>;
}

export type CloseProcessResult = {
  success: boolean;
  message: string;
};

export async function killProcess(pid: number, name: string): Promise<CloseProcessResult> {
  const response = await fetch(`${API_BASE_URL}/kill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pid, name }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: result.message ?? `HealOS backend returned HTTP ${response.status}.`,
    };
  }
  return result as CloseProcessResult;
}
