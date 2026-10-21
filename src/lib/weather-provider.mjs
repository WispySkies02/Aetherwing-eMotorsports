// Select from catalog geography, never the visitor's location or track-name guesses.
const states = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR VI GU AS MP'.split(' '));
const nws = Object.freeze({ id:'nws', label:'Weather: National Weather Service', url:'https://www.weather.gov/' });
const met = Object.freeze({ id:'met', label:'Weather: MET Norway (CC BY 4.0)', url:'https://www.met.no/en/free-meteorological-data' });

export function weatherProvider(venue) {
  return states.has(venue?.city?.split(', ').at(-1)) ? nws : met;
}
