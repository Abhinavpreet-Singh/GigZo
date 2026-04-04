export const STATE_CITY_MAP: Record<string, string[]> = {
  Delhi: [
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "West Delhi",
    "East Delhi",
  ],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  Chandigarh: ["Chandigarh"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Mohali"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Telangana: ["Hyderabad", "Warangal"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur"],
  "West Bengal": ["Kolkata", "Howrah"],
};

export const CITY_ZONE_MAP: Record<string, string[]> = {
  "New Delhi": ["Connaught Place", "Karol Bagh", "Lajpat Nagar"],
  "North Delhi": ["Civil Lines", "Model Town", "Azadpur"],
  "South Delhi": ["Saket", "Hauz Khas", "Nehru Place"],
  "West Delhi": ["Janakpuri", "Tilak Nagar", "Dwarka"],
  "East Delhi": ["Preet Vihar", "Mayur Vihar", "Laxmi Nagar"],
  Gurugram: ["Sector 29", "DLF Phase 3", "Sohna Road"],
  Faridabad: ["NIT", "Sector 15", "Sector 37"],
  Chandigarh: ["Sector 17", "Sector 22", "Sector 35"],
  Ludhiana: ["Civil Lines", "Model Town", "Dugri"],
  Amritsar: ["Ranjit Avenue", "Hall Gate", "Putlighar"],
  Mumbai: ["Andheri", "Bandra", "Powai"],
  Pune: ["Hinjewadi", "Kothrud", "Viman Nagar"],
  Nagpur: ["Dharampeth", "Sitabuldi", "Trimurti Nagar"],
  Bengaluru: ["Indiranagar", "Whitefield", "HSR Layout"],
  Mysuru: ["Kuvempunagar", "VV Mohalla", "Nazarbad"],
  Hyderabad: ["Hitech City", "Gachibowli", "Banjara Hills"],
  Chennai: ["T Nagar", "Velachery", "Anna Nagar"],
  Coimbatore: ["RS Puram", "Peelamedu", "Saibaba Colony"],
  Lucknow: ["Hazratganj", "Gomti Nagar", "Aliganj"],
  Noida: ["Sector 18", "Sector 62", "Sector 137"],
  Ghaziabad: ["Indirapuram", "Raj Nagar", "Vaishali"],
  Kolkata: ["Salt Lake", "Park Street", "Howrah Maidan"],
};

export function findStateByCity(city: string): string | null {
  const normalized = city.trim().toLowerCase();
  for (const [state, cities] of Object.entries(STATE_CITY_MAP)) {
    const found = cities.find((entry) => entry.toLowerCase() === normalized);
    if (found) {
      return state;
    }
  }
  return null;
}
