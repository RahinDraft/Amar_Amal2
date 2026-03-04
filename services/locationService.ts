
export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
      headers: {
        'Accept-Language': 'bn' // Request Bengali if available
      }
    });
    const data = await response.json();
    
    // Try to get a meaningful name: city, town, village, or state
    const address = data.address;
    const locationName = address.city || address.town || address.village || address.suburb || address.state || address.country;
    
    return locationName || "অজানা লোকেশন";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw new Error("লোকেশন লোড করা সম্ভব হয়নি");
  }
};
