const { Client } = require("pg");

const regions = [
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "ca-central-1",
  "sa-east-1",
];

async function testRegions() {
  for (const region of regions) {
    const pooler = `aws-0-${region}.pooler.supabase.com`;
    const client = new Client({
      host: pooler,
      port: 5432,
      database: "postgres",
      user: "postgres.cbhfjgnihkppdbwdqbmz",
      password: "Idhayakumar@123",
      ssl: { rejectUnauthorized: false }, // Required by Supavisor
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! Correct region found: ${region}`);
      await client.end();
      return;
    } catch (err) {
      if (err.message.includes("not found")) {
        console.log(`❌ Region ${region} incorrect (tenant not found).`);
      } else if (err.message.includes("password authentication failed")) {
        console.log(`⚠️ Region ${region} correct, but WRONG PASSWORD!`);
        return;
      } else {
        console.log(`❓ Region ${region} error: ${err.message}`);
      }
    }
  }
}

testRegions();
