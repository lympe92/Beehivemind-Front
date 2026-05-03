export interface WeatherCurrent {
  temperature:              number;
  humidity:                 number;
  windSpeed:                number;
  windGust:                 number;
  windDirection:            number;
  precipitationProbability: number;
  uvIndex:                  number;
  cloudCover:               number;
  pressureSurfaceLevel:     number;
  weatherCode:              number;
}

export interface WeatherDay {
  date:                     string;
  tempMin:                  number;
  tempMax:                  number;
  precipitationProbability: number;
  precipitationMm:          number;
  weatherCode:              number;
  windSpeedMax:             number;
  sunriseTime:              string | null;
  sunsetTime:               string | null;
}

export interface WeatherHour {
  time:                     string;
  temperature:              number;
  precipitationProbability: number;
  precipitationMm:          number;
  windSpeed:                number;
  humidity:                 number;
  cloudCover:               number;
  weatherCode:              number;
}

export interface WeatherData {
  current:  WeatherCurrent;
  forecast: WeatherDay[];
  hourly:   WeatherHour[];
}
