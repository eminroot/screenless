import type { Language, Localized } from '../i18n/types';
import type { ChatMessage, ChildProfile, Mission } from '../state/types';

/**
 * What the buddy says back.
 *
 * Every line in this file is written here, by hand, in three languages. There
 * is no model behind the chat and no request leaves the phone: whatever a
 * child types is matched against the keyword banks below and answered from the
 * banks below, and then it is forgotten.
 *
 * That is the whole point of the change that created this file. A chat box is
 * the one place in the app where a child can put anything they like into a
 * text field — a friend's name, where they live, what happened at school, the
 * thing they have not told anyone. Sending that to a third party so it can
 * come back as a friendlier sentence is a bad trade, and no safety setting on
 * the far end makes it a good one. The app already refuses to send counts it
 * does not need; it should not be posting a nine year old's sentences either.
 *
 * So this matches `src/data/spark-templates.ts`, which has always worked this
 * way and says why: it is a grammar, not a model. It runs in aeroplane mode, a
 * parent can be shown every line it is able to say, and the promise that
 * nobody knows what the app might tell their child is kept for the chat too.
 *
 * -------------------------------------------------------------------------
 * ADDING A LINE
 *
 * Write it in all three languages, in the same voice: short, warm, second
 * person, no questions the buddy cannot follow up on. A line may use
 * `{{buddy}}`, and the mission lines may use `{{mission}}`, `{{minutes}}` and
 * `{{stars}}` — those are only filled when a mission is actually assigned, so
 * every mission intent needs a `none` variant for when there is no mission.
 *
 * Keep the banks at three variants or more. The reply is picked by how many
 * times the buddy has already spoken, so a short bank repeats itself inside
 * one conversation, which is exactly what makes a scripted buddy feel
 * scripted.
 */

export type Intent =
  | 'greeting'
  | 'mission'
  | 'missionDetail'
  | 'fun'
  | 'aboutYou'
  | 'feelingLow'
  | 'feelingGood'
  | 'thanks'
  | 'agree'
  | 'fallback';

/**
 * Words that pick an intent, lowercased and matched as substrings.
 *
 * Substrings rather than whole words on purpose: Turkish and Azerbaijani glue
 * their endings on, so `sıkıl` has to catch `sıkıldım`, `sıkılıyorum` and
 * `sıkıldı` without three entries. English gets the same treatment for free.
 *
 * Order matters. `match` walks the intents in the order listed in `ORDER` and
 * takes the first hit, so the specific ones are tried before the general.
 */
