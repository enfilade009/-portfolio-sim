
import { GoogleGenAI, Type } from "@google/genai";
import { SimulationSummary, SimulationYearResult, AssetParams, TaxLot } from '../types';

export const getWealthInsights = async (
  summary: SimulationSummary,
  assets: AssetParams[],
  endYearData: SimulationYearResult
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const assetMixStr = assets.map(a => `${a.category}: ${a.weight}%`).join(', ');
  
  const prompt = `
    Act as a senior wealth strategist. Analyze this simulation.
    
    **Data:**
    - Asset Mix: ${assetMixStr}
    - Success Chance: ${summary.probabilityOfSuccess.toFixed(1)}%
    - Median End Wealth: $${Math.round(summary.medianTerminalWealth).toLocaleString()}
    - Worst Case Drawdown: ${summary.worstDrawdown.toFixed(1)}%
    
    **Instructions:**
    Return ONLY a response with 3 clear sections separated by "|||". Do not use markdown headers like ##.
    
    Section 1: The Verdict. A single, punchy sentence on if this plan works.
    Section 2: The Good & The Bad. 3 bullet points analyzing the growth drivers and the risks. Use emojis.
    Section 3: One Bold Move. A specific, actionable tip to improve the outcome (e.g. "Increase Small Cap exposure" or "Save 2% more").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this time due to connectivity.";
  }
};

export const analyzeThesisDrift = async (
  lots: TaxLot[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const lotsPayload = JSON.stringify(lots.map(l => ({
    ticker: l.ticker,
    buy_date: l.purchaseDate,
    thesis: l.buyThesis
  })));

  const prompt = `
    Role: You are a Quantitative Investment Manager acting as a risk auditor.
    Task: Evaluate the "Thesis Drift" for the following positions based on typical current market conditions for these sectors.
    
    Portfolio Data:
    ${lotsPayload}

    Instructions:
    For EACH holding, determining if the original thesis is "Intact", "Drifting", or "Broken" based on general market logic (e.g. if thesis was low rates, and rates are high, it is broken).
    
    Output Format:
    Return a single valid JSON array. Do not use markdown code blocks.
    Structure:
    [
      {
        "lotId": "use ticker as id for this demo", 
        "ticker": "SYM",
        "status": "Intact" | "Drifting" | "Broken",
        "reasoning": "Brief explanation of why.",
        "action": "Hold" | "Review" | "Sell"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return response.text || "[]";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "[]";
  }
};

