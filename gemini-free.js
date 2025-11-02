import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyC8GueqK0wll8Xl-jQrDhBfz2sAJIgf3uw");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const prompt = "Say hello in one word";

const result = await model.generateContent(prompt);
console.log("✅ Success! Bot says:", result.response.text());
