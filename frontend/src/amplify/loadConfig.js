export async function loadAmplifyConfig() {
  try {
    const response = await fetch("/terraform-outputs.json"); 
    if (!response.ok) {
      console.error("Failed to load terraform-outputs.json:", response.status);
      throw new Error("Config file not found");
    }
    const config = await response.json();
    console.log("Loaded config:", config);
    return config;
  } catch (error) {
    console.error("Config loading error:", error);
    throw error;
  }
}
