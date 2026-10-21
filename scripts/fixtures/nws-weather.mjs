export function nwsFixture(now, icon = 'skc', laterIcon = 'rain') {
  const hour = 3600000;
  return { properties:{
    updateTime:new Date(now - 15 * 60000).toISOString(),
    generatedAt:new Date(now).toISOString(),
    periods:Array.from({ length:24 }, (_, i) => ({
      startTime:new Date(Math.floor(now / hour) * hour + i * hour).toISOString(),
      endTime:new Date(Math.floor(now / hour) * hour + (i + 1) * hour).toISOString(),
      temperature:Math.round((20 + i) * 9 / 5 + 32), temperatureUnit:'F',
      windSpeed:'11 mph', isDaytime:true,
      icon:`https://api.weather.gov/icons/land/day/${i ? laterIcon : icon}`,
      shortForecast:(i ? laterIcon : icon) === 'skc' ? 'Clear' : (i ? laterIcon : icon) === 'sct' ? 'Partly Cloudy' : 'Rain',
      probabilityOfPrecipitation:{ value:i ? 40 : 0 }
    }))
  } };
}
export const nwsPoint = { properties:{ forecastHourly:'https://api.weather.gov/gridpoints/BMX/86,88/forecast/hourly' } };
