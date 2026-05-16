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

export const generateAIRecommendation = async (req, res) => {
  try {
    const { query, brand, model, engine, budget, usageStyle } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: "GEMINI_API_KEY missing in .env" });
    }

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
      You are the "MODMYRIDE AI Advisor", an expert automotive tuning consultant.
      Your goal is to parse user intent and provide a professional tuning roadmap.

      RULES:
      1. Return ONLY a valid JSON object.
      2. If the user's intent OR the provided parameters (brand, model, budget) are insufficient to identify a vehicle or a clear performance goal, set "missingInfo": true and provide a helpful "question" to get the missing details.
      3. If all information is present, set "missingInfo": false and generate the full build.
      4. Extracted parameters should match the provided VEHICLES list where possible.

      CONTEXT:
      - AVAILABLE VEHICLES: ${JSON.stringify(contextVehicles.map(v => ({ id: v._id, name: `${v.make} ${v.model}`, brand: v.make, model: v.model })))}
      - UPGRADES: ${JSON.stringify(allUpgrades.map(u => ({ id: u._id, name: u.name, category: u.category, price: u.price })))}
      
      USER INPUT: "${query}"
      PROVIDED METADATA: { Brand: "${brand}", Model: "${model}", Budget: "${budget}", Usage: "${usageStyle}" }
      
      OUTPUT JSON STRUCTURE:
      {
        "missingInfo": boolean,
        "question": "String (only if missingInfo is true)",
        "extractedParams": { "brand": "string", "model": "string", "budget": number, "goal": "string" },
        "vehicle": { "id": "id", "name": "name" },
        "summary": "Build summary",
        "performanceStats": { "estimatedHP": 150, "estimatedTorque": 200, "reliabilityScore": 90, "dailyUsability": 85, "buildScore": 80 },
        "recommendedUpgrades": [{ "upgradeId": "id", "name": "Part Name", "category": "Category", "reasoning": "reason" }],
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
