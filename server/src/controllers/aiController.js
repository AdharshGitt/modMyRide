import Vehicle from "../models/Vehicle.js";
import Upgrade from "../models/Upgrade.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const cleanResponse = (text) => {
  if (text.includes("```json")) {
    return text.split("```json")[1].split("```")[0].trim();
  } else if (text.includes("```")) {
    const parts = text.split("```");
    return parts[1] ? parts[1].trim() : parts[0].trim();
  }
  return text.trim();
};


// Pre-parse the query locally to extract goal, budget so the AI never needs to ask
const parseQueryLocally = (query = "", providedBudget = "", providedGoal = "") => {
  const q = query.toLowerCase();

  // --- GOAL ---
  let goal = providedGoal || "";
  if (!goal) {
    if (/fuel|mileage|econom|efficiency|efficient|km.?l|kmpl/.test(q)) goal = "Better Mileage";
    else if (/performance|power|hp|horsepower|torque|fast|speed|accelerat|boost|turbo|stage/.test(q)) goal = "Performance";
    else if (/handl|grip|corner|brake|suspension|tyre|tire|steer/.test(q)) goal = "Handling";
    else if (/track|race|drift|circuit/.test(q)) goal = "Track Performance";
    else if (/comfort|noise|smooth|daily|highway/.test(q)) goal = "Daily Comfort";
    else goal = "Performance"; // safe default
  }

  // --- BUDGET ---
  let budget = providedBudget || "";
  if (!budget) {
    // e.g. "₹50000", "50k", "1 lakh", "50,000", "under 30000"
    const lakhs = q.match(/(\d+(?:\.\d+)?)\s*lakh/);
    const k = q.match(/(\d+)\s*k\b/);
    const plain = q.match(/[₹rs.]*\s*(\d[\d,]*)/);
    if (lakhs) budget = Math.round(parseFloat(lakhs[1]) * 100000);
    else if (k) budget = parseInt(k[1]) * 1000;
    else if (plain) budget = parseInt(plain[1].replace(/,/g, ""));
    else {
      // heuristic: bikes default ₹30k, cars ₹75k — check for car keywords
      const isCar = /car|swift|fortuner|innova|creta|i20|baleno|alto|brezza|nexon|polo|vento|city|civic|corolla|seltos|venue/.test(q);
      budget = isCar ? 75000 : 30000;
    }
  }

  return { goal, budget: Number(budget) };
};