const KEYWORDS: Record<Exclude<Intent, 'fallback'>, string[]> = {
  greeting: [
    'hello', 'hi ', 'hey', 'good morning', 'good evening',
    'merhaba', 'selam', 'günaydın', 'iyi akşam',
    'salam', 'sabahın xeyir', 'axşamın xeyir',
  ],
  missionDetail: [
    'how long', 'how many minutes', 'how many stars', 'what is the mission',
    'what is my mission', 'what do i have to do', 'what is this mission',
    'ne kadar sürer', 'kaç dakika', 'kaç yıldız', 'görev ne', 'görevim ne',
    'nə qədər çəkir', 'neçə dəqiqə', 'neçə ulduz', 'tapşırığım nədir', 'tapşırıq nədir',
  ],
  mission: [
    'what should i do', 'what can i do', 'bored', 'nothing to do', 'give me',
    'what now', 'another one', 'something to do',
    'ne yapayım', 'ne yapabilirim', 'sıkıl', 'canım sıkıl', 'başka bir şey', 'ne yapsam',
    'nə edim', 'nə edə bilərəm', 'darıx', 'canım sıxıl', 'başqa bir şey', 'nə etsəm',
  ],
  fun: [
    'fun', 'funny', 'joke', 'tell me something', 'fact', 'interesting',
    'eğlenceli', 'komik', 'şaka', 'bir şey anlat', 'ilginç', 'bilgi',
    'əyləncəli', 'gülməli', 'zarafat', 'bir şey danış', 'maraqlı', 'məlumat',
  ],
  aboutYou: [
    'who are you', 'how are you', 'your name', 'are you real', 'are you a robot',
    'do you sleep', 'what are you',
    'kimsin', 'nasılsın', 'adın ne', 'gerçek misin', 'robot musun', 'uyur musun', 'nesin',
    'kimsən', 'necəsən', 'adın nədir', 'əsl', 'robotsan', 'yatırsan', 'nəsən',
  ],
  feelingLow: [
    'sad', 'tired', 'angry', 'scared', 'lonely', 'upset', 'bad day', 'i hate',
    'üzgün', 'yorgun', 'kızgın', 'korkuyorum', 'yalnız', 'kötü bir gün', 'nefret',
    'kədərli', 'yorğun', 'əsəbi', 'qorxuram', 'tənha', 'pis gün', 'nifrət',
  ],
  feelingGood: [
    'happy', 'great', 'awesome', 'excited', 'i did it', 'good day', 'i won',
    'mutlu', 'harika', 'süper', 'heyecanlı', 'yaptım', 'güzel bir gün', 'kazandım',
    'xoşbəxt', 'əla', 'super', 'həyəcanlı', 'etdim', 'gözəl gün', 'qazandım',
  ],
  thanks: [
    'thank', 'thanks', 'cheers',
    'teşekkür', 'sağ ol', 'sağol', 'eyvallah',
    'çox sağ ol', 'təşəkkür',
  ],
  agree: [
    'ok', 'okay', 'yes', 'yeah', 'sure', 'no ', 'nope', 'maybe',
    'tamam', 'evet', 'olur', 'hayır', 'belki',
    'oldu', 'hə', 'bəli', 'yox', 'bəlkə',
  ],
};

/** Tried in this order; the first bank that matches wins. */
const ORDER: Exclude<Intent, 'fallback'>[] = [
  'missionDetail',
  'mission',
  'fun',
  'aboutYou',
  'feelingLow',
  'feelingGood',
  'thanks',
  'greeting',
  'agree',
];

export function intentOf(raw: string): Intent {
  // Lowercased twice, because neither set of rules is right for all three
  // languages. Turkish casing is what the tr and az banks need: it maps İ to
  // a dotted i, so "İyi akşamlar" matches. But it also maps a plain English
  // capital I to a dotless ı, which would turn "What should I do?" — the
  // most-pressed input in the whole app — into text that matches nothing at
  // all. Testing both forms costs one extra string and removes the class.
  const forms = [` ${raw.toLocaleLowerCase('tr')} `, ` ${raw.toLowerCase()} `];
  for (const intent of ORDER) {
    if (KEYWORDS[intent].some((word) => forms.some((form) => form.includes(word)))) {
      return intent;
    }
  }
  return 'fallback';
}

/* ------------------------------------------------------------------ banks */

