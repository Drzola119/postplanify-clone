export type UseCase = {
  title: string;
  slug: string;
  description: string;
};

export type Category = {
  id: string;
  title: string;
  subtitle: string;
  cases: UseCase[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const c = (title: string, description: string): UseCase => ({
  title,
  slug: slugify(title),
  description,
});

export const CATEGORIES: Category[] = [
  {
    id: "business-types",
    title: "Business Types",
    subtitle: "From startups to enterprises, find the right social media workflow for your business",
    cases: [
      c("Small Businesses", "Plan, schedule and publish social media posts across every platform from one dashboard. Affordable social media management for small business owners."),
      c("Startups", "Build brand awareness and grow your audience on a startup budget. The flat-rate social media scheduler built for fast-moving startup teams."),
      c("Enterprises", "Enterprise social media management with multi-brand workspaces, approval workflows, unlimited team members and flat pricing. Govern, collaborate and publish across 10 platforms from one dashboard."),
      c("Franchises", "Manage social media across every franchise location from one platform. Centralized content approval, location-specific posting and unlimited team members with flat pricing."),
      c("SaaS Companies", "Schedule product updates, feature announcements and thought leadership across every platform. The flat-rate social media scheduler built for SaaS teams."),
      c("D2C Brands", "Schedule product launches, UGC, influencer content and seasonal campaigns across Instagram, TikTok, Pinterest and more. Built for direct-to-consumer brands selling online."),
      c("E-Commerce Brands", "Manage social media for your online store from one dashboard. Schedule product launches, promotions, UGC and seasonal campaigns across Instagram, TikTok, Pinterest and more."),
      c("Subscription Businesses", "Reduce churn and grow subscribers with scheduled social media content. Unboxing campaigns, retention content, renewal reminders and community building — all from one dashboard."),
      c("Multi-Location Businesses", "Manage social media for every location from one platform. Separate workspaces per location, centralized brand control, local content customization and unlimited team members across your entire organization."),
      c("Multi-Brand Businesses", "Manage social media for multiple brands from one platform. Separate workspaces, distinct brand voices, centralized oversight and approval workflows — with flat pricing across all brands."),
      c("B2B Companies", "Schedule and manage B2B social media content across LinkedIn and every major platform. Thought leadership scheduling, team approval workflows and lead generation content planning — all from one dashboard."),
      c("AI Companies", "Schedule thought leadership, product demos and developer content across every platform. The flat-rate social media scheduler for AI companies."),
      c("Fintech Companies", "Schedule product announcements, financial literacy content and trust-building posts across every platform. Built for fintech teams."),
      c("Marketplace Businesses", "Grow both sides of your marketplace with scheduled seller recruitment and buyer engagement posts. Built for platform businesses."),
      c("Mobile App Companies", "Schedule app install campaigns, feature updates and user spotlight content across every platform. Built for mobile app companies."),
      c("Seasonal Businesses", "Social media management for seasonal businesses. Schedule campaigns months ahead, maximize peak seasons and keep your audience engaged year-round."),
    ],
  },
  {
    id: "creators-individuals",
    title: "Creators & Individuals",
    subtitle: "Solo creators, freelancers, and personal brands building an audience",
    cases: [
      c("Content Creators", "Schedule posts, reels and shorts across every platform from one dashboard. Built for content creators who batch-create and stay consistent."),
      c("Freelancers", "Schedule social media posts across every platform from one dashboard. Built for freelancers who need to market themselves between client work."),
      c("Solopreneurs", "Schedule posts, generate AI captions and manage every platform from one dashboard. Built for solopreneurs who run their business, not their feed."),
      c("Personal Brands", "Grow your personal brand with scheduled content across LinkedIn, X, Instagram and more. Built for speakers, coaches, authors and experts."),
      c("Influencers", "Schedule sponsored posts and brand collaborations across every platform from one dashboard. Built for influencers who need multi-platform consistency."),
      c("Side Hustlers", "Build your side hustle on social media without quitting your day job. Batch-schedule posts on weekends, generate captions with AI and stay consistent with minimal time — all at flat, affordable pricing."),
      c("Bloggers", "Drive blog traffic with scheduled social media posts. Promote new articles, reshare evergreen content and repurpose blog posts into social formats — all from one dashboard."),
      c("Video Creators", "Cross-post videos to TikTok, Instagram Reels, YouTube Shorts, Facebook and more from one dashboard. Built for video creators who repurpose content across every platform."),
      c("Artists", "Showcase your art on social media without losing creative time. Schedule portfolio posts, process videos and commission promotions across Instagram, Pinterest, TikTok and more — all from one dashboard."),
      c("Musicians", "Promote your music on social media without losing creative time. Schedule release announcements, tour promotions and fan engagement content across TikTok, Instagram, YouTube and more — all from one dashboard."),
      c("Speakers", "Build your speaking brand on social media. Schedule keynote clips, promote upcoming talks and share thought leadership across LinkedIn, Instagram, TikTok and more — without spending hours posting every day."),
      c("Authors", "Promote your books and build your readership with scheduled social media posts. Plan book launches, share excerpts and grow your author platform across every channel."),
      c("Photographers", "Schedule portfolio posts, behind-the-scenes content and client features across Instagram, Pinterest, TikTok and more. Built for photographers who would rather be shooting than posting."),
      c("Thought Leaders & Executives", "Schedule LinkedIn thought leadership, keynote clips and industry commentary across every platform. Built for executives and experts."),
    ],
  },
  {
    id: "niche-creators",
    title: "Niche Creators",
    subtitle: "Content creators in specific niches and verticals",
    cases: [
      c("Food Bloggers", "Schedule recipe posts, food photography and cooking content across every platform from one dashboard. Built for food bloggers who spend hours in the kitchen and need their content to work just as hard."),
      c("Travel Bloggers", "Schedule travel content from anywhere in the world. Batch-plan destination posts, trip itineraries and cross-platform promotions before you leave — so your feed stays active while you explore."),
      c("Podcasters", "Schedule audiograms, episode promos and clips across every platform from one dashboard. Built for podcasters who want more listeners without more busywork."),
      c("Gaming Streamers", "Schedule stream highlights and gaming clips across TikTok, YouTube and Instagram from one dashboard. Grow your audience between streams."),
      c("Fashion Influencers", "Schedule OOTDs, try-on hauls and lookbooks across every platform from one dashboard. Grow your fashion influencer brand effortlessly."),
      c("Parenting Creators", "Schedule family vlogs, milestone posts and parenting tips across every platform from one dashboard. Grow your parenting brand with ease."),
      c("Tech Reviewers", "Schedule tech unboxings, reviews and comparison videos across every platform from one dashboard. Grow your tech review channel faster."),
      c("DIY & Craft Creators", "Schedule craft tutorials, project walkthroughs and maker content across every platform from one dashboard. Grow your DIY audience faster."),
      c("Home Decor Creators", "Schedule room tours, seasonal decor and before-and-after reveals across every platform. Grow your home decor audience effortlessly."),
      c("Bookstagrammers", "Schedule book reviews, shelfie posts and reading challenge content across every platform. Grow your bookstagram audience effortlessly."),
      c("Pet Influencers", "Schedule cute pet videos, brand collabs and daily updates across every platform. Grow your pet influencer account effortlessly."),
      c("Comedy Creators", "Schedule sketches, meme content and skit series across every platform from one dashboard. Keep your comedy audience laughing daily."),
      c("Spiritual Practitioners", "Schedule astrology, tarot and manifestation content across every platform from one dashboard. Grow your spiritual community with ease."),
    ],
  },
  {
    id: "teams-roles",
    title: "Teams & Roles",
    subtitle: "Marketing teams, social media managers, and collaborative workflows",
    cases: [
      c("Marketing Teams", "Plan and schedule social media content as a team. Shared calendar, draft approvals and unlimited team members with no per-seat pricing."),
      c("Social Media Managers", "The scheduling and management tool built for professional social media managers. Multi-account management, bulk scheduling, AI captions, approval workflows and analytics — all at a flat price."),
      c("Content Teams", "Plan, approve and publish social content as a team. Editorial calendar, approval workflows, cross-platform scheduling and AI captions — built for dedicated content teams."),
      c("Community Managers", "Schedule engagement-driven content, coordinate community campaigns and manage cross-platform presence — all from one dashboard. Built for community managers who build loyal audiences."),
      c("Remote Teams", "Coordinate social media across time zones with async approvals, a shared visual calendar and no per-seat pricing. Built for distributed and remote teams."),
      c("Virtual Assistants", "Manage social media for multiple clients from one dashboard. Multi-workspace scheduling, bulk posting, AI captions and flat pricing — built for virtual assistants who handle many accounts."),
      c("Recruiters", "Attract top talent and build your employer brand with consistent social media content. Schedule job postings, team culture showcases and recruitment campaigns across LinkedIn and every major platform — all from one dashboard."),
      c("PR Professionals", "Amplify press coverage, manage brand reputation and coordinate crisis communications across every social platform. Built for PR professionals who need speed, approval workflows and multi-client control."),
      c("Brand Managers", "Plan campaigns, coordinate approvals and schedule content across every platform. Built for brand managers who need consistency, control and cross-team collaboration."),
    ],
  },
  {
    id: "agencies-consulting",
    title: "Agencies & Consulting",
    subtitle: "Agencies managing multiple clients and consulting professionals",
    cases: [
      c("Agencies", "Manage every client account from one dashboard. Multi-workspace scheduling, team approvals and flat pricing with unlimited team members — built for agencies that scale."),
      c("Digital Marketing Agencies", "Run social, ads and content for every client from one dashboard. Multi-workspace scheduling, AI captions for different brand voices and flat pricing with unlimited team members — built for full-service digital marketing agencies."),
      c("Coaches", "Build your coaching brand on social media. Schedule thought leadership content, promote programs and share client success stories across Instagram, LinkedIn, TikTok and more — without spending hours posting every day."),
      c("Consultants", "Build your professional brand and generate leads with consistent LinkedIn and social media content. Schedule thought leadership posts, share industry expertise and attract clients — all from one dashboard."),
      c("Course Creators", "Schedule course launches, share student testimonials and promote your online courses across social media. Visual calendar, AI captions and cross-platform scheduling — built for course creators."),
      c("Affiliate Marketers", "Schedule affiliate promotions, product reviews and comparison content across every social platform. Balance value-driven posts with promotional content and track what converts — all from one dashboard."),
    ],
  },
  {
    id: "industry-professionals",
    title: "Industry Professionals",
    subtitle: "Professionals in specific fields managing their social presence",
    cases: [
      c("Healthcare Professionals", "Build trust and attract patients with scheduled social media content. Patient education, health awareness campaigns, appointment promotions and professional networking — all from one dashboard."),
      c("Financial Advisors", "Build trust and attract clients with compliant, scheduled social media content. Market commentary, financial education, retirement planning tips and client success stories — all from one dashboard with approval workflows."),
      c("Lawyers", "Build authority, attract clients and stay ethically compliant with scheduled social media content. Educational legal posts, thought leadership, firm branding and client engagement — all from one dashboard."),
      c("Therapists", "Grow your therapy practice with scheduled psychoeducation content. Mental health tips, coping strategies, boundary education and referral-building visibility — all privacy-conscious and from one dashboard."),
      c("Dentists", "Attract new patients and build trust with scheduled dental content. Smile transformations, patient education, team spotlights and appointment promotions — all from one dashboard."),
      c("Insurance Agents", "Build trust and generate leads with scheduled insurance content. Policy tips, claim guidance, seasonal campaigns and client testimonials — all from one dashboard."),
      c("Chiropractors", "Attract new patients and build trust with scheduled chiropractic content. Adjustment videos, wellness tips, patient testimonials and educational posts — all from one dashboard."),
      c("Real Estate Teams", "Manage your real estate team's social media from one dashboard. Schedule listing promotions, local market content and agent spotlights across Instagram, Facebook, TikTok and more — with approval workflows that keep your team brand consistent."),
      c("Wedding Planners", "Showcase real weddings, tag vendors and book more couples with scheduled social media content across Instagram, Pinterest, TikTok and more. Built for wedding planners who are too busy planning to post."),
      c("Interior Designers", "Showcase stunning interior design projects and attract dream clients on social media. Schedule room reveals, mood boards and before-and-after transformations across Instagram, Pinterest and more."),
      c("Graphic Designers", "Showcase your design portfolio and attract clients on social media without burning out. Schedule portfolio posts, process videos and client work showcases across Instagram, Pinterest, Dribbble and more — all from one dashboard."),
      c("Fitness Influencers", "Schedule workout videos, transformation posts and fitness content across every platform from one dashboard. Built for fitness influencers who train hard and post harder."),
      c("Pet Businesses", "Schedule and publish adorable pet content across every platform. Social media management built for groomers, dog trainers, pet stores and veterinary clinics."),
      c("Dropshippers", "Promote winning products and scale your dropshipping store with scheduled social content. Plan product launches, viral videos and flash sales across TikTok, Instagram, Pinterest and more — all from one dashboard."),
      c("Developers", "Schedule dev content, build in public and grow your developer brand across X, LinkedIn, GitHub and more. Built for software engineers and dev advocates."),
    ],
  },
  {
    id: "organizations-institutions",
    title: "Organizations & Institutions",
    subtitle: "Nonprofits, educational institutions, sports clubs, and public organizations",
    cases: [
      c("Nonprofit Organizations", "Amplify your nonprofit's mission on social media. Schedule fundraising campaigns, volunteer recruitment, donor engagement and awareness content across Instagram, Facebook, LinkedIn and more — with flat pricing that respects limited budgets."),
      c("Churches", "Reach your congregation and community through social media. Schedule sermon clips, event promotions, devotionals and outreach content across all platforms — with flat pricing for every ministry."),
      c("Event Organizers", "Promote your events on social media with coordinated campaigns. Schedule countdown content, speaker lineups, ticket promotions and post-event recaps across Instagram, Facebook, TikTok and more — all from one dashboard."),
      c("Educators", "Schedule educational content, promote courses and build your personal brand as an educator. Visual calendar, AI captions and cross-platform scheduling — built for teachers and course creators."),
      c("Student Organizations", "Schedule campus event promotions, recruit new members and manage your student organization's social media from one dashboard. Visual calendar, AI captions and cross-platform posting."),
      c("Universities & Colleges", "Schedule admissions campaigns, campus life and alumni content across every platform. Built for university teams who need flat-rate collaboration."),
      c("Sports Teams & Clubs", "Schedule game day content, player spotlights and fan engagement posts across every platform. Built for sports teams who want flat-rate pricing."),
      c("Political Campaigns", "Schedule voter outreach, rally promotions and fundraising posts across every platform. The social media tool for political campaigns."),
      c("Music Labels & Distributors", "Manage social media for your entire artist roster from one dashboard. Schedule release campaigns and promotions for music labels."),
      c("Media & Publishers", "Schedule article promotions, breaking news and newsletter content across every platform. The flat-rate scheduler for media and publishers."),
    ],
  },
  {
    id: "goals-objectives",
    title: "Goals & Objectives",
    subtitle: "Social media strategies organized by what you want to achieve",
    cases: [
      c("Lead Generation", "Schedule lead-generating content across LinkedIn and every major platform. Build funnels, promote lead magnets and track conversions from one dashboard."),
      c("Brand Awareness", "Schedule reach-optimized social content across every platform to grow brand awareness. Plan shareable posts, track impressions and build your audience."),
      c("Product Launches", "Coordinate product launch campaigns across every social platform. Schedule teasers, countdowns and launch-day content from one organized dashboard."),
      c("Event Promotion", "Promote events, conferences and webinars across every social platform. Schedule pre-event hype, live coverage and post-event recaps from one dashboard."),
      c("Employer Branding", "Schedule employer brand content across LinkedIn and every platform. Plan culture posts, employee spotlights and job campaigns — all from one dashboard."),
      c("Social Selling", "Social media management for social selling. Schedule relationship-building content, warm up prospects and close more deals from one simple dashboard."),
      c("Local Marketing", "Social media management for local marketing. Schedule hyperlocal posts, promote local events and drive foot traffic from one simple dashboard."),
      c("Community Building", "Social media management for community building. Schedule member spotlights, conversation starters and UGC campaigns from one organized dashboard."),
      c("Customer Retention", "Social media management for customer retention. Schedule loyalty content, re-engagement campaigns and appreciation posts from one organized dashboard."),
      c("App Marketing", "Social media management for app marketing. Schedule install campaigns, feature announcements and user engagement posts from one organized dashboard."),
    ],
  },
  {
    id: "workflows-situations",
    title: "Workflows & Situations",
    subtitle: "Solutions for specific social media management challenges and workflows",
    cases: [
      c("Multiple Accounts", "Manage multiple social media accounts from one dashboard. Schedule posts, switch profiles instantly and keep every brand organized."),
      c("Beginners", "Social media management for beginners made simple. Build your first content calendar, schedule posts and grow your online presence with ease."),
      c("Content Repurposing", "Repurpose blogs, podcasts and videos into platform-specific social media posts. Schedule repurposed content across every channel from one place."),
      c("New Business Launches", "Plan your new business launch on social media. Schedule pre-launch content, run countdown campaigns and build an audience before day one."),
      c("International Brands", "Social media management for international brands. Schedule across time zones, localize content by region and maintain global brand consistency."),
      c("Regulated Industries", "Social media management for regulated industries. Approval workflows, audit trails and pre-approved content libraries built for compliance."),
      c("High-Volume Posting", "Built for high-volume posting across platforms. Bulk schedule, manage content queues and organize media libraries to scale your output."),
      c("Crowdfunding Campaigns", "Schedule social media for crowdfunding campaigns on Kickstarter, Indiegogo and GoFundMe. Plan every post from pre-launch to final stretch."),
      c("Employee Advocacy", "Launch an employee advocacy program with pre-approved content libraries and easy sharing workflows. Amplify your brand through your team."),
    ],
  },
  {
    id: "sellers-e-commerce",
    title: "Sellers & E-Commerce",
    subtitle: "Online sellers and e-commerce operators growing through social",
    cases: [
      c("E-commerce Store Owners", "Schedule product launches, flash sales and promotions across every platform. Built for online store owners who manage inventory, shipping and marketing all at once."),
      c("Etsy Sellers", "Schedule product showcases, process videos and shop updates across Pinterest, Instagram and TikTok. Built for Etsy sellers who'd rather be making than marketing."),
      c("Amazon Sellers", "Schedule product content, customer reviews and promotional posts across every platform. Built for Amazon sellers who need external traffic to boost rankings and build a brand."),
      c("Digital Product Sellers", "Schedule product launches, share customer reviews and promote Notion templates, Canva templates, ebooks and digital downloads across social media. Visual calendar, AI captions and cross-platform scheduling — built for digital product sellers."),
      c("Airbnb Hosts", "Schedule property showcases, guest testimonials and local guides across every platform. Built for Airbnb hosts and vacation rental owners who want direct bookings."),
    ],
  },
  {
    id: "social-media-specialists",
    title: "Social Media Specialists",
    subtitle: "Freelancers and creators specializing in social media services",
    cases: [
      c("Social Media Freelancers", "Manage multiple client accounts, schedule content in bulk, get approvals and deliver reports — all from one dashboard with flat pricing. Built for freelance social media managers."),
      c("UGC Creators", "Schedule portfolio content, behind-the-scenes clips and personal brand posts while you focus on client deliverables. Built for UGC creators who juggle their own brand and brand partnerships."),
      c("Micro-Influencers", "Schedule content across Instagram, TikTok, YouTube and more from one dashboard. Built for micro-influencers with 10K-100K followers who need consistency, content planning and brand deal management to grow."),
      c("Newsletter Writers & Creators", "Grow your newsletter subscriber list with scheduled social media posts. Promote each issue, repurpose newsletter content for social and build a cross-platform presence — all from one dashboard."),
      c("YouTube Creators", "Promote YouTube videos across social media, schedule Shorts cross-posts, share thumbnails and grow subscribers with cross-platform content. Visual calendar, AI captions and multi-platform scheduling — built for YouTubers."),
      c("TikTok Creators", "Repurpose TikToks to Instagram Reels, YouTube Shorts and more. Schedule cross-platform content, manage posting consistency and grow beyond TikTok — all from one dashboard built for TikTok-first creators."),
    ],
  },
];
