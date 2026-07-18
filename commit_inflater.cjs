const { execSync } = require('child_process');

console.log("Starting to generate 2000 empty commits...");

for (let i = 1; i <= 2000; i++) {
  try {
    execSync(`git commit --allow-empty -m "Auto commit ${i}"`, { stdio: 'ignore' });
    if (i % 100 === 0) {
      console.log(`Created ${i} commits...`);
    }
  } catch (err) {
    console.error(`Error at commit ${i}`, err);
    break;
  }
}

console.log("Finished creating commits! Pushing to GitHub...");
try {
  execSync('git push -u origin main -f', { stdio: 'inherit' });
  console.log("Successfully pushed 2000 commits to GitHub!");
} catch (err) {
  console.error("Failed to push:", err);
}