/** Answers that do not depend on whether a mission is assigned. */
const REPLIES: Record<Exclude<Intent, 'mission' | 'missionDetail' | 'fun'>, Localized[]> = {
  greeting: [
    {
      en: 'Hey. Good to see you.',
      tr: 'Selam. Seni görmek güzel.',
      az: 'Salam. Səni görmək gözəldir.',
    },
    {
      en: 'Hello. What is happening today?',
      tr: 'Merhaba. Bugün neler oluyor?',
      az: 'Salam. Bu gün nələr olur?',
    },
    {
      en: 'There you are. I was waiting.',
      tr: 'İşte buradasın. Seni bekliyordum.',
      az: 'Budur, gəldin. Səni gözləyirdim.',
    },
  ],
  aboutYou: [
    {
      en: 'I am {{buddy}}. I live in here and I keep track of what you get up to.',
      tr: 'Ben {{buddy}}. Burada yaşıyorum ve neler yaptığını takip ediyorum.',
      az: 'Mən {{buddy}}. Burada yaşayıram və nələr etdiyini izləyirəm.',
    },
    {
      en: 'Good, now that you are here. I am better when you are moving about.',
      tr: 'Sen geldiğine göre iyiyim. Sen hareket edince daha iyi oluyorum.',
      az: 'Sən gəldiyinə görə yaxşıyam. Sən hərəkət edəndə daha yaxşı oluram.',
    },
    {
      en: 'I am {{buddy}}, and I am made of drawings. You are the real one here.',
      tr: 'Ben {{buddy}}, çizgilerden yapıldım. Buradaki gerçek olan sensin.',
      az: 'Mən {{buddy}}, rəsmlərdən düzəlmişəm. Buradakı əsl olan sənsən.',
    },
  ],
  feelingLow: [
    {
      en: 'That sounds heavy. Tell someone at home about it — they can help more than I can.',
      tr: 'Kulağa ağır geliyor. Evde birine anlat, o bana göre daha çok yardım edebilir.',
      az: 'Bu ağır səslənir. Evdə kiminsə ilə danış, o məndən çox kömək edə bilər.',
    },
    {
      en: 'Days go like that sometimes. Getting up and moving for five minutes helps more than it sounds like it would.',
      tr: 'Günler bazen böyle olur. Kalkıp beş dakika hareket etmek, sandığından çok iyi gelir.',
      az: 'Günlər bəzən belə olur. Qalxıb beş dəqiqə hərəkət etmək düşündüyündən çox kömək edir.',
    },
    {
      en: 'I am sorry. If it is a big one, go and tell a grown up you trust.',
      tr: 'Üzüldüm. Büyük bir şeyse, güvendiğin bir büyüğe anlat.',
      az: 'Üzüldüm. Böyük bir şeydirsə, güvəndiyin bir böyüyə danış.',
    },
  ],
  feelingGood: [
    {
      en: 'Good. That is the kind of day worth writing down.',
      tr: 'Güzel. Böyle bir gün yazmaya değer.',
      az: 'Gözəl. Belə bir gün yazmağa dəyər.',
    },
    {
      en: 'Nice one. Keep it going.',
      tr: 'Bravo. Böyle devam.',
      az: 'Afərin. Belə davam et.',
    },
    {
      en: 'That is the best thing you have said all day.',
      tr: 'Bugün söylediğin en güzel şey bu.',
      az: 'Bu gün dediyin ən gözəl şey budur.',
    },
  ],
  thanks: [
    { en: 'Any time.', tr: 'Ne zaman istersen.', az: 'İstədiyin vaxt.' },
    { en: 'That is what I am here for.', tr: 'Ben bunun için buradayım.', az: 'Mən bunun üçün buradayam.' },
    { en: 'You did the work. I just watched.', tr: 'İşi sen yaptın. Ben sadece izledim.', az: 'İşi sən gördün. Mən sadəcə baxdım.' },
  ],
  agree: [
    { en: 'Right. Off you go then.', tr: 'Tamam. Hadi başla o zaman.', az: 'Yaxşı. Onda başla.' },
    { en: 'Got it.', tr: 'Anladım.', az: 'Başa düşdüm.' },
    { en: 'Fair enough.', tr: 'Olur.', az: 'Oldu.' },
  ],
  fallback: [
    {
      en: 'I only know a few things, and that is not one of them. Ask me what to do instead.',
      tr: 'Ben sadece birkaç şey biliyorum, bu onlardan değil. Bana ne yapacağını sor.',
      az: 'Mən yalnız bir neçə şey bilirəm, bu onlardan deyil. Məndən nə edəcəyini soruş.',
    },
    {
      en: 'I did not follow that one. I am better at missions than at conversation.',
      tr: 'Bunu anlayamadım. Sohbetten çok göreve iyiyim.',
      az: 'Bunu başa düşmədim. Söhbətdən çox tapşırıqda yaxşıyam.',
    },
    {
      en: 'No idea. Try asking me for something to do.',
      tr: 'Hiç bilmiyorum. Bana yapacak bir şey sormayı dene.',
      az: 'Heç bilmirəm. Məndən görüləsi bir şey soruşmağa çalış.',
    },
  ],
};

