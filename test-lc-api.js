async function check() {
  try {
    const res = await fetch("https://leetcode-api-faisalshabbir.vercel.app/Idhaya_1514");
    const json = await res.json();
    console.log("Vercel API Response:", json);
  } catch (e) {
    console.error("Vercel API Failed:", e);
  }
}
check();
