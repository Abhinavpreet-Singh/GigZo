/**
 * ai_model/client/index.ts
 *
 * Barrel export — single entry point for the AI model's
 * TypeScript client SDK.
 *
 * Usage in mobile app (via @ai path alias):
 *   import { fetchLiveWeather, computeRiskLevel } from "@ai";
 */

export {
  fetchLiveWeather,
  resolveCity,
  checkAiConnectivity,
  computeRiskLevel,
  fetchPolicySummary,
  CITY_COORDS,
  fetchLiveWeatherByCoords,
  type LiveWeatherData,
  type PolicySummary,
  type PolicySummaryInput,
  type CityResult,
  type RiskLevel,
} from "./weatherApi";