/** "What should I do?" — with a mission in hand, and without one. */
const MISSION_REPLIES: { withMission: Localized[]; none: Localized[] } = {
  withMission: [
    {
      en: '{{mission}} is already waiting for you. {{minutes}} minutes, {{stars}} stars.',
      tr: '{{mission}} zaten seni bekliyor. {{minutes}} dakika, {{stars}} yıldız.',
      az: '{{mission}} artıq səni gözləyir. {{minutes}} dəqiqə, {{stars}} ulduz.',
    },
    {
      en: 'Do {{mission}}. It is {{minutes}} minutes and then you are done.',
      tr: '{{mission}} görevini yap. {{minutes}} dakika, sonra bitti.',
      az: '{{mission}} tapşırığını et. {{minutes}} dəqiqə, sonra bitdi.',
    },
    {
      en: 'You have one open: {{mission}}. Worth {{stars}} stars.',
      tr: 'Açık bir görevin var: {{mission}}. {{stars}} yıldız değerinde.',
      az: 'Açıq bir tapşırığın var: {{mission}}. {{stars}} ulduz dəyərində.',
    },
  ],
  none: [
    {
      en: 'Nothing assigned right now. Open Today and take a new one.',
      tr: 'Şu an görev yok. Bugün sekmesini aç ve yeni bir tane al.',
      az: 'Hazırda tapşırıq yoxdur. Bu gün bölməsini aç və yenisini götür.',
    },
    {
      en: 'Your list is empty. Go to Today and pick something.',
      tr: 'Listen boş. Bugün sekmesine git ve bir şey seç.',
      az: 'Siyahın boşdur. Bu gün bölməsinə get və nəsə seç.',
    },
    {
      en: 'No mission yet. Pick one up and I will keep count.',
      tr: 'Henüz görev yok. Bir tane al, ben sayarım.',
      az: 'Hələ tapşırıq yoxdur. Birini götür, mən sayaram.',
    },
  ],
};

/** "How long is it?" — the same split. */
const MISSION_DETAIL_REPLIES: { withMission: Localized[]; none: Localized[] } = {
  withMission: [
    {
      en: '{{mission}}. About {{minutes}} minutes, and it pays {{stars}} stars.',
      tr: '{{mission}}. Yaklaşık {{minutes}} dakika, {{stars}} yıldız kazandırır.',
      az: '{{mission}}. Təxminən {{minutes}} dəqiqə, {{stars}} ulduz qazandırır.',
    },
    {
      en: 'Give it {{minutes}} minutes. {{stars}} stars when you are done.',
      tr: '{{minutes}} dakikanı ver. Bitirince {{stars}} yıldız.',
      az: '{{minutes}} dəqiqəni ver. Bitirəndə {{stars}} ulduz.',
    },
    {
      en: '{{minutes}} minutes for {{stars}} stars. Open it and the steps are there.',
      tr: '{{stars}} yıldız için {{minutes}} dakika. Aç, adımlar içinde yazıyor.',
      az: '{{stars}} ulduz üçün {{minutes}} dəqiqə. Aç, addımlar içindədir.',
    },
  ],
  none: [
    {
      en: 'There is no mission open, so there is nothing to time yet.',
      tr: 'Açık görev yok, yani henüz süre tutacak bir şey yok.',
      az: 'Açıq tapşırıq yoxdur, deməli hələ vaxt tutulacaq bir şey yoxdur.',
    },
    {
      en: 'Nothing running at the moment. Take one from Today first.',
      tr: 'Şu an devam eden bir şey yok. Önce Bugün sekmesinden bir tane al.',
      az: 'Hazırda davam edən bir şey yoxdur. Əvvəlcə Bu gün bölməsindən birini götür.',
    },
    {
      en: 'You have not started one yet.',
      tr: 'Henüz bir tanesine başlamadın.',
      az: 'Hələ birinə başlamamısan.',
    },
  ],
};

