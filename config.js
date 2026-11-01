/* =====================================================================
   PAISAYUG — CONFIG (sirf yeh file edit karo)
   ---------------------------------------------------------------------
   GitHub pe: is file (config.js) ko kholo -> pencil icon (Edit) ->
   quotes "..." ke andar ka text badlo -> "Commit changes" dabao.
   1-2 minute mein website update ho jayegi.
   DHYAN RAHE: quotes " " aur comma , mat hatana.
   ===================================================================== */

window.PAISAYUG_CONFIG = {

  // ---- BASIC ----
  COURSE_NAME: "PaisaYug",
  TAGLINE: "Ghar Baithe Paise Kaise Kamaye — A-to-Z Course",

  // ---- PRICE (sirf number likho, ₹ mat lagao) ----
  PRICE: 99,          // asli price jo customer dega
  MRP: 999,           // kata hua (cut) price — offer dikhane ke liye

  // ---- PAYMENT ----
  UPI_ID: "editsbyb.work@okhdfcbank",   // <-- APNI UPI ID (badalni ho toh yahan)
  UPI_PAYEE_NAME: "PaisaYug",    // UPI app mein dikhne wala naam

  // ---- CONTACT ----
  WHATSAPP_NUMBER: "919370054439",  // country code ke saath, + aur space ke bina

  // ---- OFFER TIMER ----
  TIMER_MINUTES: 15,   // countdown kitne minute ka (khatam hote hi phir se shuru)
  SEATS_LEFT: 17,      // "sirf X seats bachi hain" wali line ka number

  // ---- HERO (sabse upar wala text) ----
  HEADLINE: "Ghar Baithe Paise Kaise Kamaye? A to Z Seekho — Sirf Phone Se",
  SUBHEADLINE: "Students, housewives, job wale — koi bhi. Zero investment se shuru karo: skills, freelancing, content, reselling aur affiliate — sab simple Hinglish mein, step by step.",

  // ---- COURSE MODULES (kya sikhoge) ----
  // Naya module: { title: "...", desc: "..." }, copy-paste karke add karo
  MODULES: [
    { title: "Ghar Baithe Kamai ka Sach",
      desc: "Kaunse tareeke asli hain, kaunse scam. Kahan se shuru karein, kitna time lagta hai — seedhi baat, bina jhoothe promise ke." },
    { title: "Zero Investment Setup",
      desc: "Sirf phone + free apps. UPI, email, basic tools — ek bhi rupaya lagaye bina pura setup." },
    { title: "Apni Earning Skill Chuno",
      desc: "Video editing, design, writing, typing, social media — tumhare liye best skill kaise pick karein aur free mein kaise seekhein." },
    { title: "Freelancing: Pehla Client",
      desc: "Instagram, Fiverr, LinkedIn pe profile banana, message/proposal likhna aur pehla paid kaam lena." },
    { title: "Content Creation se Kamai",
      desc: "Reels, Shorts, YouTube — niche chuno, content plan banao, aur followers se paisa kaise banta hai." },
    { title: "Reselling — Bina Stock ke",
      desc: "WhatsApp aur Instagram pe products resell karke margin kamana. Koi dukaan, koi stock nahi." },
    { title: "Affiliate Marketing",
      desc: "Amazon/Flipkart jaise product links share karke har sale pe commission — chhote account se bhi." },
    { title: "Pehli Kamai se Regular Income",
      desc: "Padhai/kaam ke saath daily routine, payment lena, pricing aur income ko har mahine badhane ka plan." }
  ],

  // ================================================================
  // ---- 3D BOOK (price box mein ghoomti hui book) ----
  // Book tap karne pe khulti hai: page 1-2 pe MODULES (upar wale) apne aap aate hain,
  // page 3 pe neeche wala text + "Book Abhi Kharido" button.
  // Band karna ho toh BOOK_ON: false — tab wahan purana countdown timer wapas aa jayega.
  // {PRICE} aur {MRP} likhoge toh apne aap price aa jayega.
  // ================================================================
  BOOK_ON: true,
  BOOK_TITLE: "PaisaYug — Ghar Baithe Paise Kamao A to Z",   // " — " ke pehle wala hissa bada naam banta hai
  BOOK_PAGE3_TITLE: "Ab sochna band karo.",
  BOOK_PAGE3_TEXT: "Jo log aaj shuru karte hain, wahi kal kamate hain. ₹{MRP} ki cheez sirf ₹{PRICE} mein — ek chai-samosa ke daam mein apni kamai ka raasta khol lo. Yeh book sach mein aapki soch aur kamai badal sakti hai.",

  // ---- AAPKO KYA MILEGA ----
  YOU_GET: [
    "Pura A-to-Z course — 8 modules, step by step",
    "Lifetime access — ek baar lo, hamesha dekho",
    "Simple Hinglish mein, beginner friendly",
    "Sirf phone chahiye — laptop ya investment nahi",
    "Future updates free",
    "Doubt ho toh WhatsApp support"
  ],

  // ================================================================
  // ---- HELP MASCOT (neeche right kone mein cute chamakta character) ----
  // Iski aankhein blink karti hain, idhar-udhar dekhti hain, smile karta hai,
  // haath hilata hai aur kabhi side mein jhaank ke message bolta hai.
  // Isko dabane pe customer seedha aapke WhatsApp pe aata hai.
  // Band karna ho toh ORB_ON: false likho.
  // ================================================================
  ORB_ON: true,
  ORB_WHATSAPP_TEXT: "Hi, PaisaYug course ke baare mein help chahiye",   // WhatsApp mein pehle se likha message
  ORB_FIRST_NUDGE_SECONDS: 5,     // page khulne ke kitne second baad pehla message aaye
  ORB_NUDGE_EVERY_SECONDS: 20,    // har kitne second mein haath hila ke naya message bole
  ORB_BUBBLE_SECONDS: 5,          // message kitne second dikhe, phir chhup jaye
  // Messages jo baari-baari bolega. {PRICE} likhoge toh apne aap price aa jayega.
  // Naya message: "..." quotes mein likho aur comma lagao. "fayda" / "buy" wale message pe
  // character side mein jhaank ke bolta hai.
  ORB_NUDGES: [
    "Hi! 👋 Koi doubt hai?",
    "Book buy kar lo, tumhara hi fayda hai 😉",
    "Sirf ₹{PRICE} mein! 🔥",
    "Koi doubt? WhatsApp karo 👋",
    "Offer khatam hone wala hai ⏳"
  ],

  // ================================================================
  // ---- COUPONS (discount codes) ----
  // Customer payment popup mein code daal ke "Apply" dabata hai — price khud kam ho jata hai,
  // aur QR + UPI button bhi naye amount ka ban jata hai. WhatsApp message mein
  // "Coupon: CODE" aur final "Amount" aata hai — paisa check karte waqt wahi amount match karna.
  //
  // Har coupon ka format:
  //   { code: "LAUNCH20", type: "percent", value: 20, expires: "2026-11-30", minPrice: 0, active: true },
  //   code     = jo customer type karega (capital/small se farak nahi padta)
  //   type     = "percent" (jaise 20% off)  YA  "flat" (jaise ₹10 off)
  //   value    = kitna off (percent mein number, ya rupaye mein)
  //   expires  = "YYYY-MM-DD" — us din raat 11:59 (India time) tak chalega, uske baad apne aap band
  //   minPrice = (optional) price kam se kam itna ho tabhi chalega; na chahiye toh hata do
  //   active   = true (chalu)  /  false (turant band — bina delete kiye)
  //
  // Naya coupon: neeche wali line copy karke paste karo, code/value/date badlo.
  // Coupon hatana: uski puri line delete karo, ya active: false kar do.
  // Expire karna: expires ki date aaj se pehle ki kar do.
  // Final price kabhi ₹1 se kam nahi hoga, aur hamesha pure rupaye mein round hoga.
  COUPONS: [
    { code: "BHAV20", type: "percent", value: 20, expires: "2026-11-30", active: true },
    { code: "BHAV10",  type: "flat",    value: 10, expires: "2026-12-31", active: true }
  ],
  COUPON_LINK_ON: true,   // price ke neeche "🎟️ Coupon code hai?" link dikhana hai? (false = chhupa do)

  // ================================================================
  // ---- "KYUN LEIN PAISAYUG?" SLIDER (har 3.5 second mein card badalta hai) ----
  // Jab tak REVIEWS (neeche) khaali hai, slider mein yeh HIGHLIGHTS dikhte hain —
  // yeh aapke course ke apne points hain (kisi customer ki baat nahi).
  // Format: { icon: "emoji", title: "badi line", text: "chhoti line" },
  // {PRICE} likhoge toh apne aap price aa jayega.
  // ================================================================
  HIGHLIGHTS: [
    { icon: "📱", title: "Sirf phone se shuru karo",        text: "Laptop ya mehenga setup nahi — phone aur internet, bas." },
    { icon: "💸", title: "₹0 investment wale tarike",        text: "Freelancing, content, reselling, affiliate — bina paisa lagaye." },
    { icon: "🧠", title: "Step-by-step, beginner friendly",  text: "Zero se shuru, simple Hinglish mein, ek-ek step." },
    { icon: "⚡", title: "Aaj padho, aaj se try karo",       text: "Har module ke baad seedha action — theory kam, kaam zyada." },
    { icon: "♾️", title: "Lifetime access, ek baar payment", text: "Sirf ₹{PRICE} ek baar. Jab chaho, jitni baar chaho dekho." },
    { icon: "🚩", title: "Scam aur fake tarikon se bacho",   text: "Kaunse tarike asli hain, kaunse dhokha — pehle hi saaf." },
    { icon: "🤝", title: "Doubt? WhatsApp pe pucho",          text: "Kahin atak gaye toh seedha WhatsApp karo, help milegi." }
  ],
  CAROUSEL_SECONDS: 3.5,   // har kitne second mein agla card aaye

  // ================================================================
  // ---- REVIEWS (sirf ASLI buyers ke) ----
  // Jaise hi yahan ek bhi review daaloge, upar wala slider apne aap
  // "Students kya bol rahe hain" ban jayega aur reviews WhatsApp-chat jaise
  // cards mein har 3.5 second mein badlenge. Hero mein chhoti review patti bhi aa jayegi.
  // Buyer se permission lekar hi daalo. Fake review mat daalna — consumer law ke against hai.
  //
  // FORMAT — neeche wali line copy karo, REVIEWS: [ ] ke andar paste karo,
  // har review ke baad comma lagao:
  //
  //   { name: "Rahul S.", city: "Pune", stars: 5, text: "Yahan buyer ke apne shabd, jaise WhatsApp pe bheje." },
  //
  // Example (2 reviews ke saath aisa dikhega):
  //   REVIEWS: [
  //     { name: "Rahul S.", city: "Pune", stars: 5, text: "..." },
  //     { name: "Priya K.", city: "Nagpur", stars: 4, text: "..." }
  //   ],
  //
  // name = buyer ka naam (chaho toh sirf first name + initial)
  // city = shehar,  stars = 1 se 5,  text = unke apne shabd (badalna mat)
  // (Upar wale naam sirf FORMAT samjhane ke liye hain — website pe nahi dikhenge.)
  // ================================================================
  REVIEWS: [],
  REVIEW_ROTATE_SECONDS: 4,       // hero wali chhoti review patti kitne second mein badle

  // ---- FAQ ----
  FAQ: [
    { q: "Course kaise milega?",
      a: "Payment ke baad form bharo. Payment verify hote hi private course link WhatsApp/email pe bhej diya jayega — usually 30 minute ke andar." },
    { q: "Payment safe hai?",
      a: "Haan. Aap seedha UPI (GPay, PhonePe, Paytm, BHIM) se pay karte ho. Hum aapse koi card details ya OTP kabhi nahi maangte." },
    { q: "Main bilkul beginner hoon, samajh aayega?",
      a: "Haan, course zero se shuru hota hai. Koi experience ya laptop nahi chahiye — sirf phone aur internet." },
    { q: "Kya main student hoon toh kar sakta/sakti hoon?",
      a: "Bilkul. Course students ko dhyan mein rakh ke bana hai — padhai ke saath roz 1-2 ghante dekar shuru kar sakte ho. Koi investment nahi chahiye." },
    { q: "Access kitne din ka hai?",
      a: "Lifetime. Ek baar link mil gaya toh jab chaho tab dekho." },
    { q: "Kya income ki guarantee hai?",
      a: "Nahi — koi bhi honest course guarantee nahi de sakta. Course aapko sahi raasta aur skills deta hai; result aapki mehnat aur consistency pe depend karta hai." },
    { q: "Payment kar diya par link nahi aaya?",
      a: "Neeche diye WhatsApp button pe apna UTR number bhejo, hum turant check karke link bhej denge." },
    { q: "Refund milega?",
      a: "Yeh digital course hai, isliye access milne ke baad refund nahi hota. Agar link na mile ya koi problem ho, toh WhatsApp karo — hum solve karenge." }
  ]
};
/* ===================== CONFIG KHATAM ===================== */
