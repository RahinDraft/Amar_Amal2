export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak: string;
  sunrise: string;
}

export const getPrayerTimes = async (lat: number, lng: number): Promise<PrayerTimes> => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lng}&method=2`);
    const data = await response.json();
    const timings = data.data.timings;
    
    return {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      imsak: timings.Imsak,
      sunrise: timings.Sunrise
    };
  } catch (error) {
    // Fallback times for Dhaka
    return {
      fajr: "05:15",
      dhuhr: "12:15",
      asr: "15:45",
      maghrib: "18:15",
      isha: "19:30",
      imsak: "05:05",
      sunrise: "06:30"
    };
  }
};