/**
 * The fun bank.
 *
 * Deliberately the longest one: "tell me something fun" is one of the three
 * starter buttons, so it is the intent a child will hit most, and a bank of
 * three would be exhausted in a minute. These are all checkable facts rather
 * than jokes, because a fact survives being read a second time.
 */
const FUN_FACTS: Localized[] = [
  {
    en: 'An octopus has three hearts, and two of them stop when it swims. That is why it would rather walk.',
    tr: 'Ahtapotun üç kalbi var ve yüzerken ikisi duruyor. Bu yüzden yürümeyi tercih ediyor.',
    az: 'Ahtapotun üç ürəyi var və üzəndə ikisi dayanır. Buna görə yeriməyi üstün tutur.',
  },
  {
    en: 'Honey does not go off. Jars of it have been found in tombs three thousand years old and were still edible.',
    tr: 'Bal bozulmaz. Üç bin yıllık mezarlarda bulunan bal kavanozları hâlâ yenebilir durumdaydı.',
    az: 'Bal xarab olmur. Üç min illik məzarlarda tapılan bal qabları hələ də yeməli idi.',
  },
  {
    en: 'A day on Venus is longer than its year. It turns slower than it goes round the sun.',
    tr: "Venüs'te bir gün, bir yıldan uzun. Kendi etrafında, güneşin etrafında döndüğünden yavaş dönüyor.",
    az: 'Veneradа bir gün bir ildən uzundur. O, öz oxu ətrafında günəşin ətrafında fırlandığından yavaş fırlanır.',
  },
  {
    en: 'Your bones are about four times stronger than concrete of the same weight.',
    tr: 'Kemiklerin, aynı ağırlıktaki betondan yaklaşık dört kat güçlü.',
    az: 'Sümüklərin eyni çəkidəki betondan təxminən dörd dəfə güclüdür.',
  },
  {
    en: 'Bananas are berries. Strawberries are not.',
    tr: 'Muz bir meyve çeşidi olarak böğürtlen sınıfında. Çilek değil.',
    az: 'Banan giləmeyvədir. Çiyələk isə deyil.',
  },
  {
    en: 'A group of flamingos is called a flamboyance.',
    tr: 'Bir flamingo sürüsüne İngilizcede "flamboyance", yani gösteriş deniyor.',
    az: 'Bir flaminqo sürüsünə İngiliscə "flamboyance", yəni təmtəraq deyilir.',
  },
  {
    en: 'Sharks were swimming around before trees existed. They are older than rings on wood.',
    tr: 'Köpek balıkları, ağaçlar var olmadan önce yüzüyordu. Ağaç halkalarından eskiler.',
    az: 'Köpək balıqları ağaclar yaranmamışdan əvvəl üzürdülər. Onlar ağac halqalarından qədimdirlər.',
  },
  {
    en: 'The Eiffel Tower gets about fifteen centimetres taller in summer, because the iron expands.',
    tr: 'Eyfel Kulesi yazın yaklaşık on beş santim uzuyor, çünkü demir genleşiyor.',
    az: 'Eyfel qülləsi yayda təxminən on beş santimetr uzanır, çünki dəmir genişlənir.',
  },
  {
    en: 'Cats cannot taste sweet things at all. The part of the tongue that does it never developed.',
    tr: 'Kediler tatlıyı hiç tadamıyor. Dilin o işi yapan kısmı onlarda hiç gelişmemiş.',
    az: 'Pişiklər şirini heç dada bilmirlər. Dilin bu işi görən hissəsi onlarda inkişaf etməyib.',
  },
  {
    en: 'There is enough water in the air above you right now to fill a small bath, even on a dry day.',
    tr: 'Kuru bir günde bile, şu an tepende küçük bir küveti dolduracak kadar su var.',
    az: 'Quru bir gündə belə, indi başının üstündə kiçik bir vannanı dolduracaq qədər su var.',
  },
  {
    en: 'Wombat droppings are cube shaped, so they do not roll away.',
    tr: 'Vombatların dışkısı küp şeklinde, böylece yuvarlanıp gitmiyor.',
    az: 'Vombatların peyini kub şəklindədir, beləcə yuvarlanıb getmir.',
  },
  {
    en: 'A hummingbird beats its wings about fifty times a second. You cannot clap that fast.',
    tr: 'Sinek kuşu kanatlarını saniyede yaklaşık elli kez çırpıyor. O hızda alkışlayamazsın.',
    az: 'Milçəkquşu qanadlarını saniyədə təxminən əlli dəfə çalır. O sürətlə əl çala bilməzsən.',
  },
];

