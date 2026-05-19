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
  let budgetFound = true;
  if (!budget) {
    // Priority 1: lakh notation — "1 lakh", "1.5 lakh", "1l", "1.5l", "1 l", "1.5 l", "1lakh"
    const lakhs = q.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|l\b)/);
    // Priority 2: k-notation — "50k" (guard: NOT preceded by a letter so "cb300k" doesn't match)
    const k = q.match(/(?<![a-z])(\d+)\s*k\b(?!m)/);
    // Priority 3: explicit budget keyword — "under 50000", "budget ₹30000", "within 25k"
    const kwdBudget = q.match(/(?:under|within|upto|up\s*to|budget|max|around)\s*(?:rs\.?\s*|₹\s*)?(\d[\d,]+)/);
    // Priority 4: currency-prefixed — "₹50000", "rs 30000"
    const currencyPrefixed = q.match(/(?:rs\.?\s*|₹\s*|inr\s*)(\d[\d,]+)/i);
    // Priority 5: bare standalone number ≥4 digits NOT surrounded by letters
    // This prevents matching model codes like "300" in "cb300r" or "390" in "duke390"
    const standaloneNum = q.match(/(?<![a-z\d])(\d{4,})(?![a-z\d])/);

    if (lakhs)               budget = Math.round(parseFloat(lakhs[1]) * 100000);
    else if (k)              budget = parseInt(k[1]) * 1000;
    else if (kwdBudget)      budget = parseInt(kwdBudget[1].replace(/,/g, ""));
    else if (currencyPrefixed) budget = parseInt(currencyPrefixed[1].replace(/,/g, ""));
    else if (standaloneNum)  budget = parseInt(standaloneNum[1].replace(/,/g, ""));
    else {
      // No budget signal — fall back to vehicle-type heuristic
      budgetFound = false;
      const isCar = /car|swift|fortuner|innova|creta|i20|baleno|alto|brezza|nexon|polo|vento|city|civic|corolla|seltos|venue/.test(q);
      budget = isCar ? 75000 : 30000;
    }
  }

  return { goal, budget: Number(budget), budgetFound };
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
    const resolvedGoal = parsed.goal;
    const resolvedBudget = parsed.budget;
    const budgetFound = parsed.budgetFound;

    // ---------------------------------------------------------------------------
    // PRE-VALIDATION: if there is absolutely no vehicle hint, skip Gemini and
    // return a friendly clarification immediately.
    // ---------------------------------------------------------------------------
    let hasDbMatch = false;
    try {
      const STOP_WORDS = new Set(["performance", "mods", "mod", "under", "best", "good", "better", "cheap", "free", "upgrade", "upgrades", "how", "what", "my", "for", "the", "and", "with", "want", "need", "give", "can", "lakh", "lakhs", "budget", "price"]);
      const queryWords = (query || "").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
      if (queryWords.length > 0) {
        const searchConditions = queryWords.map(word => ({
          $or: [
            { make: { $regex: word, $options: "i" } },
            { model: { $regex: word, $options: "i" } }
          ]
        }));
        const matchingVehicleCount = await Vehicle.countDocuments({ $or: searchConditions });
        if (matchingVehicleCount > 0) {
          hasDbMatch = true;
        }
      }
    } catch (err) {
      console.error("DB Vehicle count error:", err);
    }

    const VEHICLE_HINT_RE = /(duke|pulsar|rs200|r15|r\s*15|ns200|cbr|swift|fortuner|innova|creta|i20|baleno|alto|brezza|nexon|polo|vento|city|civic|corolla|seltos|venue|ktm|yamaha|honda|bajaj|royal\s*enfield|tvs|hero|suzuki|hyundai|toyota|maruti|tata|mahindra|bmw|bike|car|vehicle|moto|scooter|supra|mustang|wagonr|dzire|ertiga|glanza|fronx|jimny|ciaz|fz|apache|dominar|himalayan|thunderbird|interceptor|meteor|classic\s*350|bullet|kawasaki|ninja|z900|z1000|harley|ducati|triumph|porsche|audi|mercedes|benz|volvo|jaguar|land\s*rover|rc390|rc200|duke390|duke250|v-strom|gixxer|r3|r6|r1|zx10r|hayabusa)/i;
    const hasVehicleHint = brand || model || hasDbMatch || VEHICLE_HINT_RE.test(query || "");

    if (!hasVehicleHint) {
      return res.json({
        success: true,
        data: {
          missingInfo: true,
          question: "I couldn't find a vehicle in your message. Please mention your bike or car model (e.g. 'KTM Duke 390', 'Yamaha R15', 'Maruti Swift') and I'll build a full performance roadmap for you.",
          extractedParams: { brand: "", model: "", budget: resolvedBudget, goal: resolvedGoal },
        },
      });
    }

    // Prompt for missing budget if budget was not found in query and not provided in selection
    if (!budgetFound && !budget) {
      let vehicleName = "";
      if (brand || model) {
        vehicleName = `${brand || ""} ${model || ""}`.trim();
      } else {
        const match = (query || "").match(VEHICLE_HINT_RE);
        if (match) vehicleName = match[0].toUpperCase();
      }
      
      return res.json({
        success: true,
        data: {
          missingInfo: true,
          question: `Could you please specify your budget for the modifications? Knowing your budget helps me select the most optimal performance parts for your ${vehicleName || 'vehicle'}.`,
          extractedParams: { brand: brand || "", model: model || "", budget: "", goal: resolvedGoal },
        },
      });
    }

    // Build search terms — ignore common filler words so we don't match wrong vehicles
    const STOP_WORDS = new Set(["performance", "mods", "mod", "under", "best", "good", "better", "cheap", "free", "upgrade", "upgrades", "how", "what", "my", "for", "the", "and", "with", "want", "need", "give", "can"]);
    const queryWords = (query || "").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
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

      ABSOLUTE RULES — VIOLATIONS ARE NOT ACCEPTABLE:
      1. Return ONLY a valid JSON object — no markdown, no explanation text.
      2. "missingInfo" MUST be false UNLESS the query contains ZERO recognisable vehicle name, model, or make.
         - If ANY vehicle name/nickname/model is present → missingInfo = false.
         - NEVER set missingInfo = true just because goal or budget is missing — always infer those.
      3. GOAL INFERENCE (mandatory, never ask):
         - "fuel", "mileage", "economy", "efficient", "kmpl" → "Better Mileage"
         - "performance", "power", "hp", "torque", "fast", "speed", "mods", "boost" → "Performance"
         - "handling", "grip", "corner", "brake", "suspension" → "Handling"
         - "track", "race", "drift" → "Track Performance"
         - If unclear → "Performance" (safe default)
      4. BUDGET INFERENCE (mandatory, never ask):
         - Parse "50k" → 50000, "1 lakh" → 100000, "₹30,000" → 30000
         - If absent: bikes default ₹30,000, cars default ₹75,000
      5. VEHICLE MATCHING EXAMPLES (these aliases are sufficient — do NOT ask for more):
         - "duke", "duke 390", "ktm duke" → KTM Duke 390
         - "r15", "yamaha r15" → Yamaha YZF-R15
         - "pulsar", "ns200", "rs200" → Bajaj Pulsar
         - "swift", "maruti swift" → Maruti Suzuki Swift
         - "cbr", "honda cbr" → Honda CBR
         - "fortuner", "innova", "creta" → respective Toyota/Hyundai models
      6. If the vehicle is NOT in AVAILABLE VEHICLES list, still generate the full build using your
         automotive engineering knowledge. Set vehicle.id = null and vehicle.name = the full vehicle name.

      PRE-RESOLVED DATA (treat as FACTS — do NOT override or ask for them again):
        Goal   : "${resolvedGoal}"
        Budget : ₹${resolvedBudget}
        Brand  : "${brand || 'infer from query'}"
        Model  : "${model || 'infer from query'}"

      CONTEXT:
      - AVAILABLE VEHICLES: ${JSON.stringify(contextVehicles.map(v => ({ id: v._id, name: `${v.make} ${v.model}`, brand: v.make, model: v.model })))}
      - UPGRADES: ${JSON.stringify(allUpgrades.map(u => ({ id: u._id, name: u.name, category: u.category, price: u.price })))}
      
      USER INPUT: "${query}"
      
      OUTPUT JSON STRUCTURE (return exactly this shape, no extras):
      {
        "missingInfo": false,
        "question": "",
        "extractedParams": { "brand": "string", "model": "string", "budget": number, "goal": "string" },
        "vehicle": { "id": "mongoId or null", "name": "Full Vehicle Name" },
        "summary": "Expert 2–3 sentence build summary",
        "performanceStats": { "estimatedHP": number, "estimatedTorque": number, "reliabilityScore": number, "dailyUsability": number, "buildScore": number },
        "recommendedUpgrades": [{ "upgradeId": "mongoId or null", "name": "Part Name", "category": "Category", "price": number, "reasoning": "why this part" }],
        "stages": [{ "label": "Stage 1 — name", "parts": ["Part A", "Part B"] }],
        "impact": { "Acceleration": "Improved", "Top Speed": "Improved", "Handling": "Stable", "Throttle Response": "Sharpened" },
        "warnings": ["Warning if any"],
        "priority": ["Priority mod 1", "Priority mod 2"]
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
