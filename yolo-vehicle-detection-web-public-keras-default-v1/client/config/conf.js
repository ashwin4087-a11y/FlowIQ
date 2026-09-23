const conf = {
  appName: "Yolo",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "https://alivefordie.life ", // ให้ตรงกับตัวแปรที่มีอยู่ใน .env,
  environment: process.env.NODE_ENV,
  featureFlags: {
    enableExperimentalFeature:
      process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURE === "true",
  },
};

export default conf;
