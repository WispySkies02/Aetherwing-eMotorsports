
const explicitMapEntries = [
  [['Richmond Raceway','Richmond'],'richmond-raceway'],
  [['Kansas Speedway','Kansas'],'kansas-speedway'],
  [['Indianapolis Motor Speedway Road Course','Indy Road Course','Indianapolis Motor Speedway'],'indianapolis-road-course'],
  [['New Hampshire Motor Speedway','New Hampshire'],'new-hampshire-motor-speedway'],
  [['Homestead-Miami Speedway','Homestead-Miami','Homestead Miami Speedway'],'homestead-miami-speedway'],
  [['Daytona International Speedway','Daytona'],'daytona-international-speedway'],
  [['Darlington Raceway','Darlington'],'darlington-raceway'],
  [['Rockingham Speedway','Rockingham'],'rockingham-speedway'],
  [['Mexico City'],'mexico-city'],
  [['Las Vegas Motor Speedway','Las Vegas'],'las-vegas-motor-speedway'],
  [['Chicago Street Course'],'chicago-street-course'],
  [['Watkins Glen International','Watkins Glen'],'watkins-glen-international'],
  [['Charlotte Motor Speedway Roval'],'charlotte-roval'],
  [['Charlotte Motor Speedway','Charlotte'],'charlotte-motor-speedway'],
  [['Martinsville Speedway','Martinsville'],'martinsville-speedway'],
  [['Bristol Motor Speedway','Bristol'],'bristol-motor-speedway'],
  [['Talladega Superspeedway','Talladega'],'talladega-superspeedway'],
  [['Phoenix Raceway','Phoenix'],'phoenix-raceway'],
  [['Pocono Raceway'],'pocono-raceway'],
  [['Michigan International Speedway','Michigan'],'michigan-international-speedway'],
  [['Sonoma Raceway'],'sonoma-raceway'],
  [['Road America'],'road-america'],
  [['Portland'],'portland'],
  [['World Wide Technology Raceway'],'world-wide-technology-raceway'],
  [['Nashville Fairgrounds'],'nashville-fairgrounds'],
  [['Wake County Speedway'],'wake-county-speedway'],
  [['Five Flags Speedway'],'five-flags-speedway'],
  [['The Milwaukee Mile','Milwaukee'],'milwaukee-mile'],
  [['Bowman Gray Stadium'],'bowman-gray-stadium'],
  [['Dover Motor Speedway'],'dover-motor-speedway'],
  [['COTA'],'cota'],
  [['Virginia International Raceway'],'virginia-international-raceway'],
  [['Michelin Raceway Road Atlanta'],'road-atlanta'],
  [['Silverstone Circuit','Silverstone'],'silverstone-circuit'],
  [['Brands Hatch'],'brands-hatch'],
  [['Monza Oval'],'monza-oval'],
  [['Twin Ring Motegi'],'twin-ring-motegi'],
  [['Mount Panorama Circuit'],'mount-panorama-circuit'],
  [['Suzuka Circuit'],'suzuka-circuit'],
  [['Algarve International Circuit'],'algarve-international-circuit'],
  [['Chili Bowl'],'chili-bowl'],
  [['Knoxville Raceway'],'knoxville-raceway'],
  [['Tyler County Speedway'],'tyler-county-speedway'],
  [['Cedar Lake Speedway'],'cedar-lake-speedway'],
  [['Baileyville Speedway'],'baileyville-speedway'],
  [['Greece Speedway'],'greece-speedway'],
  [['Eldora Speedway'],'eldora-speedway'],
  [['The Dirt Track At Charlotte'],'dirt-track-at-charlotte'],
  [['Sunny South Raceway Park'],'sunny-south-raceway-park'],
  [['USA International Speedway'],'usa-international-speedway'],
  [['ABC Raceway'],'abc-raceway'],
  [['Crandon International Raceway'],'crandon-international-raceway'],
  [['Echo Park Speedway'],'echo-park-speedway'],
  [['Indianapolis Raceway Park'],'indianapolis-raceway-park'],
  [['Auto Club Speedway','Fontana'],'auto-club-speedway'],
  [['Naval Base Coronado'],'naval-base-coronado'],
  [['Daytona International Speedway Road Course'],'daytona-road-course'],
  [['Daytona Backstretch'],'daytona-backstretch']
];

const explicitByTrack = new Map();
for (const [aliases,key] of explicitMapEntries) {
  aliases.forEach(alias => explicitByTrack.set(alias.toLowerCase(), key));
}

export function trackMapKeyForEvent(event = {}) {
  const key = explicitByTrack.get(String(event.track || '').toLowerCase());
  if (key) return key;
  const track = String(event.track || '').toLowerCase();
  const title = String(event.title || '').toLowerCase();
  const haystack = `${track} ${title}`;
  if (haystack.includes('street')) return 'generic-street-course';
  if (haystack.includes('road course') || haystack.includes('road') || haystack.includes('circuit') || haystack.includes('raceway road')) return 'generic-road-course';
  if (haystack.includes('roval')) return 'generic-roval';
  if (haystack.includes('mile') || haystack.includes('speedway') || haystack.includes('raceway') || haystack.includes('motor')) return 'generic-oval';
  return 'generic-track';
}

export function trackMapAssetForEvent(event = {}) {
  return `/images/track-maps/${trackMapKeyForEvent(event)}.svg`;
}

export function trackMapLabelForEvent(event = {}) {
  const track = String(event.track || 'Track').trim();
  return `${track} track map`;
}