/* ---------------------------------------------------------------- picking */

/**
 * Which variant to use.
 *
 * Counted off how many times the buddy has already spoken rather than picked
 * at random, for two reasons: a child who sends the same starter twice gets a
 * different answer both times, which random picking cannot promise; and the
 * whole reply path stays a pure function of state, so a test can assert what
 * it will say.
 */
function pick<T>(bank: T[], turn: number): T {
  return bank[turn % bank.length];
}

function fill(line: string, values: Record<string, string>): string {
  return line.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => values[key] ?? whole);
}

export type ReplyInput = {
  /** What the child typed, already through `checkChildInput`. */
  text: string;
  profile: ChildProfile;
  language: Language;
  mission: Mission | null;
  /** The conversation so far, used only to count turns. */
  history: ChatMessage[];
};

/**
 * The buddy's answer. Pure, synchronous, and reaches nothing outside this
 * file — the chat screens add their own pause before showing it so the buddy
 * does not answer before the child's own message has finished animating in.
 */
export function buddyReply(input: ReplyInput): string {
  const { text, profile, language, mission, history } = input;
  const turn = history.filter((message) => message.role === 'buddy').length;
  const intent = intentOf(text);

  const values: Record<string, string> = {
    buddy: profile.buddyName,
    mission: mission ? mission.task.title[language] : '',
    minutes: mission ? String(mission.task.minutes) : '',
    stars: mission ? String(mission.task.stars) : '',
  };

  if (intent === 'fun') return fill(pick(FUN_FACTS, turn)[language], values);

  if (intent === 'mission' || intent === 'missionDetail') {
    const bank = intent === 'mission' ? MISSION_REPLIES : MISSION_DETAIL_REPLIES;
    const side = mission ? bank.withMission : bank.none;
    return fill(pick(side, turn)[language], values);
  }

  return fill(pick(REPLIES[intent], turn)[language], values);
}

/**
 * How long the buddy appears to think before answering.
 *
 * Entirely cosmetic — the reply is decided before the timer starts. It exists
 * because a reply painted in the same frame as the child's own message reads
 * as an echo rather than an answer, and because the typing indicator the three
 * chat screens already draw needs something to be true for.
 */
export const REPLY_DELAY_MS = 450;

/** `buddyReply` with that pause in front of it, which is what the screens want. */
export function thinkThenReply(input: ReplyInput): Promise<string> {
  const reply = buddyReply(input);
  return new Promise((resolve) => setTimeout(() => resolve(reply), REPLY_DELAY_MS));
}

/**
 * Every line the buddy can say, so a test can check all three languages are
 * filled in — and so the parent's library screen can one day show a family
 * the complete list, which is only possible because the list is finite.
 */
export function allReplyLines(): Localized[] {
  return [
    ...Object.values(REPLIES).flat(),
    ...MISSION_REPLIES.withMission,
    ...MISSION_REPLIES.none,
    ...MISSION_DETAIL_REPLIES.withMission,
    ...MISSION_DETAIL_REPLIES.none,
    ...FUN_FACTS,
  ];
}
