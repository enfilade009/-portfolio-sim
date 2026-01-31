
import { GoogleGenAI, Type } from "@google/genai";
import { DividendHolding, PayoutPattern } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchTickerData = async (ticker: string): Promise<{ 
  price: number, 
  dividend: number, 
  frequency: string, 
  growth: number,
  paymentMonths: string[],
  sector: string,
  payoutRatio: number
} | null> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      Retrieve real-time financial data for ticker symbol "${ticker}".
      Use reputable financial sources (Nasdaq, Yahoo Finance, Seeking Alpha).
      
      Required Data:
      1. Current Price
      2. Annual Dividend Amount per Share (Forward or TTM)
      3. Dividend Frequency
      4. Typical Payment Months (e.g., Jan, Apr, Jul, Oct)
      5. 5-Year Dividend Growth Rate (CAGR)
      6. GICS Sector
      7. Payout Ratio (Earnings or FFO for REITs)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.NUMBER, description: "Current stock price" },
            dividend: { type: Type.NUMBER, description: "Annual dividend per share" },
            frequency: { 
              type: Type.STRING, 
              enum: ["Monthly", "Quarterly", "Semi-Annual", "Annual", "Irregular"],
              description: "Frequency of dividend payments"
            },
            paymentMonths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of month names (abbreviated) when dividends are paid"
            },
            growth: { type: Type.NUMBER, description: "5-Year Dividend Growth Rate as a decimal (e.g. 0.05)" },
            sector: { type: Type.STRING, description: "The industry sector" },
            payoutRatio: { type: Type.NUMBER, description: "Payout ratio as a decimal (e.g. 0.65)" }
          },
          required: ["price", "dividend", "frequency", "paymentMonths", "growth", "sector", "payoutRatio"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      price: data.price || 0,
      dividend: data.dividend || 0,
      frequency: data.frequency || "Quarterly",
      growth: data.growth || 0,
      paymentMonths: data.paymentMonths || [],
      sector: data.sector || "Unknown",
      payoutRatio: data.payoutRatio || 0
    };

  } catch (error) {
    console.error("Failed to fetch ticker data", error);
    return null;
  }
};

export const analyzeDividendLadder = async (
  holdings: DividendHolding[],
  monthlyTarget: number
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Pre-calculate monthly income to give AI precise data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals = new Array(12).fill(0);

    holdings.forEach(h => {
      let indices: number[] = [];
      switch (h.payoutPattern) {
        case 'Monthly': indices = [0,1,2,3,4,5,6,7,8,9,10,11]; break;
        case 'Q-Jan/Apr/Jul/Oct': indices = [0, 3, 6, 9]; break;
        case 'Q-Feb/May/Aug/Nov': indices = [1, 4, 7, 10]; break;
        case 'Q-Mar/Jun/Sep/Dec': indices = [2, 5, 8, 11]; break;
        case 'Semi-Annual': indices = [5, 11]; break;
        case 'Annual': indices = [11]; break;
        default: indices = [0]; 
      }
      
      const totalPay = h.shares * h.annualDividendPerShare;
      const payPerPeriod = totalPay / indices.length;
      indices.forEach(i => monthlyTotals[i] += payPerPeriod);
    });

    const cashflowProfile = monthNames.map((m, i) => {
        const amount = monthlyTotals[i];
        const gap = amount - monthlyTarget;
        return `${m}: $${amount.toFixed(0)} (${gap >= 0 ? '+' : ''}${gap.toFixed(0)})`;
    }).join(', ');

    const prompt = `
      You are a Senior Quantitative Portfolio Manager specializing in Dividend Ladder strategies.
      
      **Portfolio Data:**
      - Monthly Income Target: $${monthlyTarget.toLocaleString()}
      - Actual Monthly Cashflow: ${cashflowProfile}
      - Current Holdings: ${JSON.stringify(holdings.map(h => h.ticker).join(', '))}
      
      **Goal:** 
      Perform a forensic analysis of the income gaps and prescribe specific financial instruments to solve them.
      
      **Output Requirements:**
      Return exactly 3 sections separated by "|||". 
      Use purely Tailwind-styled HTML appropriate for a dark UI (text-gray-300, borders-gray-700). 
      DO NOT return Markdown. DO NOT return JSON. Return raw HTML strings.

      **Section 1: Income Gap Autopsy**
      Create a dense, professional HTML <table> listing ONLY the months where (Income < Target).
      - Table Classes: <table class="w-full text-xs text-left border-collapse">
      - Header Row: <tr class="border-b border-gray-700 text-gray-500 uppercase font-bold tracking-wider">
      - Headers: Month, Projected Income, Deficit Amount, Coverage %
      - Data Rows: <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
      - Values: Use <span class="font-mono text-white"> for values. Highlight the Deficit in <span class="text-nordic-terra font-bold">.
      
      **Section 2: The Ladder Strategy (Actionable)**
      Return a container <div class="space-y-4">.
      For the specific months identified above, suggest SPECIFIC instruments.
      - If gap is Jan/Apr/Jul/Oct: Suggest tickers like JPM, CSCO, KMB.
      - If gap is Feb/May/Aug/Nov: Suggest tickers like ABBV, O, PG.
      - If gap is Mar/Jun/Sep/Dec: Suggest tickers like SCHD, CVX, XOM.
      - If gap is specific/one-off: Suggest a specific T-Bill Maturity (e.g. "Buy 6-Mo T-Bill maturing in [Month]").
      
      *Format for each suggestion:*
      <div class="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col gap-1">
         <div class="flex justify-between items-center">
            <span class="text-nordic-sage font-bold text-sm">[Gap Month] Solver</span>
            <span class="text-[10px] uppercase font-bold bg-nordic-blue/10 text-nordic-blue px-2 py-0.5 rounded">Action</span>
         </div>
         <p class="text-xs text-gray-300">Strategy: Buy <strong>[Ticker/Instrument]</strong>. [Brief rationale].</p>
      </div>

      **Section 3: Efficiency Audit**
      Return a single <div class="text-xs text-gray-400 italic bg-black/20 p-3 rounded border border-white/5">.
      Provide a 2-sentence executive summary on yield efficiency (e.g., "Yield on Cost is healthy at X%, but dependency on Month Y creates liquidity risk.").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] // Enable search to find current tickers matching gaps
      }
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate analysis due to connectivity issues.";
  }
};

