import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  /**
   * Analyzes financial data and answers user queries.
   */
  async askFinancialAssistant(query: string, transactions: Transaction[]): Promise<string> {
    try {
      // Prepare context from transactions
      // Limit to last 100 transactions to save tokens/context window
      const recentTransactions = transactions.slice(0, 100);
      
      const transactionContext = recentTransactions.map(t => 
        `- ${t.date.split('T')[0]}: ${t.type.toUpperCase()} of ${t.amount} via ${t.paymentType || 'Cash'} for "${t.description}" (Category: ${t.category})${t.customerName ? ` with party "${t.customerName}"` : ''}`
      ).join('\n');

      const systemPrompt = `
        You are "Smart Khata AI", a helpful and intelligent financial assistant embedded in a ledger app.
        
        Here is the user's recent transaction history (Khata):
        ${transactionContext}

        If the transaction list is empty, kindly ask the user to add some transactions first.

        Your Goal:
        1. Answer the user's specific question based on the data provided.
        2. Pay attention to specific details like Payment Mode (UPI, Cash, Card) and Customer Name.
        3. If asked for advice, provide simple, practical financial tips.
        4. Be concise, friendly, and professional.
        5. Use formatting (like markdown bolding) to make numbers pop.
        
        User Question: "${query}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      return response.text || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, I'm having trouble connecting to the smart assistant right now. Please check your internet connection.";
    }
  },

  /**
   * Suggests a category for a given description (Optional smart feature)
   */
  async suggestCategory(description: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest a single, one-word category for a transaction with the description: "${description}". Examples: Food, Travel, Utilities, Salary, Rent, Entertainment. Output ONLY the word.`,
        });
        return response.text?.trim() || "General";
    } catch (e) {
        return "General";
    }
  }
};