// terms.ts — 391 social media terms organized A-Z, extracted from production.
// Each entry: { term, desc }. Order within each letter matches production glossary ordering.

export type TermEntry = { term: string; desc: string };

export const TERMS_BY_LETTER: Record<string, TermEntry[]> = {
  "A": [
    {
      "term": "A/B Testing",
      "desc": "A method of comparing two versions of a marketing asset to determine which performs better, enabling data-driven optimization decisions"
    },
    {
      "term": "Ad Fatigue",
      "desc": "The decline in audience engagement that occurs when users are repeatedly exposed to the same advertisement, resulting in lower click-through rates, increased cost per action, and diminishing returns on ad spend"
    },
    {
      "term": "Ad Set",
      "desc": "A group within a social media advertising campaign that defines the target audience, budget, schedule, and placement for a collection of advertisements on platforms like Facebook, Instagram, and LinkedIn"
    },
    {
      "term": "Affiliate Marketing",
      "desc": "A performance-based strategy where businesses reward promoters for driving traffic or sales through their marketing efforts"
    },
    {
      "term": "AI-Powered Content Curation",
      "desc": "Use of artificial intelligence algorithms to automatically discover, filter, organize, and share relevant digital content for specific audiences at scale"
    },
    {
      "term": "Algorithm",
      "desc": "The set of rules and calculations social media platforms use to determine which content to display to each user, based on factors like engagement history, content relevance, relationship signals, and recency"
    },
    {
      "term": "Alt Text",
      "desc": "A written description of an image that appears when the image cannot be displayed or is read by screen readers, making content accessible"
    },
    {
      "term": "AMA (Ask Me Anything)",
      "desc": "An interactive interview format where individuals or organizations invite audiences to ask questions on any topic, creating authentic engagement opportunities"
    },
    {
      "term": "Analytics",
      "desc": "The feature that provides detailed insights into content performance, audience engagement, and social media metrics"
    },
    {
      "term": "Approval Workflow",
      "desc": "Organized sequence where content undergoes review and approval by designated stakeholders before publication, ensuring quality control and maintaining brand consistency"
    },
    {
      "term": "Aspect Ratio",
      "desc": "The proportional relationship between the width and height of visual content, critical for ensuring images and videos display correctly across different social media platforms such as 1:1 for Instagram posts, 9:16 for Stories, and 16:9 for YouTube"
    },
    {
      "term": "ATP (At This Point)",
      "desc": "Stands for \"At This Point\" in texting and social media, used to reference the current situation or moment after a series of events"
    },
    {
      "term": "Attribution Model",
      "desc": "A framework that determines how credit for conversions is assigned to different marketing touchpoints in the customer journey, helping marketers understand which social media channels and campaigns drive the most results"
    },
    {
      "term": "Audience Growth Rate",
      "desc": "A metric that measures the speed at which a social media account gains new followers over a specific period, indicating brand momentum and content effectiveness"
    },
    {
      "term": "Audience Insights",
      "desc": "Data-driven analytics that reveal detailed information about social media followers, website visitors, and customers, including demographics and preferences"
    },
    {
      "term": "Audience Segmentation",
      "desc": "The practice of dividing a social media audience into distinct groups based on shared characteristics like demographics, behavior, interests, or engagement patterns for more targeted and effective messaging"
    },
    {
      "term": "Automated Posting",
      "desc": "A process of scheduling social media content to be published automatically at predetermined times, ensuring consistent posting schedules"
    },
    {
      "term": "Automation",
      "desc": "The use of technology to perform repetitive marketing tasks, streamline workflows, and execute actions with minimal manual intervention to improve efficiency"
    },
    {
      "term": "Avatar",
      "desc": "A digital image or graphical representation used to identify a user or brand on social media platforms, serving as the visual identity in comments, messages, and profile displays"
    }
  ],
  "B": [
    {
      "term": "B2B (Business-to-Business)",
      "desc": "A business model where companies sell products, services, or solutions directly to other businesses rather than individual consumers"
    },
    {
      "term": "B2C (Business-to-Customer)",
      "desc": "Business transactions and relationships where companies sell products or services directly to individual end consumers"
    },
    {
      "term": "Banger",
      "desc": "A slang term describing exceptionally high-quality, exciting content that captivates audiences across music, social media, and pop culture"
    },
    {
      "term": "Batch Scheduling",
      "desc": "Process of scheduling multiple pieces of content at once, enabling efficiency and consistency in content delivery"
    },
    {
      "term": "BeReal",
      "desc": "A photo-sharing app that sends daily notifications at random times, giving users 2 minutes to capture and share unfiltered moments of their lives"
    },
    {
      "term": "BFR (Be For Real)",
      "desc": "A social media acronym used to express skepticism or disbelief, often used when questioning someone's honesty or seriousness"
    },
    {
      "term": "Bio (Biography)",
      "desc": "A concise digital description on social media profiles or websites that introduces an individual, brand, or business"
    },
    {
      "term": "Blue Checkmark",
      "desc": "A verification symbol displayed next to social media account names that confirms the authenticity of notable profiles"
    },
    {
      "term": "BookTok",
      "desc": "A vibrant TikTok subcommunity where book lovers create and share content about their favorite reads, driving sales and creating bestsellers"
    },
    {
      "term": "Boosted Post",
      "desc": "A regular social media post that is promoted with paid advertising budget to increase its reach beyond organic followers, available on platforms like Facebook, Instagram, and LinkedIn"
    },
    {
      "term": "Brand Advocate",
      "desc": "A loyal customer, employee, or industry expert who voluntarily promotes and recommends a brand based on genuine enthusiasm and positive experiences"
    },
    {
      "term": "Brand Ambassador",
      "desc": "A trusted individual who authentically represents and promotes a brand's products, services, and values to their engaged audience"
    },
    {
      "term": "Brand Awareness",
      "desc": "The extent to which consumers recognize and recall a brand, measured through metrics like reach, impressions, mentions, and share of voice across social media platforms"
    },
    {
      "term": "Brand Identity",
      "desc": "The collection of visual, verbal, and emotional elements that define how a brand presents itself on social media, including logos, color schemes, tone of voice, and messaging style"
    },
    {
      "term": "Brand Monitoring",
      "desc": "The process of tracking, analyzing, and managing online mentions and conversations about your brand, products, and services across various digital platforms"
    },
    {
      "term": "Brand Voice",
      "desc": "The consistent personality and tone a brand uses across all social media communications, reflecting its values, culture, and target audience expectations"
    },
    {
      "term": "Broadcast Channel",
      "desc": "A one-to-many messaging feature on platforms like Instagram and Telegram that allows creators and brands to send updates, polls, and content directly to subscribers"
    },
    {
      "term": "BTS (Behind The Scenes)",
      "desc": "Content that shows the authentic, unfiltered process behind creating final products, building transparency and connection with audiences"
    },
    {
      "term": "Bulk Upload",
      "desc": "A feature that allows users to simultaneously upload and schedule multiple pieces of content across various social media platforms"
    },
    {
      "term": "Business Manager",
      "desc": "A centralized administrative platform, such as Meta Business Suite, that allows organizations to manage multiple social media pages, ad accounts, and team permissions from a single dashboard"
    },
    {
      "term": "Buyer Persona",
      "desc": "A detailed, semi-fictional representation of your ideal customer based on market research, real data, and insights about your existing customers"
    }
  ],
  "C": [
    {
      "term": "CAC (Customer Acquisition Cost)",
      "desc": "A metric that measures the total cost required to acquire a new customer, including marketing, sales, and overhead expenses"
    },
    {
      "term": "Calendar View",
      "desc": "A visual scheduling interface that displays social media content in various layouts to help plan, organize, and preview posts across multiple platforms"
    },
    {
      "term": "Cap",
      "desc": "A modern slang term meaning a lie or false statement, often used in the phrase \"no cap\" to emphasize truthfulness"
    },
    {
      "term": "CapCut",
      "desc": "An AI-powered video and image editing platform known for its user-friendly interface and viral social media templates"
    },
    {
      "term": "Caption",
      "desc": "Descriptive text that accompanies visual content to provide context, engage audiences, and drive action on social media platforms"
    },
    {
      "term": "Caught in 4K",
      "desc": "Being exposed with undeniable evidence, often humorously, through high-resolution images or videos"
    },
    {
      "term": "CFBR (Comment for Better Reach)",
      "desc": "A social media engagement strategy where users leave comments on posts to increase their visibility in platform algorithms"
    },
    {
      "term": "Chatbot",
      "desc": "An AI-powered software application that simulates human conversation via text or voice to automate customer service and engagement"
    },
    {
      "term": "Cheugy",
      "desc": "Outdated trends, styles, or behaviors that were once popular but are now considered dated or out of touch"
    },
    {
      "term": "Chronically Online",
      "desc": "A state of excessive internet dependency where someone's daily life and behavior are heavily influenced by constant social media engagement"
    },
    {
      "term": "Clapback",
      "desc": "A sharp, witty response to criticism often used to shut down negativity with humor and confidence"
    },
    {
      "term": "Clickbait",
      "desc": "Sensationalized or misleading headlines and thumbnails designed to entice users to click on content, often resulting in disappointment when the content does not deliver on the promise"
    },
    {
      "term": "Clout",
      "desc": "Social influence, credibility, and online recognition often linked to engagement and digital popularity"
    },
    {
      "term": "Collaboration Post",
      "desc": "A co-authored social media post shared between two or more accounts, appearing on all collaborators' profiles simultaneously and combining engagement metrics from both audiences"
    },
    {
      "term": "Comment Moderation",
      "desc": "The process of reviewing, filtering, and managing user comments on social media posts to maintain a positive community environment, remove spam, and address harmful content"
    },
    {
      "term": "Community Manager",
      "desc": "Individuals responsible for building and nurturing relationships between a brand and its audience to foster engagement, trust, and loyalty"
    },
    {
      "term": "Content Calendar",
      "desc": "A strategic planning tool that organizes and schedules content publication across multiple platforms to streamline the content workflow"
    },
    {
      "term": "Content Creator",
      "desc": "A person who produces engaging digital content for social media to inform, entertain, or inspire an audience"
    },
    {
      "term": "Content Curation",
      "desc": "Strategic process of discovering, organizing, and sharing valuable content with unique insights for your target audience"
    },
    {
      "term": "Content Pillars",
      "desc": "The core themes or topics that define a brand's social media strategy, providing a consistent framework for content creation that aligns with brand values and audience interests"
    },
    {
      "term": "Content Repurposing",
      "desc": "Strategic transformation of existing content into different formats and channels to maximize engagement across multiple platforms"
    },
    {
      "term": "Content Strategy",
      "desc": "A comprehensive plan for creating, publishing, and managing social media content that aligns with business goals, audience needs, and platform-specific best practices"
    },
    {
      "term": "Conversion Rate",
      "desc": "Percentage of users who complete a desired action out of the total number of visitors or interactions"
    },
    {
      "term": "Cooked",
      "desc": "A versatile slang term meaning someone is exhausted, in trouble, defeated, or humiliated, often used to describe hopeless situations"
    },
    {
      "term": "Copium",
      "desc": "An internet slang term combining \"cope\" and \"opium,\" referring to a fictional substance people metaphorically consume to deny or rationalize defeats"
    },
    {
      "term": "CPC (Cost Per Click)",
      "desc": "A digital advertising pricing model where advertisers pay each time a user clicks on their social media ad, commonly used across Facebook Ads, LinkedIn Ads, and other paid social platforms"
    },
    {
      "term": "CPM (Cost Per Mille)",
      "desc": "The cost an advertiser pays per one thousand impressions of their advertisement, a standard metric for measuring advertising reach efficiency on social media platforms"
    },
    {
      "term": "Creative Commons",
      "desc": "A licensing system that allows content creators to grant specific usage permissions for their work, enabling legal sharing and repurposing of images, videos, and other media across social channels"
    },
    {
      "term": "Creator Economy",
      "desc": "A digital ecosystem where individuals monetize their content creation skills and build businesses around their personal brands"
    },
    {
      "term": "Cringe",
      "desc": "Content that evokes secondhand embarrassment due to awkward, inauthentic, or overly exaggerated behavior"
    },
    {
      "term": "Cross Posting",
      "desc": "Sharing the same content across multiple social media platforms or channels to maintain a strong online presence"
    },
    {
      "term": "Crowdsourcing",
      "desc": "A strategic approach to problem-solving and content creation that uses the collective intelligence of online communities to achieve specific business goals"
    },
    {
      "term": "CTA (Call to Action)",
      "desc": "A marketing element that prompts and guides your audience to take a specific desired action, whether it's making a purchase, signing up, or engaging with content"
    },
    {
      "term": "CTR (Click-Through Rate)",
      "desc": "A metric that measures the percentage of people who click on a specific link or call-to-action after viewing it"
    },
    {
      "term": "Customer Reviews",
      "desc": "Authentic user-generated feedback and ratings that provide social proof for potential customers while offering valuable insights for business improvement"
    }
  ],
  "D": [
    {
      "term": "Dark Post",
      "desc": "A targeted social media advertisement that appears in users' feeds but remains invisible on the advertiser's profile or page"
    },
    {
      "term": "Dark Social",
      "desc": "Web traffic from private sharing channels like messaging apps, emails, and secure browsing that can't be accurately tracked by traditional analytics tools"
    },
    {
      "term": "Dashboard",
      "desc": "A visual interface that consolidates and displays key data, metrics, and performance indicators in a single, easily accessible view"
    },
    {
      "term": "Data-Driven Marketing",
      "desc": "A strategic approach that uses audience analytics, engagement metrics, and performance data to inform content creation, posting schedules, and campaign optimization decisions on social media"
    },
    {
      "term": "DC (Dance Credits)",
      "desc": "The attribution system for viral dance trends on social media platforms, especially TikTok, giving credit to original choreographers"
    },
    {
      "term": "Decentralized",
      "desc": "Distribution of power, control, and decision-making from central authorities to a network of participants, enabling more democratic digital systems"
    },
    {
      "term": "Ded",
      "desc": "An intentionally misspelled version of \"dead\" used in digital communication to express extreme reactions, particularly overwhelming amusement"
    },
    {
      "term": "Deinfluencing",
      "desc": "A social media trend that promotes mindful consumption by encouraging critical thinking about purchases and providing honest, unbiased reviews"
    },
    {
      "term": "Delulu",
      "desc": "Social media slang derived from \"delusional,\" representing a self-aware form of positive thinking and manifestation"
    },
    {
      "term": "Demographics",
      "desc": "Statistical characteristics of human populations used to understand and target specific audience segments effectively"
    },
    {
      "term": "Demure",
      "desc": "A reserved, mindful behavior pattern that evolved into a viral social media trend emphasizing elegant self-presentation and thoughtful conduct"
    },
    {
      "term": "Digital Footprint",
      "desc": "The trail of data and information a person or brand leaves behind through online activities, including social media posts, comments, likes, shares, and any other digital interaction"
    },
    {
      "term": "Disappearing Content",
      "desc": "Temporary posts, stories, or messages that automatically delete after a set time period, creating urgency and encouraging frequent platform visits from followers"
    },
    {
      "term": "Discovery Page",
      "desc": "A platform feature like Instagram Explore or TikTok For You Page that surfaces new content to users based on their interests, engagement patterns, and algorithmic recommendations"
    },
    {
      "term": "DM (Direct Message)",
      "desc": "A private communication feature on social media platforms that allows users to send private messages to individuals or groups"
    },
    {
      "term": "Do It for the Gram",
      "desc": "Performing actions or creating specific scenarios primarily for sharing on Instagram to gain likes and engagement"
    },
    {
      "term": "Doomscrolling",
      "desc": "The compulsive habit of continuously consuming negative or distressing news content on social media, despite its harmful effects on mental well-being"
    },
    {
      "term": "Double Tap",
      "desc": "A gesture-based interaction method where users quickly tap twice on digital content to like, zoom, or activate specific features"
    },
    {
      "term": "Doxxing",
      "desc": "The malicious act of publicly revealing someone's private or identifying information online without their consent"
    },
    {
      "term": "Draft Management",
      "desc": "A systematic approach to creating, organizing, and reviewing unpublished content before it goes live, ensuring quality control"
    },
    {
      "term": "Drip Campaign",
      "desc": "An automated series of scheduled messages or content pieces delivered to followers over time to nurture relationships and guide them toward specific actions like sign-ups or purchases"
    },
    {
      "term": "Duet",
      "desc": "A split-screen video feature that allows users to create content alongside an existing video, enabling real-time reactions and collaborations"
    },
    {
      "term": "Dwell Time",
      "desc": "The amount of time a user spends viewing a specific piece of content before scrolling past, used by algorithms as a strong signal of content quality and relevance"
    }
  ],
  "E": [
    {
      "term": "E-commerce Integration",
      "desc": "The process of connecting and synchronizing various business systems and tools with an e-commerce platform to streamline operations"
    },
    {
      "term": "Earned Media Value (EMV)",
      "desc": "Monetary worth of organic brand exposure gained through unpaid publicity, word-of-mouth, and PR efforts"
    },
    {
      "term": "Edutainment",
      "desc": "Content that combines educational information with entertainment elements to make learning engaging, memorable, and highly shareable on social media platforms"
    },
    {
      "term": "Embed",
      "desc": "The process of integrating social media posts, videos, or feeds into external websites or blogs using HTML code, extending content reach and visibility beyond the original platform"
    },
    {
      "term": "Emoji",
      "desc": "Small digital pictographs used to express emotions, ideas, and concepts in digital communication, serving as a universal visual language"
    },
    {
      "term": "Employee Advocacy",
      "desc": "A strategy where employees share branded content and company messages on their personal social media accounts to extend organic reach, build trust, and humanize the brand"
    },
    {
      "term": "Engagement Booster",
      "desc": "Strategic techniques and tools that enhance social media interaction and audience connections"
    },
    {
      "term": "Engagement Metrics",
      "desc": "Measurements that track and measure how users interact with digital content across platforms and channels"
    },
    {
      "term": "Engagement Rate",
      "desc": "A social media metric that measures the level of audience interaction with content relative to follower count or reach"
    },
    {
      "term": "Ephemeral Content",
      "desc": "Short-lived digital content like Instagram Stories and Snapchat Snaps that automatically disappears after a set period, typically 24 hours, creating urgency and driving frequent engagement"
    },
    {
      "term": "Event Marketing",
      "desc": "Using social media platforms to promote, live-cover, and amplify in-person or virtual events to maximize attendance, real-time engagement, and post-event content opportunities"
    },
    {
      "term": "Evergreen Content",
      "desc": "Timeless, high-quality content that maintains its relevance and continues to attract audience engagement long after its initial publication"
    },
    {
      "term": "Evergreen Post",
      "desc": "A social media post designed to remain relevant and valuable indefinitely, capable of being reshared or recycled to generate consistent engagement regardless of when it is viewed"
    },
    {
      "term": "Extra",
      "desc": "A slang term used to describe someone or something that's over-the-top, excessively dramatic, or doing more than necessary"
    }
  ],
  "F": [
    {
      "term": "Face Card",
      "desc": "Social media slang referring to someone's exceptional beauty or attractiveness that consistently impresses"
    },
    {
      "term": "Facebook Ads Manager",
      "desc": "Meta's advertising platform for creating, managing, and analyzing paid campaigns across Facebook, Instagram, Messenger, and the Meta Audience Network with detailed targeting and budget controls"
    },
    {
      "term": "Facebook Groups",
      "desc": "Community spaces within Facebook where users with shared interests can connect, discuss topics, share content, and build relationships around common themes or brands"
    },
    {
      "term": "Facebook Pixel",
      "desc": "A tracking code installed on websites that monitors user actions after clicking Facebook ads, enabling conversion tracking, audience retargeting, and campaign optimization"
    },
    {
      "term": "Facebook Timeline",
      "desc": "A chronological display of a user's activity on their profile page, organizing all posts, photos, videos, and life events"
    },
    {
      "term": "FBF (Flashback Friday)",
      "desc": "A social media trend where users share nostalgic photos, videos, or memories from their past specifically on Fridays"
    },
    {
      "term": "Feed Curation",
      "desc": "Strategic process of discovering, selecting, organizing, and sharing valuable content from various sources to create a meaningful information stream"
    },
    {
      "term": "File Management",
      "desc": "The process of organizing, storing, and securing digital files for easy access, improved workflow, and data protection"
    },
    {
      "term": "Finna",
      "desc": "A slang term evolved from \"fixing to,\" meaning \"about to\" or \"going to\" do something in the immediate future"
    },
    {
      "term": "Finsta",
      "desc": "Short for \"fake Instagram,\" a private, secondary Instagram account where users share personal, unfiltered content with select friends"
    },
    {
      "term": "Flop Era",
      "desc": "A noticeable period of decline in popularity, success, or engagement experienced by an individual, brand, or creator"
    },
    {
      "term": "Follower Count",
      "desc": "The total number of users who subscribe to a social media account's updates, serving as a basic metric of audience size, brand reach, and perceived credibility"
    },
    {
      "term": "Forum",
      "desc": "An online discussion platform where users engage in structured conversations around specific topics, creating communities"
    },
    {
      "term": "FR (For Real)",
      "desc": "An internet slang abbreviation used to express sincerity, confirmation, or emphasis in digital communications"
    },
    {
      "term": "Frequency",
      "desc": "The average number of times a single user sees a particular advertisement or piece of content within a defined time period during a social media campaign, important for avoiding ad fatigue"
    },
    {
      "term": "FS (For Sure)",
      "desc": "A casual abbreviation expressing agreement or certainty in texting and social media conversations"
    },
    {
      "term": "Funnel",
      "desc": "The stages a potential customer moves through from initial brand awareness on social media to final conversion, typically including awareness, consideration, decision, and advocacy phases"
    },
    {
      "term": "FYP (For You Page)",
      "desc": "TikTok's personalized feed that curates videos based on user behavior and preferences using algorithmic recommendations"
    }
  ],
  "G": [
    {
      "term": "Gatekeeping",
      "desc": "Controlling access to information, communities, or resources by determining who gets to participate and what content is shared"
    },
    {
      "term": "GDPR Compliance",
      "desc": "EU data protection regulations requiring legal collection, processing, and protection of personal data while respecting privacy rights"
    },
    {
      "term": "Geotags",
      "desc": "Adding geographical identification information to digital content like social media posts, photos, videos, and other media files"
    },
    {
      "term": "Ghosting",
      "desc": "Abruptly cutting off all communication with followers, customers, or potential clients on social media without explanation"
    },
    {
      "term": "GIF",
      "desc": "Short, looping animations created by combining multiple image frames into a single file, commonly used for reactions and entertainment"
    },
    {
      "term": "Girlfriend Effect",
      "desc": "A visible improvement in someone's appearance and style that occurs after entering a romantic relationship"
    },
    {
      "term": "Girl Math",
      "desc": "Humorous social media trend describing the playful, often irrational justification methods used to rationalize purchases or spending"
    },
    {
      "term": "Glow-down",
      "desc": "A visible decline in someone's appearance, style, or overall aesthetic presentation compared to their previous state"
    },
    {
      "term": "Glow-up",
      "desc": "The dramatic improvement of appearance, style, or overall presence through enhanced visuals, content quality, and presentation"
    },
    {
      "term": "Go Live",
      "desc": "Broadcasting real-time video content to an audience through social media platforms, enabling immediate interaction"
    },
    {
      "term": "Goblin Mode",
      "desc": "A social media trend embracing unfiltered self-expression that rejects perfectionism in favor of authentic online presence"
    },
    {
      "term": "Google Analytics Integration",
      "desc": "Connecting social media campaigns with Google Analytics to track website traffic, conversions, and user behavior originating from social media platforms for comprehensive performance measurement"
    },
    {
      "term": "Google Business Profile",
      "desc": "A free tool to manage online presence across Google Search, Maps, and other Google services while connecting with customers"
    },
    {
      "term": "GPT",
      "desc": "AI language model designed to understand and generate human-like text based on patterns learned from massive datasets"
    },
    {
      "term": "Grid Layout",
      "desc": "The visual arrangement of posts on an Instagram profile page, strategically planned to create an aesthetically cohesive and branded appearance when viewed as a whole"
    },
    {
      "term": "Group Boards",
      "desc": "Collaborative Pinterest boards where multiple contributors can add Pins, used by brands and communities to curate shared content around specific topics or themes"
    },
    {
      "term": "Growth Hacking",
      "desc": "Creative, low-cost marketing strategies focused on rapid audience growth and user acquisition through viral mechanics, referral programs, and unconventional social media tactics"
    },
    {
      "term": "GRWM (Get Ready With Me)",
      "desc": "A popular content format where creators film their preparation routines, creating an intimate viewing experience"
    },
    {
      "term": "Guest Post Outreach",
      "desc": "Proposing and publishing content on other websites to build authority, generate backlinks, and reach new audiences"
    },
    {
      "term": "GYAT",
      "desc": "A slang term expressing strong admiration or surprise, often used when seeing someone attractive"
    }
  ],
  "H": [
    {
      "term": "Handle",
      "desc": "A unique username preceded by the @ symbol that identifies a user or brand on social media platforms, used for tagging, mentions, and direct communication across channels"
    },
    {
      "term": "Hard Launch",
      "desc": "Publicly and explicitly announcing a new relationship, product, or project on social media with clear, detailed content, the opposite of a subtle soft launch"
    },
    {
      "term": "Hashtag",
      "desc": "A metadata tag preceded by the # symbol used to categorize content and increase discoverability on social media platforms"
    },
    {
      "term": "Hashtag Analysis",
      "desc": "Systematic process of evaluating and measuring the performance, reach, and engagement of hashtags across social media platforms"
    },
    {
      "term": "Hashtag Campaign",
      "desc": "A coordinated marketing initiative built around a specific branded hashtag to unify content, track engagement, and encourage user participation around a central theme or promotion"
    },
    {
      "term": "Hashtag Research",
      "desc": "Systematic process of identifying, analyzing, and selecting effective hashtags to improve content visibility and engagement"
    },
    {
      "term": "Header Image",
      "desc": "The large banner image displayed at the top of social media profiles on platforms like X, LinkedIn, and Facebook, used to visually communicate brand identity and current campaigns"
    },
    {
      "term": "Heatmap Analysis",
      "desc": "A data visualization tool that uses color-coding to represent user behavior patterns and engagement levels on websites"
    },
    {
      "term": "Highkey",
      "desc": "A slang term used to express strong, unfiltered enthusiasm or emphasis in digital conversations, opposite of \"lowkey\""
    },
    {
      "term": "Hook",
      "desc": "The opening seconds of a video or first line of a social media post designed to capture audience attention immediately and compel them to continue watching, reading, or engaging with the content"
    },
    {
      "term": "Hyperlocal Marketing",
      "desc": "Social media marketing strategies targeting extremely specific geographic areas, such as neighborhoods or city blocks, to reach nearby potential customers with location-relevant content"
    }
  ],
  "I": [
    {
      "term": "I Was Today Years Old",
      "desc": "A playful internet expression used to share surprising discoveries or realizations that someone just learned"
    },
    {
      "term": "IB (Inspired By)",
      "desc": "A social media acronym used to credit another creator as the source of inspiration for content"
    },
    {
      "term": "Ick",
      "desc": "The sudden feeling of disgust or turn-off toward someone on social media, triggered by minor behaviors that instantly change perception"
    },
    {
      "term": "ICYMI (In Case You Missed It)",
      "desc": "An acronym used across social media to reshare important information that recipients might have overlooked"
    },
    {
      "term": "IFYKYK (If You Know You Know)",
      "desc": "A social media acronym creating exclusivity by indicating content contains references only a specific audience will understand"
    },
    {
      "term": "IIRC (If I Remember Correctly)",
      "desc": "An internet acronym used to share information while acknowledging possible inaccuracy due to memory limitations"
    },
    {
      "term": "IJBOL (I Just Burst Out Laughing)",
      "desc": "A social media acronym expressing genuine, spontaneous laughter indicating content caused immediate humor"
    },
    {
      "term": "Impressions",
      "desc": "The number of times content is displayed to users on social media platforms, regardless of whether they interacted with it"
    },
    {
      "term": "In-Feed Ad",
      "desc": "A native advertising format that appears within a user's social media feed, designed to blend seamlessly with organic content while being clearly labeled as sponsored or promoted"
    },
    {
      "term": "Influencer Marketing",
      "desc": "A form of social media marketing that uses the reputation and audience of influential individuals in specific niches"
    },
    {
      "term": "Influencer Outreach",
      "desc": "Strategic process of identifying, contacting, and building relationships with influential individuals to promote your brand"
    },
    {
      "term": "Infographic",
      "desc": "A visual representation of data, information, or knowledge designed to present complex information quickly and clearly, making it one of the most shareable content formats on social media"
    },
    {
      "term": "Innit",
      "desc": "A British English slang contraction of \"isn't it\" that functions as a tag question seeking confirmation"
    },
    {
      "term": "Insights",
      "desc": "Meaningful patterns and actionable information derived from data analysis that help businesses make informed marketing decisions"
    },
    {
      "term": "Instagram Carousel",
      "desc": "A post format that allows users to share up to 20 photos or videos in a single post that viewers can swipe through"
    },
    {
      "term": "Instagram Close Friends",
      "desc": "A privacy feature allowing users to share Stories and posts exclusively with a select group of followers"
    },
    {
      "term": "Instagram Insights",
      "desc": "A native analytics tool providing data on account performance, audience demographics, and content engagement"
    },
    {
      "term": "Instagram Shopping",
      "desc": "A suite of e-commerce features allowing businesses to tag products in posts, Stories, and Reels, enabling users to browse and purchase directly within the Instagram app without leaving the platform"
    },
    {
      "term": "Instagram Story Highlights",
      "desc": "Permanent collections of Stories displayed on profiles that showcase content beyond the standard 24-hour lifespan"
    },
    {
      "term": "Instagrammable",
      "desc": "Visually appealing content, places, or experiences specifically designed to be photogenic and shareable on Instagram"
    },
    {
      "term": "Interactive Content",
      "desc": "Social media posts that require active audience participation such as polls, quizzes, sliders, question stickers, and choose-your-own-adventure style stories that boost engagement rates"
    },
    {
      "term": "ION (In Other News)",
      "desc": "A versatile social media slang used to transition between topics in digital conversations"
    },
    {
      "term": "ISO (In Search Of)",
      "desc": "A social media acronym used when someone is actively looking for specific items, information, or recommendations"
    },
    {
      "term": "It's Giving",
      "desc": "Popular social media slang used to describe the vibe, energy, or impression that someone or something conveys"
    },
    {
      "term": "Iteration",
      "desc": "The process of continuously refining social media content and strategy based on performance data, audience feedback, and A/B testing results to improve outcomes over time"
    }
  ],
  "J": [
    {
      "term": "Journey Mapping",
      "desc": "Strategic visualization technique documenting the end-to-end experience a customer has with a brand across all touchpoints"
    },
    {
      "term": "JPG/JPEG",
      "desc": "A digital image file format that uses lossy compression to reduce file size while maintaining reasonable visual quality"
    },
    {
      "term": "Jumplinks",
      "desc": "Clickable navigation elements within long-form social media content or landing pages that allow users to skip directly to specific sections of interest"
    },
    {
      "term": "Just-in-Time Content",
      "desc": "Real-time or rapidly produced social media content created to capitalize on trending topics, breaking news, or timely cultural moments for maximum relevance and engagement"
    }
  ],
  "K": [
    {
      "term": "Key Message",
      "desc": "The central idea or value proposition a brand consistently communicates across all social media content to reinforce positioning, build recognition, and drive audience understanding"
    },
    {
      "term": "Keyword Research",
      "desc": "Strategic process of discovering and analyzing search terms that people enter into search engines to optimize content"
    },
    {
      "term": "Kik",
      "desc": "A mobile messaging app that allows anonymous communication through usernames, featuring chat and media sharing"
    },
    {
      "term": "Klout Score",
      "desc": "A now-defunct numerical rating that measured social media influence based on engagement, reach, and network size, representing one of the earliest attempts at quantifying online authority and influence"
    },
    {
      "term": "Knowledge Base",
      "desc": "A centralized repository of organized information providing self-service access to documentation, guides, and resources"
    },
    {
      "term": "KPIs (Key Performance Indicators)",
      "desc": "Quantifiable metrics used to evaluate success in meeting objectives and track progress toward goals"
    },
    {
      "term": "Krissed",
      "desc": "A social media prank where viewers are baited with sensational content only to be surprised by a clip of Kris Jenner dancing"
    }
  ],
  "L": [
    {
      "term": "L (Loss)",
      "desc": "A social media slang term indicating failure or defeat, commonly used to describe embarrassing moments or marketing missteps"
    },
    {
      "term": "Landing Page",
      "desc": "A standalone web page specifically designed to receive traffic from social media campaigns, optimized for a single conversion goal like email sign-ups, product purchases, or app downloads"
    },
    {
      "term": "Latergram",
      "desc": "The practice of posting photos or content on social media after the moment has passed, rather than sharing in real time, often paired with strategic scheduling for optimal engagement"
    },
    {
      "term": "Lead Generation",
      "desc": "Strategic process of attracting and converting strangers into individuals who have expressed interest in your products or services"
    },
    {
      "term": "Lewk",
      "desc": "A stylized spelling of \"look,\" referring to a distinctive, carefully curated personal appearance or style making a bold statement"
    },
    {
      "term": "Link in Bio",
      "desc": "A clickable URL placed in social media profile biographies that directs followers to external websites or content hubs"
    },
    {
      "term": "Link Shortening",
      "desc": "Process of creating condensed URLs that redirect to longer destinations while providing tracking capabilities"
    },
    {
      "term": "Link Tree",
      "desc": "A landing page tool that allows users to share multiple links through a single URL from one access point"
    },
    {
      "term": "LinkedIn Articles",
      "desc": "Long-form content published directly on the LinkedIn platform that showcases professional expertise, thought leadership, and industry insights to a professional audience"
    },
    {
      "term": "LinkedIn Company Page",
      "desc": "A dedicated professional profile for businesses on LinkedIn enabling organizations to share updates and engage audiences"
    },
    {
      "term": "Live Streaming",
      "desc": "Real-time broadcasting of video content over the internet, allowing viewers to watch events as they happen with instant interaction"
    },
    {
      "term": "Long-form Video",
      "desc": "Extended video content typically lasting more than 3-10 minutes providing in-depth information or storytelling"
    },
    {
      "term": "Lookalike Audience",
      "desc": "A targeting method that finds new users who share similar characteristics with your existing customers to expand reach"
    },
    {
      "term": "Lowkey",
      "desc": "A slang term describing something done quietly, discreetly, or with minimal attention, indicating a desire to keep it private"
    },
    {
      "term": "Lurker",
      "desc": "A social media user who regularly consumes content and follows accounts but rarely or never engages through likes, comments, shares, or posts of their own, making up the silent majority of most audiences"
    }
  ],
  "M": [
    {
      "term": "Macro-Influencer",
      "desc": "A social media personality with 100,000 to 1 million followers who creates professional content in specific niches"
    },
    {
      "term": "Main Character Energy",
      "desc": "Confidence someone exhibits when they embrace being the protagonist of their own life, making authentic choices"
    },
    {
      "term": "Marketing Giveaways",
      "desc": "Promotional campaigns where brands offer free products or experiences in exchange for engagement or social actions"
    },
    {
      "term": "Mashup",
      "desc": "A creative content format combining elements from multiple sources to create a new, unique piece with enhanced value"
    },
    {
      "term": "Media Kit",
      "desc": "A professionally prepared document or digital portfolio that influencers and creators share with brands, outlining audience demographics, engagement rates, content examples, and collaboration pricing"
    },
    {
      "term": "Mega Influencer",
      "desc": "A social media personality with millions of followers who has significant influence over consumer behavior"
    },
    {
      "term": "Meme",
      "desc": "A piece of content, typically humorous, that spreads rapidly across the internet through social sharing and imitation"
    },
    {
      "term": "Menty B (Mental Breakdown)",
      "desc": "Internet slang used by Gen Z to discuss moments of emotional distress in a humorous, relatable way"
    },
    {
      "term": "Messenger",
      "desc": "A real-time communication platform allowing users to exchange messages, media, and other content"
    },
    {
      "term": "Meta Business Suite",
      "desc": "Meta's centralized platform for managing business presence across Facebook, Instagram, and Messenger, including content scheduling, messaging, advertising, and analytics in a single interface"
    },
    {
      "term": "Metrics",
      "desc": "Quantifiable measurements used to track, analyze, and assess social media performance including reach, engagement rate, impressions, conversions, and audience growth over time"
    },
    {
      "term": "Micro-Influencer",
      "desc": "A social media content creator with 1,000-100,000 followers who creates niche, authentic content with high engagement"
    },
    {
      "term": "Microblogging",
      "desc": "Publishing short-form content on platforms like X, Tumblr, or Threads, typically limited by character count and designed for quick consumption, rapid sharing, and real-time conversation"
    },
    {
      "term": "Moment Marketing",
      "desc": "Creating timely social media content that capitalizes on current events, cultural trends, or viral moments to increase relevance, engagement, and brand visibility while the topic is still trending"
    },
    {
      "term": "Monetization",
      "desc": "The process of generating revenue from digital products, services, content, or platforms by converting user engagement"
    },
    {
      "term": "Monthly Active Users (MAU)",
      "desc": "The number of unique users who engage with a social media platform at least once within a 30-day period, used as a key metric to measure platform popularity, growth, and advertising potential"
    },
    {
      "term": "Moots",
      "desc": "Social media slang referring to people who follow each other on platforms, indicating a reciprocal relationship"
    },
    {
      "term": "Multi-Account Management",
      "desc": "A feature enabling control, scheduling, and monitoring of multiple social media profiles from a single dashboard"
    },
    {
      "term": "Multi-Platform Publishing",
      "desc": "The strategy of distributing content across multiple digital channels simultaneously to maximize reach"
    }
  ],
  "N": [
    {
      "term": "Nano-Influencer",
      "desc": "A social media content creator with 1,000-10,000 followers who creates authentic content for highly engaged niche audiences"
    },
    {
      "term": "Native Advertising",
      "desc": "Paid content that matches the look and feel of the platform it appears on, blending with non-sponsored content"
    },
    {
      "term": "Naur",
      "desc": "Internet slang representing the Australian pronunciation of \"no,\" used to express refusal or dramatic reactions"
    },
    {
      "term": "Nepo Baby",
      "desc": "A term referring to individuals who gain advantages or opportunities due to family connections rather than solely merit"
    },
    {
      "term": "Newsfeed",
      "desc": "A continuously updating list of content on social media platforms displaying recent posts, updates, and content"
    },
    {
      "term": "Newsjacking",
      "desc": "A marketing strategy where brands use trending news stories to gain visibility by creating relevant connecting content"
    },
    {
      "term": "Newsletter",
      "desc": "A regularly distributed email publication sent to subscribers containing valuable content, updates, and promotional information"
    },
    {
      "term": "NFS (Not For Sale)",
      "desc": "Commonly means \"Not For Sale\" on social media, but can also stand for \"No Funny Stuff\" or other meanings"
    },
    {
      "term": "Niche",
      "desc": "A specialized segment of the market focusing on a specific product or service that your business uniquely offers"
    },
    {
      "term": "Niche Targeting",
      "desc": "A focused marketing approach concentrating resources on a clearly defined segment based on specific characteristics"
    },
    {
      "term": "Notification",
      "desc": "An alert sent by social media platforms to inform users about activity related to their account, such as likes, comments, follows, mentions, scheduled post reminders, or live stream starts"
    },
    {
      "term": "Nurture Campaign",
      "desc": "A series of strategically timed social media interactions and content designed to build relationships with potential customers and guide them through the buying journey toward conversion"
    }
  ],
  "O": [
    {
      "term": "OG (Original Gangster)",
      "desc": "A slang term describing someone or something that is original, authentic, pioneering, or highly respected"
    },
    {
      "term": "Old Money Aesthetic",
      "desc": "A fashion and lifestyle trend emulating the understated elegance of generational wealth through timeless design"
    },
    {
      "term": "Omni-Channel Marketing",
      "desc": "A strategic approach creating seamless, integrated customer experiences across all touchpoints"
    },
    {
      "term": "ONB (On Bro)",
      "desc": "A social media acronym meaning \"on bro\" to express sincerity, or \"outward nose breath\" for mild amusement"
    },
    {
      "term": "OOMF (One of My Followers)",
      "desc": "An acronym used on social media to reference someone without directly naming them"
    },
    {
      "term": "OPP (Opponent)",
      "desc": "A slang term primarily meaning \"opponent\" or \"opposition,\" used to reference rivals or competitors"
    },
    {
      "term": "Opt-in",
      "desc": "A user's explicit consent to receive marketing communications, follow updates, or share data with a brand, forming the foundation of permission-based social media marketing and GDPR-compliant outreach"
    },
    {
      "term": "Organic Marketing",
      "desc": "Marketing strategies that generate traffic and engagement without direct payment, focusing on valuable content"
    },
    {
      "term": "Organic Reach",
      "desc": "The number of unique users who view content without paid promotion, representing natural distribution"
    },
    {
      "term": "Outreach Marketing",
      "desc": "The proactive process of connecting with influencers, media outlets, and potential partners on social media to build relationships, earn coverage, and expand brand visibility to new audiences"
    },
    {
      "term": "Overlay",
      "desc": "Visual elements such as text, graphics, stickers, or filters layered on top of images or videos in social media content to add context, branding, calls to action, or creative flair"
    }
  ],
  "P": [
    {
      "term": "Paid Social",
      "desc": "Advertising campaigns and sponsored content distributed through social media platforms' paid promotion features to reach targeted audiences beyond organic followers and drive specific business objectives"
    },
    {
      "term": "Pay-Per-Click (PPC)",
      "desc": "A digital advertising model where advertisers pay for each click on their online ads"
    },
    {
      "term": "Performance Reporting",
      "desc": "The process of tracking, analyzing, and presenting data to measure and improve business performance"
    },
    {
      "term": "Permalink",
      "desc": "A permanent, static URL assigned to a specific social media post or piece of content, used for sharing, referencing, embedding, and tracking individual posts across channels"
    },
    {
      "term": "Persona Creation",
      "desc": "Developing detailed, semi-fictional profiles of ideal customers based on market research to guide marketing efforts"
    },
    {
      "term": "PFP (Profile Picture)",
      "desc": "Visual representation of a person, brand, or entity used across social media platforms to establish identity"
    },
    {
      "term": "Pinned Post",
      "desc": "A social media feature displaying specific content at the top of a profile regardless of posting date for maximum visibility"
    },
    {
      "term": "Pinterest Board",
      "desc": "A curated collection of saved Pins organized around a specific theme or interest"
    },
    {
      "term": "Platform Algorithm",
      "desc": "The proprietary ranking system each social media platform uses to determine content visibility, prioritizing posts based on relevance, engagement signals, recency, relationship strength, and user behavior patterns"
    },
    {
      "term": "Podcast",
      "desc": "An episodic digital audio program that can be downloaded or streamed online, covering various topics"
    },
    {
      "term": "Pookie",
      "desc": "An affectionate term of endearment used for romantic partners, close friends, children, or pets"
    },
    {
      "term": "Post Boost",
      "desc": "A simplified advertising feature that allocates paid budget to increase the reach of an existing organic social media post to a wider or more specifically targeted audience"
    },
    {
      "term": "Post Recycling",
      "desc": "Strategic practice of republishing previously shared content to extend its lifespan and maximize value"
    },
    {
      "term": "POV (Point of View)",
      "desc": "A social media content format placing viewers in a specific perspective or scenario, creating immersive experiences"
    },
    {
      "term": "Private Message",
      "desc": "Direct, one-to-one digital communication between users that isn't visible to others"
    },
    {
      "term": "Publishing Schedule",
      "desc": "A strategic timetable defining when and how often content is published across social media platforms, optimized for audience activity patterns, time zones, and platform-specific best practices"
    },
    {
      "term": "Push Notification",
      "desc": "An alert sent directly to a user's mobile device or desktop from a social media app, designed to drive re-engagement, inform users of relevant activity, and increase daily active usage"
    },
    {
      "term": "Put on Blast",
      "desc": "Publicly exposing or criticizing someone's actions or private information to a wide audience on social media"
    }
  ],
  "Q": [
    {
      "term": "Quality Score",
      "desc": "A rating assigned by advertising platforms like Facebook Ads and Google Ads that evaluates the relevance and quality of ads, targeting, and landing pages, directly affecting ad placement priority and cost"
    },
    {
      "term": "Queue Management",
      "desc": "A systematic approach to organizing, scheduling, and distributing social media content according to predetermined patterns"
    },
    {
      "term": "Quick Post",
      "desc": "A spontaneous social media update published immediately rather than scheduled, for real-time engagement"
    },
    {
      "term": "Quote Tweet",
      "desc": "A feature on X (formerly Twitter) that allows users to share another user's post with their own added commentary, enabling layered conversation, reaction sharing, and expanded dialogue"
    }
  ],
  "R": [
    {
      "term": "Reach",
      "desc": "The total number of unique users who have seen a piece of social media content, distinguishing it from impressions which count repeated views by the same user and providing a measure of true audience size"
    },
    {
      "term": "Real-Time Analytics",
      "desc": "Process of collecting, analyzing, and visualizing data immediately as it's generated for instant decision-making"
    },
    {
      "term": "Real-Time Monitoring",
      "desc": "Tracking and analysis of data as it's generated, enabling immediate insights based on up-to-the-minute activity"
    },
    {
      "term": "Recurring Schedules",
      "desc": "Posting at predefined intervals (daily, weekly, monthly) for consistent social media presence"
    },
    {
      "term": "Reels",
      "desc": "Short-form vertical videos on Instagram and Facebook with creative tools, effects, and audio features"
    },
    {
      "term": "Referral Traffic",
      "desc": "Website traffic arriving from links on external sources like other websites, social media, forums, and blogs"
    },
    {
      "term": "Remarketing",
      "desc": "A paid advertising strategy that targets users who have previously interacted with your brand's content, website, or social media profiles with tailored follow-up ads to encourage return visits and conversions"
    },
    {
      "term": "Reply Rate",
      "desc": "The percentage of incoming social media messages or comments that receive a response from a brand, measuring customer service responsiveness, engagement quality, and community management effectiveness"
    },
    {
      "term": "Repost",
      "desc": "The practice of sharing content originally created by another user while providing proper attribution"
    },
    {
      "term": "Retweet",
      "desc": "A Twitter feature allowing users to share another user's tweet with their followers, increasing content reach"
    },
    {
      "term": "RN (Right Now)",
      "desc": "A common social media acronym indicating something happening at the present moment"
    },
    {
      "term": "ROI (Return on Investment)",
      "desc": "A performance metric calculating the financial return generated from social media marketing efforts relative to the total cost invested in those campaigns, expressed as a percentage"
    },
    {
      "term": "Roman Empire",
      "desc": "A viral social media trend about topics someone frequently obsesses over, originally about thinking about ancient Rome"
    },
    {
      "term": "RSS Feed",
      "desc": "A standardized web feed format that allows users and tools to automatically receive updates from websites and blogs, often integrated with social media scheduling platforms for automated content sharing"
    }
  ],
  "S": [
    {
      "term": "Salty",
      "desc": "A slang term describing someone who is bitter, irritated, or resentful, particularly in response to disappointment"
    },
    {
      "term": "Saved Posts",
      "desc": "A bookmarking feature across social media platforms that allows users to privately save content for later viewing, serving as a strong signal of content value to platform algorithms"
    },
    {
      "term": "Say Less",
      "desc": "A slang expression indicating enthusiastic agreement or understanding without needing further explanation"
    },
    {
      "term": "Scheduled Reports",
      "desc": "Automated, pre-configured data compilations generated and delivered at regular intervals"
    },
    {
      "term": "Scheduling and Publishing",
      "desc": "The process of planning, creating, and automating content distribution across social platforms at predetermined times"
    },
    {
      "term": "Scrubbing",
      "desc": "A video navigation technique allowing users to move through content by dragging a timeline slider"
    },
    {
      "term": "Sending Me",
      "desc": "Social media slang indicating something has triggered an extreme emotional reaction"
    },
    {
      "term": "Sentiment Analysis",
      "desc": "Using natural language processing to systematically identify and quantify emotional tone behind social media content"
    },
    {
      "term": "SEO Link Building",
      "desc": "Strategic process of acquiring hyperlinks from other websites to improve search rankings and build authority"
    },
    {
      "term": "Shadow Banned",
      "desc": "When social media platforms limit content visibility without notifying the user, resulting in reduced reach"
    },
    {
      "term": "Share of Voice",
      "desc": "A metric measuring a brand's presence in social media conversations compared to competitors, calculated by analyzing mentions, hashtags, and overall visibility within a specific industry or topic"
    },
    {
      "term": "Short-Form Video",
      "desc": "Brief video content typically under 60 seconds, popularized by TikTok, Instagram Reels, and YouTube Shorts, designed for quick mobile consumption and high engagement rates"
    },
    {
      "term": "Side Eye",
      "desc": "A facial expression where someone glances skeptically or disapprovingly from the corner of their eyes"
    },
    {
      "term": "Sigma",
      "desc": "Internet slang that evolved from a masculine archetype to a versatile expression meaning \"excellent\""
    },
    {
      "term": "Sksksk",
      "desc": "Internet slang mimicking keyboard smashing to convey extreme excitement or laughter"
    },
    {
      "term": "Sliding into DMs",
      "desc": "Initiating a private conversation through direct messages with someone you've had little previous interaction with"
    },
    {
      "term": "SMH (Shake My Head)",
      "desc": "An internet acronym expressing disappointment or disapproval when someone finds something absurd"
    },
    {
      "term": "SMMA (Social Media Marketing Agency)",
      "desc": "A business providing specialized social media management and marketing services to help companies improve online presence"
    },
    {
      "term": "Social Commerce",
      "desc": "The integration of e-commerce functionality directly into social media platforms, allowing users to discover, browse, and purchase products without leaving the app through features like shoppable posts and in-app checkout"
    },
    {
      "term": "Social CRM",
      "desc": "Customer relationship management that integrates social media data and interactions to provide a comprehensive view of customer relationships, enabling personalized engagement and support across channels"
    },
    {
      "term": "Social Inbox",
      "desc": "A centralized dashboard collecting and managing all social media interactions from multiple platforms"
    },
    {
      "term": "Social Listening",
      "desc": "The practice of monitoring social media platforms for mentions of your brand, competitors, products, and industry keywords to gather actionable insights, identify trends, and inform marketing strategy"
    },
    {
      "term": "Social Media Analytics",
      "desc": "The process of collecting, measuring, analyzing, and interpreting data from social platforms to evaluate performance"
    },
    {
      "term": "Social Media Etiquette",
      "desc": "The set of acceptable behaviors and best practices guiding how to interact respectfully and effectively online"
    },
    {
      "term": "Social Media Feed",
      "desc": "A continuously updating stream of content displaying posts from followed accounts and algorithm-selected content"
    },
    {
      "term": "Social Media Handle",
      "desc": "A unique username or identifier representing an individual or brand on social platforms, typically preceded by @"
    },
    {
      "term": "Social Media Management",
      "desc": "Comprehensive process of overseeing a brand's social media presence through planning, creating, scheduling, and analyzing content"
    },
    {
      "term": "Social Media Marketing",
      "desc": "Strategic process of creating and sharing content on social platforms to achieve marketing goals and build brand awareness"
    },
    {
      "term": "Social Media Mention",
      "desc": "When a user references a brand, product, or person in a post by using a handle, username, or naming them"
    },
    {
      "term": "Social Media Monitoring",
      "desc": "Process of tracking, analyzing, and responding to conversations and mentions about your brand across social platforms"
    },
    {
      "term": "Social Media Story",
      "desc": "A temporary, multimedia content format that disappears after 24 hours, featuring photos, videos, and interactive elements"
    },
    {
      "term": "Social Media Targeting",
      "desc": "Practice of identifying and reaching specific audience segments based on demographics, interests, and behaviors"
    },
    {
      "term": "Social Media Traffic",
      "desc": "Visitors who come to a website from social platforms through links in posts, profiles, ads, or messages"
    },
    {
      "term": "Social Proof",
      "desc": "A psychological phenomenon where people follow the actions of others, leveraged on social media through follower counts, testimonials, reviews, endorsements, and user-generated content to build trust"
    },
    {
      "term": "Soft Launch",
      "desc": "A subtle, intentionally vague introduction of a new romantic relationship on social media without clearly showing your partner"
    },
    {
      "term": "Solulu",
      "desc": "Social media slang derived from \"solution,\" popularized through the phrase \"delulu is the solulu\""
    },
    {
      "term": "Sponsored Content",
      "desc": "Paid promotional material created in partnership between brands and publishers or influencers, designed to match the look and feel of organic platform content while being disclosed as a paid collaboration"
    },
    {
      "term": "Stan",
      "desc": "A slang term describing an extremely passionate fan of a celebrity or media property, functioning as both noun and verb"
    },
    {
      "term": "Sus",
      "desc": "Internet slang for \"suspicious\" or \"suspect,\" describing someone or something that seems untrustworthy or questionable"
    }
  ],
  "T": [
    {
      "term": "Tag Management",
      "desc": "A strategic system for organizing and implementing content tags to improve searchability and categorization"
    },
    {
      "term": "Target Audience",
      "desc": "The specific group of people most likely to be interested in and engage with your social media content, defined by demographics, interests, behaviors, psychographics, and platform preferences"
    },
    {
      "term": "Targeting",
      "desc": "Strategic process of identifying and segmenting specific audiences based on criteria to deliver personalized content"
    },
    {
      "term": "TBF (To Be Fair)",
      "desc": "A common social media acronym used to introduce balanced perspectives or acknowledge alternative viewpoints"
    },
    {
      "term": "TBH (To Be Honest)",
      "desc": "Widely used on social media to emphasize sincerity in statements or as a noun for exchanging compliments"
    },
    {
      "term": "TBT (Throwback Thursday)",
      "desc": "A social media trend where users post nostalgic photos or memories on Thursdays using #TBT"
    },
    {
      "term": "Tea",
      "desc": "A slang term referring to gossip, juicy information, or revealing secrets, commonly used in \"spill the tea\""
    },
    {
      "term": "Team Collaboration",
      "desc": "Coordinated effort among marketing team members to plan, create, approve, and publish cohesive content"
    },
    {
      "term": "Testimonials",
      "desc": "Authentic statements from satisfied customers endorsing a product or service based on personal experience"
    },
    {
      "term": "TFW (That Feeling When)",
      "desc": "A social media acronym used to introduce relatable scenarios or emotions, often paired with images"
    },
    {
      "term": "Thread",
      "desc": "A series of connected social media posts from the same user creating a narrative extending beyond character limits"
    },
    {
      "term": "Threads",
      "desc": "Meta's text-based social media platform launched as a companion to Instagram, designed for sharing text updates, joining public conversations, and building community through short-form written content"
    },
    {
      "term": "TikTok Challenge",
      "desc": "Trend-based activities where users create videos performing specific actions, dances, or creative tasks"
    },
    {
      "term": "Time Zone Scheduling",
      "desc": "The practice of scheduling social media posts to publish at optimal times across different geographic time zones to maximize global audience engagement and ensure content reaches followers when they are most active"
    },
    {
      "term": "Touch Grass",
      "desc": "Internet slang encouraging someone to disconnect from digital environments and reconnect with the physical world"
    },
    {
      "term": "Trending",
      "desc": "Topics, content, or hashtags experiencing a significant surge in popularity and engagement within a specific timeframe"
    },
    {
      "term": "Trending Topic",
      "desc": "A subject, hashtag, or keyword experiencing a significant spike in social media conversations within a specific timeframe, often surfaced by platform algorithms and presenting opportunities for timely content creation"
    },
    {
      "term": "Troll",
      "desc": "An individual who deliberately posts provocative or offensive content to disrupt conversations and provoke reactions"
    },
    {
      "term": "TS (Talk Soon)",
      "desc": "A versatile texting acronym meaning \"Talk Soon,\" \"True Story,\" or \"Tough Situation\" depending on context"
    },
    {
      "term": "TTM (Talk To Me)",
      "desc": "Primarily means \"Talk To Me\" in texting, an invitation for conversation"
    },
    {
      "term": "Tuff",
      "desc": "A positive slang variant of \"tough\" used to describe something that is cool, impressive, or worthy of admiration"
    },
    {
      "term": "TW (Trigger Warning)",
      "desc": "A statement alerting audiences to potentially disturbing content that follows, allowing individuals to prepare"
    },
    {
      "term": "Twitter/X Spaces",
      "desc": "A live audio conversation feature on X (formerly Twitter) that allows users to host and participate in real-time voice discussions with their followers and the broader community"
    }
  ],
  "U": [
    {
      "term": "UGC (User-Generated Content)",
      "desc": "Original content created by customers and fans rather than brands, including reviews, photos, videos, and testimonials that serve as authentic social proof and significantly boost engagement and trust"
    },
    {
      "term": "Understood the Assignment",
      "desc": "Popular social media slang acknowledging exceptional execution of a task, indicating someone exceeded expectations"
    },
    {
      "term": "Unified Inbox",
      "desc": "A centralized messaging hub that consolidates direct messages, comments, and mentions from multiple social media platforms into a single manageable interface for efficient community management"
    },
    {
      "term": "Unserious",
      "desc": "Intentionally lighthearted, playful content that builds authentic connections through humor and relatability"
    },
    {
      "term": "URL Shortener",
      "desc": "A tool converting long URLs into shorter links while redirecting users to the original destination"
    },
    {
      "term": "URL Tracking",
      "desc": "Process of monitoring and analyzing how users interact with links to gather data on campaign performance"
    },
    {
      "term": "User Engagement",
      "desc": "The quality and depth of interaction between users and digital content, measured through likes, comments, shares"
    },
    {
      "term": "User-Friendly Interface",
      "desc": "A design approach prioritizing ease of use, accessibility, and intuitive navigation for digital experiences"
    },
    {
      "term": "UTM (Urchin Tracking Module)",
      "desc": "Special text snippets added to URLs that help track the effectiveness of online marketing campaigns"
    }
  ],
  "V": [
    {
      "term": "Vanity Metrics",
      "desc": "Data points that appear impressive but provide little insight into actual business performance or strategic value"
    },
    {
      "term": "Vibe Check",
      "desc": "A social concept used to assess someone's emotional energy or the overall atmosphere of a situation"
    },
    {
      "term": "Video Editing Tools",
      "desc": "Software applications enabling users to manipulate footage, add effects, text, and audio to create polished video content"
    },
    {
      "term": "Video Marketing",
      "desc": "The strategic use of video content across social media platforms to promote brands, products, or services, engage audiences, drive conversions, and build brand awareness through formats like Reels, Shorts, and live streams"
    },
    {
      "term": "Viewership",
      "desc": "The total number of people who watch video content on social media, measured through views, watch time, completion rate, average view duration, and unique viewers"
    },
    {
      "term": "Viral",
      "desc": "Content that spreads rapidly through sharing, generating exponential visibility and engagement beyond the original audience"
    },
    {
      "term": "Virtual Event",
      "desc": "An online gathering hosted through social media platforms or integrated tools, including webinars, live streams, Q&A sessions, and virtual conferences that enable global participation"
    },
    {
      "term": "Visual Content Creation",
      "desc": "Process of designing and producing engaging images, videos, graphics, and other visual elements for marketing"
    },
    {
      "term": "Visual Identity",
      "desc": "The cohesive system of visual elements including colors, typography, imagery style, and design templates that represents a brand consistently across all social media platforms and touchpoints"
    },
    {
      "term": "Vlog",
      "desc": "A form of content where the primary medium is video rather than text, typically featuring conversational sharing of experiences"
    }
  ],
  "W": [
    {
      "term": "W (Win)",
      "desc": "Slang for \"win\" that originated in sports, now widely used to express approval, success, or positive outcomes"
    },
    {
      "term": "Webinar",
      "desc": "An interactive online event, workshop, or presentation delivered virtually via the internet with engagement features"
    },
    {
      "term": "WhatsApp Business",
      "desc": "A professional messaging application designed for businesses to communicate with customers at scale, share product catalogs, automate responses, and manage customer service conversations"
    },
    {
      "term": "White Label",
      "desc": "A product or service created by one company that is rebranded and sold by another, commonly used in social media management tools offered to agencies and resellers under their own brand name"
    },
    {
      "term": "Widget",
      "desc": "An embeddable component that displays social media content, feeds, or functionality on external websites, extending social media presence and engagement beyond native platforms"
    },
    {
      "term": "Workflow Automation",
      "desc": "Using technology to execute repetitive business processes according to predefined rules, eliminating manual intervention"
    },
    {
      "term": "Workflow Management",
      "desc": "Systematic organization and coordination of work processes to improve efficiency and collaboration within teams"
    },
    {
      "term": "WSG (What's Good)",
      "desc": "A casual greeting similar to \"What's up?\" that originated in AAVE and is widely used in digital communication"
    },
    {
      "term": "WTW (What's the Word)",
      "desc": "An internet acronym primarily meaning \"What's the Word?\" or \"What the What?\" for casual check-ins or surprise"
    },
    {
      "term": "WYF (Where You From)",
      "desc": "A social media acronym meaning \"Where You From?\" but can also stand for \"What You Feeling?\" depending on context"
    },
    {
      "term": "WYLL (What You Look Like)",
      "desc": "A social media acronym commonly used in direct messages to request photos or visual information"
    }
  ],
  "X": [
    {
      "term": "X (Twitter)",
      "desc": "A social media platform (formerly Twitter) for sharing short-form updates, news, and engaging in real-time conversations"
    },
    {
      "term": "X Premium",
      "desc": "The paid subscription service on X (formerly Twitter Blue) offering features like a verified badge, post editing, longer posts, priority ranking in replies, and increased algorithmic visibility"
    }
  ],
  "Y": [
    {
      "term": "YNS (Youngins)",
      "desc": "A popular social media slang term referring to younger people, particularly teenagers or those in their early twenties"
    },
    {
      "term": "YouTube Channel Management",
      "desc": "Strategic oversight of content planning, scheduling, optimization, analytics, and community engagement on YouTube"
    },
    {
      "term": "YouTube Shorts",
      "desc": "Short-form vertical videos up to 60 seconds on YouTube, designed to compete with TikTok and Instagram Reels as a platform for quick, engaging, mobile-first content creation and discovery"
    },
    {
      "term": "YouTube Studio",
      "desc": "YouTube's creator dashboard for managing channels, uploading and scheduling videos, viewing detailed analytics, managing comments, customizing channel settings, and monitoring monetization performance"
    }
  ],
  "Z": [
    {
      "term": "Zapier Integration",
      "desc": "Connecting social media management tools with other business applications through Zapier's automated workflows to streamline repetitive tasks like cross-posting, lead capture, and data synchronization"
    },
    {
      "term": "Zero-Party Data",
      "desc": "Information that customers intentionally and proactively share with a brand, including preferences and purchase intentions"
    },
    {
      "term": "Zoom Fatigue",
      "desc": "The mental exhaustion experienced from excessive video conferencing and virtual meetings, influencing social media content strategies toward asynchronous communication formats and shorter video content"
    }
  ]
};

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function getTotalCount(): number {
  return Object.values(TERMS_BY_LETTER).reduce((sum, terms) => sum + terms.length, 0);
}
