import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "tidecloak.json");

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return new Response(data, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to read JSON" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to write JSON" }), { status: 500 });
  }
}