export const generateAIRecommendation = async (req, res) => {
  try {
    const { query, brand, model, engine, budget, usageStyle } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: "GEMINI_API_KEY missing in .env" });
    }

    // Pre-extract goal & budget from the raw query so AI never needs to ask
    const parsed = parseQueryLocally(query, budget, usageStyle);
    const resolvedGoal   = parsed.goal;
    const resolvedBudget = parsed.budget;

    // Search for vehicles matching the query or provided metadata
    const queryWords = query ? query.split(" ") : [];
    const searchConditions = queryWords.length > 0 ? queryWords.map(word => ({
      $or: [
        { make: { $regex: word, $options: "i" } },
        { model: { $regex: word, $options: "i" } }
      ]
    })) : [];

    const [relevantVehicles, allUpgrades] = await Promise.all([
      Vehicle.find(searchConditions.length > 0 ? { $or: searchConditions } : {}).limit(20).lean(),
      Upgrade.find({}).lean()
    ]);

    // Also get some general vehicles for context if relevant is small
    let contextVehicles = relevantVehicles;
    if (contextVehicles.length < 10) {
      const extraVehicles = await Vehicle.find({ _id: { $nin: relevantVehicles.map(v => v._id) } }).limit(40).lean();
      contextVehicles = [...relevantVehicles, ...extraVehicles];
    }

    const systemPrompt = `
      You are the "MODMYRIDE AI Advisor", an expert automotive tuning consultant for the Indian market.
      Your goal is to parse user intent and provide a professional performance tuning roadmap.

      CRITICAL RULES — FOLLOW EXACTLY:
      1. Return ONLY a valid JSON object — no markdown, no explanation text.
      2. Set "missingInfo": true ONLY if you cannot identify the vehicle at all. If ANY recognisable vehicle name, nickname, or model code is present, set "missingInfo": false and proceed.
      3. GOAL: If the user says "fuel efficient", "mileage", "economy" → goal = "Better Mileage". "faster", "performance", "power" → goal = "Performance". "handling", "corners", "grip" → goal = "Handling". NEVER ask for goal when it is clearly stated in the query.
      4. BUDGET: If not mentioned, assume ₹30,000 for bikes and ₹75,000 for cars. NEVER ask for budget — just assume a reasonable amount.
      5. VEHICLE EXAMPLES — these are SUFFICIENT to identify, do NOT ask for more details:
         - "RS 200", "rs200", "pulsar rs" → Bajaj Pulsar RS200
         - "R15", "r15 v3", "yamaha r15" → Yamaha YZF-R15
         - "Duke", "duke 390", "ktm duke" → KTM Duke
         - "Swift", "maruti swift" → Maruti Suzuki Swift
         - "Pulsar", "ns200", "pulsar 200" → Bajaj Pulsar
         - "CBR", "honda cbr" → Honda CBR
         - "Fortuner", "innova", "creta" → respective Toyota/Hyundai models
      6. Match extracted vehicle to the AVAILABLE VEHICLES list where possible; if not found, still generate the full build using your automotive knowledge.

      EXAMPLE — given input: "how to increase fuel efficient in my rs 200"
      → missingInfo: false, vehicle: "Bajaj Pulsar RS200", goal: "Better Mileage", budget: 30000 (assumed)

      CONTEXT:
      - AVAILABLE VEHICLES: ${JSON.stringify(contextVehicles.map(v => ({ id: v._id, name: `${v.make} ${v.model}`, brand: v.make, model: v.model })))}
      - UPGRADES: ${JSON.stringify(allUpgrades.map(u => ({ id: u._id, name: u.name, category: u.category, price: u.price })))}
      
      USER INPUT: "${query}"
      PRE-RESOLVED METADATA (already extracted — treat these as FACTS, do NOT ask for them again):
        Goal: "${resolvedGoal}"
        Budget: ₹${resolvedBudget}
        Brand: "${brand || 'infer from query'}"
        Model: "${model || 'infer from query'}"
      
      OUTPUT JSON STRUCTURE:
      {
        "missingInfo": boolean,
        "question": "String (only if missingInfo is true — keep it short and friendly)",
        "extractedParams": { "brand": "string", "model": "string", "budget": number, "goal": "string" },
        "vehicle": { "id": "id or null", "name": "full vehicle name" },
        "summary": "Build summary",
        "performanceStats": { "estimatedHP": 150, "estimatedTorque": 200, "reliabilityScore": 90, "dailyUsability": 85, "buildScore": 80 },
        "recommendedUpgrades": [{ "upgradeId": "id or null", "name": "Part Name", "category": "Category", "reasoning": "reason" }],
        "stages": [{ "label": "Stage 1", "parts": ["Part A"] }],
        "impact": { "Acceleration": "Improved", "Top Speed": "Improved", "Handling": "Stable" },
        "warnings": ["Warning 1"],
        "priority": ["Priority 1"]
      }
    `;
    console.log("SENT PROMPT TO AI:", systemPrompt);

    // Prioritize Gemini 2.0 Flash
    // Using the exact models discovered from your API key
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    ];

    let lastError;
    for (const url of endpoints) {
      try {
        console.log(`Trying endpoint: ${url.split('?')[0]}`);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        const data = await response.json();
        
        if (data.error) {
          console.warn(`Endpoint failed: ${data.error.message}`);
          lastError = data.error;
          continue;
        }

        const responseText = data.candidates[0].content.parts[0].text;
        console.log("AI RETURNED RAW:", responseText);

        const aiResult = JSON.parse(cleanResponse(responseText));
        console.log("AI RESULT PARSED:", aiResult);
        
        return res.json({ success: true, data: aiResult });
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw new Error(lastError?.message || "All Gemini endpoints failed");

  } catch (error) {
    console.error("AI Error:", error);
    
    // Attempt to discover available models to help the user
    let availableModels = "Unknown";
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      if (listData.models) {
        availableModels = listData.models.map(m => m.name.replace('models/', '')).join(', ');
      }
    } catch (e) {
      availableModels = "Failed to fetch model list";
    }

    res.status(500).json({ 
      success: false, 
      message: `${error.message}. \n\nAvailable models for your key: ${availableModels}` 
    });
  }
};
