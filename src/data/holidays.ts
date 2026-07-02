export interface Holiday {
  emoji: string;
  name: string;
  category: string;
  pillCls: string;
  description: string;
  hashtags: string[];
  postIdeas: string[];
}

export interface HolidayDate {
  id: string;
  date: string;
  day: string;
  holidays: Holiday[];
}

export const VISIBLE_HOLIDAYS: HolidayDate[] = [
  { id: "day-june-28", date: "Jun 28", day: "Sun", holidays: [
      { emoji: "🏳️‍🌈", name: "Stonewall Riots Anniversary", category: "Awareness", pillCls: "bg-violet-100 text-violet-700", description: "A meaningful Pride-Month anchor for sharing LGBTQ+ history, allyship, and community support. Pairs with broader Pride content.", hashtags: ["#Stonewall", "#Pride", "#LGBTQHistory", "#Pride2026"], postIdeas: [] }
    ] },
  { id: "day-june-29", date: "Jun 29", day: "Mon", holidays: [
      { emoji: "📷", name: "National Camera Day", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Share behind-the-scenes shots, photography tips, or invite followers to post their best photo. Fits creative, travel, and lifestyle brands.", hashtags: ["#NationalCameraDay", "#Photography", "#CaptureTheMoment", "#PhotoOfTheDay"], postIdeas: [] }
    ] },
  { id: "day-june-30", date: "Jun 30", day: "Tue", holidays: [
      { emoji: "📱", name: "Social Media Day", category: "Industry", pillCls: "bg-blue-100 text-blue-700", description: "Thank your followers, share community milestones, or post behind-the-scenes of your social team. A natural meta moment.", hashtags: ["#SocialMediaDay", "#SMDay", "#SocialMedia", "#CommunityFirst"], postIdeas: [] }
    ] },
  { id: "day-july-1", date: "Jul 1", day: "Wed", holidays: [
      { emoji: "🧠", name: "BIPOC / Minority Mental Health Awareness Month", category: "Awareness", pillCls: "bg-violet-100 text-violet-700", description: "Share culturally relevant mental health resources and break stigma with empathy. Center community voices rather than positioning your brand as the expert.", hashtags: ["#MinorityMentalHealth", "#BIPOCMentalHealth", "#MentalHealthAwareness", "#MentalHealthMatters"], postIdeas: [] },
      { emoji: "🍁", name: "Canada Day", category: "Major", pillCls: "bg-rose-100 text-rose-700", description: "Celebrate Canadian customers with maple-leaf visuals or a local promo. Great for region-targeted posts.", hashtags: ["#CanadaDay", "#HappyCanadaDay", "#CanadaDay2026", "#OhCanada"], postIdeas: [] },
      { emoji: "♿", name: "Disability Pride Month", category: "Awareness", pillCls: "bg-violet-100 text-violet-700", description: "Audit your own accessibility (alt text, captions, contrast) and share what you are improving. Amplify disabled creators and voices instead of speaking over them.", hashtags: ["#DisabilityPrideMonth", "#DisabilityPride", "#Accessibility", "#Inclusion"], postIdeas: [] },
      { emoji: "🔥", name: "National Grilling Month", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Share recipes, grill setups, marinades and cookout playlists. Food, beverage and outdoor brands can run grilling challenges and user-generated cookout photos.", hashtags: ["#NationalGrillingMonth", "#GrillSeason", "#BBQ", "#Cookout"], postIdeas: [] },
      { emoji: "🍨", name: "National Ice Cream Month", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Food and lifestyle brands can theme July content around frozen treats. Plan a month-long series.", hashtags: ["#NationalIceCreamMonth", "#IceCreamMonth", "#IceCream"], postIdeas: [] },
      { emoji: "🧋", name: "National Iced Tea Month", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Post refreshing iced tea recipes and pairing ideas. Beverage and cafe brands can spotlight seasonal flavors and limited drops.", hashtags: ["#NationalIcedTeaMonth", "#IcedTea", "#SweetTea", "#SummerSips"], postIdeas: [] },
      { emoji: "🧺", name: "National Picnic Month", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Showcase picnic spreads, packable products and outdoor styling ideas. Great for food, lifestyle and homeware brands with shoppable carousels.", hashtags: ["#NationalPicnicMonth", "#PicnicSeason", "#SummerVibes", "#OutdoorDining"], postIdeas: [] },
      { emoji: "☀️", name: "UV Safety Awareness Month", category: "Awareness", pillCls: "bg-violet-100 text-violet-700", description: "Share practical sun-safety tips that fit your audience's summer activities. Beauty, outdoor and wellness brands can tie product education to genuine UV protection.", hashtags: ["#UVSafety", "#SunSafety", "#SkinCancerPrevention", "#WearSunscreen"], postIdeas: [] }
    ] },
  { id: "day-july-2", date: "Jul 2", day: "Thu", holidays: [
      { emoji: "🛸", name: "World UFO Day", category: "Fun", pillCls: "bg-cyan-100 text-cyan-700", description: "Lean into sci-fi fun with quirky polls, 'are we alone?' questions and out-of-this-world product spins. Perfect for lighthearted meme content.", hashtags: ["#WorldUFODay", "#UFO", "#OutThere", "#TheTruthIsOutThere"], postIdeas: [] }
    ] },
  { id: "day-july-4", date: "Jul 4", day: "Sat", holidays: [
      { emoji: "🎆", name: "America's 250th Anniversary (Semiquincentennial)", category: "Major", pillCls: "bg-rose-100 text-rose-700", description: "Tie campaigns to the once-in-a-lifetime 250th milestone with American-made stories, history nods and community celebration. Go bigger than a standard July 4 post.", hashtags: ["#America250", "#Semiquincentennial", "#USA250", "#Independence250"], postIdeas: ["250 years in the making. Wishing everyone a happy and historic Fourth of July as America marks its Semiquincentennial.", "A quarter of a millennium of independence. Here is to America's 250th. #America250"] },
      { emoji: "🎆", name: "Independence Day (US)", category: "Major", pillCls: "bg-rose-100 text-rose-700", description: "Run a holiday sale or share festive content. Keep it celebratory; many users are offline, so schedule early.", hashtags: ["#FourthOfJuly", "#IndependenceDay", "#July4th", "#HappyFourth", "#RedWhiteAndBlue"], postIdeas: ["Happy 4th! Fireworks, freedom, and a little flash sale to match. Tap to shop before the cookout. 🎆", "Red, white, and you. Wishing everyone a safe and happy Independence Day from our team to yours."] }
    ] }
];
