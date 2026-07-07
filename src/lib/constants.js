export const WHITELIST = ['bhnsadhu@gmail.com', 'sadhubhanu07@gmail.com']

export const MIN_PHOTOS = 5

export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad student']

// stored lowercase as matching codes (gendersCompatible); capitalize at render
export const GENDERS = ['girl', 'guy', 'nonbinary']

export const MOVE_IN = ['Fall 2026', 'Spring 2027', 'Fall 2027']

// First letter up, nothing else touched - for rendering stored codes
export function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

// Case-only canonicalization: older rows stored these display strings in
// lowercase; map them onto the cased list entries so chips still match.
export function canonOne(list, value) {
  if (!value) return value
  return list.find((x) => x.toLowerCase() === String(value).toLowerCase()) || value
}

export function canonList(list, values) {
  if (!values) return values
  return values.map((v) => canonOne(list, v))
}

export const UIUC_MAJORS = [
  'Accountancy', 'Actuarial Science', 'Advertising', 'Aerospace Engineering',
  'African American Studies', 'Agricultural and Biological Engineering',
  'Agricultural and Consumer Economics',
  'Agricultural Leadership Education and Communications', 'Agronomy',
  'Animal Sciences', 'Anthropology', 'Architectural Studies', 'Art History',
  'Asian American Studies', 'Astronomy', 'Astrophysics', 'Atmospheric Sciences',
  'Biochemistry', 'Bioengineering', 'Brain and Cognitive Science', 'Business',
  'Chemical Engineering', 'Chemistry', 'Civil Engineering', 'Classics',
  'Communication', 'Community Health', 'Comparative and World Literature',
  'Computer Engineering', 'Computer Science', 'Computer Science and Advertising',
  'Computer Science and Economics', 'Computer Science and Astronomy',
  'Computer Science and Bioengineering', 'Computer Science and Chemistry',
  'Computer Science and Music', 'Computer Science and Physics',
  'Computer Science and Philosophy', 'Creative Writing', 'Crop Sciences', 'Dance',
  'Dietetics and Nutrition', 'Early Childhood Education',
  'Earth Society and Environmental Sustainability',
  'East Asian Languages and Cultures',
  'Econometrics and Quantitative Economics', 'Economics',
  'Electrical Engineering', 'Elementary Education', 'Engineering Mechanics',
  'Engineering Technology and Management', 'English', 'Environmental Engineering',
  'Environmental Sustainability', 'Finance', 'Food Science', 'French',
  "Gender and Women's Studies",
  'Geography and Geographic Information Science', 'Geology', 'Germanic Studies',
  'Global Studies', 'Graphic Design', 'History', 'Hospitality Management',
  'Human Development and Family Studies', 'Industrial Design',
  'Industrial Engineering', 'Information Sciences', 'Information Systems',
  'Innovation Leadership and Engineering Entrepreneurship',
  'Integrative Biology', 'Interdisciplinary Health Sciences', 'Italian',
  'Jazz Performance', 'Journalism', 'Kinesiology', 'Landscape Architecture',
  'Latin American Studies', 'Latina and Latino Studies',
  'Learning and Education Studies', 'Liberal Studies', 'Linguistics',
  'Management', 'Marketing', 'Materials Science and Engineering', 'Mathematics',
  'Mathematics and Computer Science', 'Mechanical Engineering', 'Media',
  'Media and Cinema Studies', 'Middle Grades Education',
  'Molecular and Cellular Biology', 'Music', 'Music Composition',
  'Music Education', 'Music Technology',
  'Natural Resources and Environmental Sciences', 'Neural Engineering',
  'Neuroscience', 'Nuclear Plasma and Radiological Engineering',
  'Nutrition and Health', 'Operations Management', 'Philosophy', 'Physics',
  'Plant Biotechnology', 'Political Science', 'Portuguese', 'Psychology',
  'Public Health', 'Recreation Sport and Tourism', 'Religion',
  'Russian East European and Eurasian Studies', 'Secondary Education',
  'Social Work', 'Sociology', 'Spanish', 'Special Education',
  'Speech and Hearing Science', 'Sports Media', 'Statistics',
  'Strategy Innovation and Entrepreneurship', 'Studio Art',
  'Supply Chain Management',
  'Sustainability in Food and Environmental Systems', 'Sustainable Design',
  'Systems Engineering and Design', 'Theatre', 'Urban Studies and Planning', 'Voice',
]

export const DORMS = [
  'Allen Hall',
  'Barton Hall',
  'Bousfield Hall',
  'Busey Evans Hall',
  'Carr Hall',
  'Hopkins Hall',
  'Illinois Street (ISR)',
  'Lincoln Avenue (LAR)',
  'Nugent Hall',
  'Oglesby Hall',
  'Pennsylvania Avenue (PAR)',
  'Scott Hall',
  'Snyder Hall',
  'Taft Van Doren',
  'Trelease Hall',
  'Wassaja Hall',
  'Weston Hall',
  'Daniels Hall (Grad)',
  'Sherman Hall (Grad)',
  'Bromley Hall',
  'Hendrick House',
  'Illini Tower',
  'Newman Hall',
  'Armory House',
]

