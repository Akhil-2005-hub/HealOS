// =====================================
// HealOS - System Monitor Service
// =====================================

// ✅ Fetch system data from Python backend
export const getSystemData = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/system");

    // ❌ If server error
    if (!response.ok) {
      throw new Error("Failed to fetch system data");
    }

    // ✅ Convert response to JSON
    const data = await response.json();

    console.log("✅ REAL DATA:", data);

    return data;

  } catch (error) {
    console.error("❌ Error fetching system data:", error);

    // ⚠️ IMPORTANT: return null (NOT 0 values)
    return null;
  }
};


// =====================================
// Kill Process Function (Optional Feature)
// =====================================
export const killProcess = async (pid: number) => {

  try {

    const response = await fetch("http://127.0.0.1:5000/kill", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        pid: pid
      }),
    });

    return await response.json();

  } catch (error) {

    console.error(error);

  }
};