export const AREAS = [
  'Campustown',
  'Green Street',
  'West Campustown',
  'Downtown Champaign',
  'Midtown Champaign',
  'Downtown Urbana',
  'West Urbana',
  'East Urbana',
  'South Campus · Research Park',
  'Orchard Downs',
  'North Champaign',
  'West Champaign',
  'Southwest Champaign',
  'East Champaign',
  'Savoy',
]

export const QUIZ = [
  {
    key: 'sleep',
    q: 'When do you actually sleep?',
    a: 'In bed by midnight',
    b: '3am is a lifestyle',
    shareA: 'You both sleep early',
    shareB: 'You are both night owls',
  },
  {
    key: 'tidy',
    q: 'Your side of the room is...',
    a: 'Labeled and spotless',
    b: 'Organized chaos',
    shareA: 'You are both neat freaks',
    shareB: 'You both survive the mess',
  },
  {
    key: 'noise',
    q: 'Background noise while you study?',
    a: 'Silence or nothing',
    b: 'Music always on',
    shareA: 'You both need quiet',
    shareB: 'You both live with a soundtrack',
  },
  {
    key: 'guests',
    q: 'Friends coming over?',
    a: 'Text me first',
    b: 'Door is always open',
    shareA: 'You both like a heads up',
    shareB: 'You both run an open door',
  },
  {
    key: 'weekend',
    q: 'Friday night looks like...',
    a: 'In by ten, phone off',
    b: 'Green Street till late',
    shareA: 'You both stay in',
    shareB: 'You both go out',
  },
  {
    key: 'temp',
    q: 'Thermostat wars?',
    a: 'Keep it cold',
    b: 'Keep it cozy',
    shareA: 'You both run cold',
    shareB: 'You both run warm',
  },
  {
    key: 'kitchen',
    q: 'Dinner most nights?',
    a: 'I cook',
    b: 'I order',
    shareA: 'You both cook',
    shareB: 'You both order in',
  },
  {
    key: 'sharing',
    q: 'Your snacks?',
    a: 'Ask first',
    b: "What's mine is yours",
    shareA: 'You both respect the shelf',
    shareB: 'You both share everything',
  },
  {
    key: 'conflict',
    q: 'When something bugs you?',
    a: 'Say it same day',
    b: 'Cool off first',
    shareA: 'You both talk it out fast',
    shareB: 'You both take space first',
  },
  {
    key: 'alarm',
    q: 'Morning alarms?',
    a: 'One and up',
    b: 'Snooze times five',
    shareA: 'You both get up fast',
    shareB: 'You both snooze hard',
  },
  {
    key: 'study',
    q: 'Grind spot?',
    a: 'My own desk',
    b: 'Grainger till 2am',
    shareA: 'You both study at home',
    shareB: 'You both live at the library',
  },
  {
    key: 'vibe',
    q: 'Ideal roommate is...',
    a: 'Built-in best friend',
    b: 'Peaceful coexistence',
    shareA: 'You both want a friend',
    shareB: 'You both want peace',
  },
]

export const DEALBREAKERS = [
  { key: 'smoke_free', label: 'Smoke-free space', conflicts: ['smoking_ok'] },
  { key: 'smoking_ok', label: 'Smoking is fine with me', conflicts: ['smoke_free', 'substance_free'] },
  { key: 'substance_free', label: 'Substance-free space', conflicts: ['four20_friendly', 'smoking_ok'] },
  { key: 'four20_friendly', label: '420 friendly', conflicts: ['substance_free'] },
  { key: 'no_pets', label: 'No pets in the space', conflicts: ['pet_home'] },
  { key: 'pet_home', label: 'I have or want a pet', conflicts: ['no_pets', 'pet_allergy'] },
  { key: 'pet_allergy', label: 'Allergic to pets', conflicts: ['pet_home'] },
  { key: 'quiet_after_midnight', label: 'Quiet after midnight', conflicts: ['night_noise_ok'] },
  { key: 'night_noise_ok', label: 'Late-night noise is fine', conflicts: ['quiet_after_midnight'] },
  { key: 'no_overnight_guests', label: 'No overnight guests', conflicts: ['guests_anytime'] },
  { key: 'guests_anytime', label: 'Overnight guests welcome', conflicts: ['no_overnight_guests'] },
  { key: 'veg_kitchen', label: 'Vegetarian kitchen', conflicts: [] },
]

export const DB_BY_KEY = Object.fromEntries(DEALBREAKERS.map((d) => [d.key, d]))

export const BIO_PLACEHOLDERS = [
  'CS major who actually does the dishes',
  'I will fight you for the window side',
  'My toxic trait is 7am lectures on purpose',
  "Looking for someone to split Papa Del's with",
  'Quiet during finals, loud during March Madness',
  'I keep the fridge stocked and the thermostat honest',
  'Green Street regular seeking grocery run partner',
  'Low-risk roommate. Quiet, clean, rent on day one',
]
