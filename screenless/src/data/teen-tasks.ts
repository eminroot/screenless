import type { LibraryTask } from './tasks';

/**
 * The 10-13 curriculum.
 *
 * Emin's four strands, five each: personal goals and self-management, physical
 * wellbeing, real life projects, and contributing at home. His brief for the
 * age is the design: "daha müstəqil, məqsədyönlü və seçim əsaslı", and
 * constant parental approval "yeniyetmədə nəzarət hissi yarada bilər", so
 * self-report, behaviour data and a selective audit work together.
 *
 * What that means in the app (`engine/verify.ts`, policy `self`):
 *
 * - **Nothing waits for a parent.** A finished challenge is done when they say
 *   it is done. What the record keeps is whether the phone's own measurements
 *   backed it up (`by: 'app'`) or whether it rests on their word
 *   (`by: 'self'`), and the parent reads that log afterwards rather than
 *   approving items one at a time.
 * - **Their own words are the task** in the goals strand, so those missions
 *   carry a `note`. What is written stays on their side: the parent area never
 *   shows it and the export strips it. A teenager who thinks a parent is
 *   reading their reflection writes nothing worth reading.
 * - **Behaviour data is the other half**: the focus block is the phone lying
 *   face down for eighteen of its twenty minutes, the walk is counted
 *   movement, the steps are steps.
 * - **A grown up is only asked where the activity is genuinely risky**, which
 *   in this list is cooking. That is the whole of "valideyn yalnız riskli
 *   fəaliyyətlərdə təsdiqləyici olur".
 * - **Physical targets are capped and never compared.** Nothing here asks for
 *   more than 1,500 steps or twelve counted minutes of movement, nothing
 *   escalates week on week, and no mission measures a body. `test-tasks.ts`
 *   holds the ceiling so a later idea cannot quietly raise it.
 */
export const teenTasks: LibraryTask[] = [
  /* ================================== 3.1 personal goals and self-management */
  {
    id: 'teen-goal-three',
    category: 'calm',
    minutes: 5,
    stars: 7,
    emoji: '🎯',
    interests: [],
    ageBands: ['10-13'],
    partsOfDay: ['morning'],
    title: { en: 'Three goals for today', tr: 'Bugün için üç hedef', az: 'Bu gün üçün üç məqsəd' },
    body: {
      en: 'Write down three things you actually mean to do today. Real ones, not a wish list.',
      tr: 'Bugün gerçekten yapmayı düşündüğün üç şeyi yaz. Gerçekçi olsun, dilek listesi değil.',
      az: 'Bu gün həqiqətən etmək istədiyin üç şeyi yaz. Real olsun, arzu siyahısı yox.',
    },
    note: {
      prompt: { en: 'One goal per line', tr: 'Her satıra bir hedef', az: 'Hər sətirdə bir məqsəd' },
      placeholder: {
        en: 'Finish the history reading\nRun before dinner\nText Deniz back',
        tr: 'Tarih okumasını bitir\nAkşam yemeğinden önce koş\nDeniz’e dön',
        az: 'Tarix mövzusunu bitir\nAxşam yeməyindən əvvəl qaç\nDənizə cavab yaz',
      },
      lines: 3,
      minChars: 20,
    },
    checks: [{ kind: 'note' }, { kind: 'clock', minutes: 3 }],
  },
  {
    id: 'teen-goal-focus',
    category: 'calm',
    minutes: 25,
    stars: 24,
    emoji: '⏳',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'A 20 minute focus block', tr: '20 dakikalık odak bloğu', az: '20 dəqiqəlik fokus bloku' },
    body: {
      en: 'Pick one thing, put the phone face down and work on it for twenty minutes. No tabs, no checking.',
      tr: 'Tek bir iş seç, telefonu yüzüstü koy ve yirmi dakika ona çalış. Sekme yok, kontrol yok.',
      az: 'Bir iş seç, telefonu üzüaşağı qoy və iyirmi dəqiqə onun üzərində işlə. Nə tab, nə yoxlama.',
    },
    tip: {
      en: 'Twenty minutes is the block. Stopping at nineteen still beats not starting.',
      tr: 'Blok yirmi dakika. On dokuzda bırakmak bile başlamamaktan iyidir.',
      az: 'Blok iyirmi dəqiqədir. On doqquzda dayanmaq belə başlamamaqdan yaxşıdır.',
    },
    check: {
      question: { en: 'How did that go?', tr: 'Nasıl gitti?', az: 'Necə keçdi?' },
      options: [
        { en: 'Deep in it', tr: 'Tamamen daldım', az: 'Tam qapıldım' },
        { en: 'Drifted a bit', tr: 'Biraz dağıldım', az: 'Bir az yayındım' },
        { en: 'Fought it the whole time', tr: 'Baştan sona zorlandım', az: 'Əvvəldən sona çətin oldu' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 20 }, { kind: 'away', minutes: 18 }, { kind: 'answer' }],
  },
  {
    id: 'teen-goal-plan',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🗒️',
    interests: [],
    ageBands: ['10-13'],
    partsOfDay: ['evening'],
    title: { en: 'Tomorrow, on paper', tr: 'Yarın, kağıt üstünde', az: 'Sabah, kağız üzərində' },
    body: {
      en: 'Plan tomorrow on paper: what has to happen, in what order, and where the gaps are.',
      tr: 'Yarını kağıda planla: ne olmak zorunda, hangi sırayla ve boşluklar nerede.',
      az: 'Sabahı kağız üzərində planla: nə olmalıdır, hansı ardıcıllıqla və boşluqlar haradadır.',
    },
    steps: [
      {
        en: 'List everything tomorrow already owes: school, training, jobs at home.',
        tr: 'Yarının şimdiden borçlu olduğu her şeyi yaz: okul, antrenman, evdeki işler.',
        az: 'Sabahın artıq borclu olduğu hər şeyi yaz: məktəb, məşq, evdəki işlər.',
      },
      {
        en: 'Put them in the order the day will actually take them.',
        tr: 'Günün gerçekten alacağı sıraya diz.',
        az: 'Günün həqiqətən alacağı ardıcıllıqla düz.',
      },
      {
        en: 'Mark the two gaps where your own things fit.',
        tr: 'Kendi işlerinin sığdığı iki boşluğu işaretle.',
        az: 'Öz işlərinin sığdığı iki boşluğu işarələ.',
      },
    ],
    note: {
      prompt: {
        en: 'The one thing tomorrow stands or falls on',
        tr: 'Yarının üstünde döndüğü tek şey',
        az: 'Sabahın üstündə döndüyü tək şey',
      },
      minChars: 10,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'teen-goal-screenfree',
    category: 'calm',
    minutes: 5,
    stars: 7,
    emoji: '📉',
    interests: [],
    ageBands: ['10-13'],
    tool: 'weekGoal',
    title: {
      en: 'Set your screen free target',
      tr: 'Ekransız hedefini belirle',
      az: 'Ekransız hədəfini təyin et',
    },
    body: {
      en: 'Pick how many screen free minutes you want this week. Your number, not anyone else’s. The app measures the real one next to it.',
      tr: 'Bu hafta kaç dakika ekransız kalmak istediğini seç. Senin sayın, başkasının değil. Uygulama gerçekleşeni yanına koyar.',
      az: 'Bu həftə neçə dəqiqə ekransız qalmaq istədiyini seç. Sənin rəqəmin, başqasının yox. Tətbiq real rəqəmi onun yanına qoyur.',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'Screen free minutes this week',
        tr: 'Bu hafta ekransız dakika',
        az: 'Bu həftə ekransız dəqiqə',
      },
      min: 30,
      max: 420,
      goal: 30,
    },
    note: {
      prompt: {
        en: 'What goes in that time instead',
        tr: 'O zamanın yerine ne geçecek',
        az: 'Həmin vaxtın yerinə nə keçəcək',
      },
      minChars: 10,
    },
    checks: [{ kind: 'answer' }, { kind: 'note' }, { kind: 'clock', minutes: 2 }],
  },
  {
    id: 'teen-goal-habit',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🪫',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'The habit that eats your time',
      tr: 'Zamanını yiyen alışkanlık',
      az: 'Vaxtını yeyən vərdiş',
    },
    body: {
      en: 'Name the thing that takes the most time you did not mean to give it, and write down what you will do instead when it starts.',
      tr: 'Vermeyi düşünmediğin zamanı en çok alan şeyi yaz ve o başladığında bunun yerine ne yapacağını not et.',
      az: 'Vermək istəmədiyin vaxtı ən çox alan şeyi yaz və o başlayanda onun əvəzinə nə edəcəyini qeyd et.',
    },
    note: {
      prompt: {
        en: 'Line one: the habit. Line two: what you do instead.',
        tr: 'Birinci satır: alışkanlık. İkinci satır: yerine ne yapacaksın.',
        az: 'Birinci sətir: vərdiş. İkinci sətir: əvəzinə nə edəcəksən.',
      },
      lines: 2,
      minChars: 20,
    },
    checks: [{ kind: 'note' }, { kind: 'clock', minutes: 5 }, { kind: 'away', minutes: 4 }],
  },

  /* ============================================== 3.2 physical wellbeing */
  {
    id: 'teen-body-walk',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '🚶',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'Fifteen minutes, quick pace', tr: 'On beş dakika, hızlı tempo', az: 'On beş dəqiqə, sürətli temp' },
    body: {
      en: 'Walk for fifteen minutes at a pace you could not hold a long conversation at. Phone in your pocket.',
      tr: 'On beş dakika, uzun bir sohbeti sürdüremeyeceğin tempoda yürü. Telefon cebinde.',
      az: 'On beş dəqiqə, uzun söhbəti davam etdirə bilməyəcəyin templə yeri. Telefon cibində.',
    },
    checks: [{ kind: 'active', minutes: 12 }],
  },
  {
    id: 'teen-body-steps',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '👣',
    interests: [],
    ageBands: ['10-13'],
    title: { en: '1,500 steps', tr: '1.500 adım', az: '1.500 addım' },
    body: {
      en: 'A short target, not a big one: fifteen hundred steps, whenever it suits you today.',
      tr: 'Büyük değil, küçük bir hedef: bin beş yüz adım, bugün sana ne zaman uyarsa.',
      az: 'Böyük yox, kiçik hədəf: min beş yüz addım, bu gün sənə nə vaxt uyğun gəlsə.',
    },
    checks: [{ kind: 'steps', count: 1500 }],
  },
  {
    id: 'teen-body-stretch',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🧘',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'Ten minutes of stretching', tr: 'On dakika esneme', az: 'On dəqiqə dartınma' },
    body: {
      en: 'Ten slow minutes on whatever is tight. Hold each one long enough to get boring.',
      tr: 'Gergin olan neresiyse on yavaş dakika. Her birini sıkıcı gelecek kadar tut.',
      az: 'Harada gərginlik varsa, on yavaş dəqiqə. Hər birini darıxdırıcı olana qədər saxla.',
    },
    pick: {
      question: { en: 'What did you stretch?', tr: 'Neyi esnettin?', az: 'Nəyi dartdın?' },
      options: [
        { en: 'Neck and shoulders', tr: 'Boyun ve omuzlar', az: 'Boyun və çiyinlər' },
        { en: 'Back', tr: 'Sırt', az: 'Bel' },
        { en: 'Hips', tr: 'Kalça', az: 'Bud' },
        { en: 'Hamstrings', tr: 'Arka bacak', az: 'Arxa ayaq' },
        { en: 'Calves', tr: 'Baldır', az: 'Baldır' },
        { en: 'Wrists', tr: 'Bilekler', az: 'Biləklər' },
      ],
      min: 3,
    },
    checks: [{ kind: 'clock', minutes: 8 }, { kind: 'picked', count: 3 }, { kind: 'away', minutes: 6 }],
  },
  {
    id: 'teen-body-ball',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '🏀',
    interests: ['football'],
    ageBands: ['10-13'],
    mode: 'duo',
    title: { en: 'Ball game with someone', tr: 'Biriyle top oyunu', az: 'Biri ilə top oyunu' },
    body: {
      en: 'Get someone at home outside for a ball game. Phone in a zipped pocket so it can count the moving.',
      tr: 'Evden birini top oyunu için dışarı çıkar. Telefon fermuarlı cepte, hareketi sayabilsin.',
      az: 'Evdən birini top oyunu üçün çölə çıxar. Telefon fermuarlı cibdə olsun ki, hərəkəti saya bilsin.',
    },
    parentBrief: {
      en: 'A ball game together, outside if you can. Their phone counts the movement; you can also sign it off with your parent code.',
      tr: 'Birlikte bir top oyunu, mümkünse dışarıda. Telefon hareketi sayar; isterseniz ebeveyn kodunuzla da onaylayabilirsiniz.',
      az: 'Birlikdə top oyunu, mümkünsə çöldə. Telefon hərəkəti sayır; istəsəniz valideyn kodunuzla da təsdiqləyə bilərsiniz.',
    },
    checks: [{ kind: 'either', of: [{ kind: 'active', minutes: 8 }, { kind: 'grownup' }] }],
  },
  {
    id: 'teen-body-break',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '🔄',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'Break the sitting', tr: 'Oturmayı böl', az: 'Oturmağı böl' },
    body: {
      en: 'You have been sitting a while. Five minutes of anything that is not sitting: stairs, a lap outside, press-ups.',
      tr: 'Bir süredir oturuyorsun. Oturmak dışında beş dakika: merdiven, dışarıda bir tur, şınav.',
      az: 'Bir müddətdir oturursan. Oturmaqdan başqa beş dəqiqə: pilləkən, çöldə bir dövrə, təkan.',
    },
    checks: [{ kind: 'active', minutes: 3 }],
  },

  /* ============================================== 3.3 real life projects */
  {
    id: 'teen-project-budget',
    category: 'create',
    minutes: 15,
    stars: 16,
    emoji: '💰',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'A budget that is yours', tr: 'Sana ait bir bütçe', az: 'Sənə aid büdcə' },
    body: {
      en: 'Work out your own month: what comes in, what goes out, what is left, and what the rest is for.',
      tr: 'Kendi ayını çıkar: ne giriyor, ne çıkıyor, ne kalıyor ve kalan ne için.',
      az: 'Öz ayını hesabla: nə gəlir, nə gedir, nə qalır və qalan nə üçündür.',
    },
    steps: [
      {
        en: 'Write down everything that comes in, and how often.',
        tr: 'Giren her şeyi ve ne sıklıkla girdiğini yaz.',
        az: 'Gələn hər şeyi və nə tezliklə gəldiyini yaz.',
      },
      {
        en: 'List what goes out, biggest first.',
        tr: 'Çıkanları en büyükten başlayarak listele.',
        az: 'Çıxanları ən böyükdən başlayaraq siyahıya al.',
      },
      {
        en: 'Subtract. Decide what the number that is left is for.',
        tr: 'Çıkar. Kalan sayının ne için olduğuna karar ver.',
        az: 'Çıx. Qalan rəqəmin nə üçün olduğuna qərar ver.',
      },
    ],
    note: {
      prompt: {
        en: 'In, out, left over',
        tr: 'Giren, çıkan, kalan',
        az: 'Gələn, gedən, qalan',
      },
      lines: 3,
      minChars: 15,
    },
    checks: [{ kind: 'clock', minutes: 10 }, { kind: 'note' }, { kind: 'away', minutes: 8 }],
  },
  {
    id: 'teen-project-desk',
    category: 'create',
    minutes: 20,
    stars: 20,
    emoji: '🗂️',
    interests: [],
    ageBands: ['10-13'],
    place: 'indoor',
    beforePhoto: true,
    title: { en: 'Rebuild your desk', tr: 'Masanı yeniden kur', az: 'Masanı yenidən qur' },
    body: {
      en: 'Reorganise the place you actually work, so the things you use daily are the things in reach.',
      tr: 'Gerçekten çalıştığın yeri yeniden düzenle: her gün kullandıkların elinin altında olsun.',
      az: 'Həqiqətən işlədiyin yeri yenidən təşkil et: hər gün istifadə etdiklərin əlinin altında olsun.',
    },
    pick: {
      question: { en: 'What changed?', tr: 'Ne değişti?', az: 'Nə dəyişdi?' },
      options: [
        { en: 'Cleared everything off first', tr: 'Önce hepsini boşalttım', az: 'Əvvəlcə hamısını boşaltdım' },
        { en: 'Threw out what was dead', tr: 'İşe yaramazları attım', az: 'Yararsızları atdım' },
        { en: 'Daily things within reach', tr: 'Her günlükler el altında', az: 'Hər günlüklər əlimin altında' },
        { en: 'Cables sorted', tr: 'Kablolar toparlandı', az: 'Kabellər yığışdı' },
        { en: 'Wiped it down', tr: 'Sildim', az: 'Silib təmizlədim' },
      ],
      min: 2,
    },
    checks: [
      { kind: 'clock', minutes: 12 },
      { kind: 'picked', count: 2 },
      { kind: 'either', of: [{ kind: 'photo' }, { kind: 'away', minutes: 10 }] },
    ],
  },
  {
    id: 'teen-project-recycle',
    category: 'create',
    minutes: 20,
    stars: 20,
    emoji: '♻️',
    interests: ['science'],
    ageBands: ['10-13'],
    title: {
      en: 'Something useful out of the bin',
      tr: 'Çöpten çıkan işe yarar bir şey',
      az: 'Zibildən çıxan faydalı bir şey',
    },
    body: {
      en: 'Take something that was on its way out and make it into something you will actually use.',
      tr: 'Atılmak üzere olan bir şeyi al ve gerçekten kullanacağın bir şeye dönüştür.',
      az: 'Atılmaq üzrə olan bir şeyi götür və həqiqətən istifadə edəcəyin bir şeyə çevir.',
    },
    steps: [
      {
        en: 'Pick the material and decide what it will become.',
        tr: 'Malzemeyi seç ve neye dönüşeceğine karar ver.',
        az: 'Materialı seç və nəyə çevriləcəyinə qərar ver.',
      },
      { en: 'Build it.', tr: 'Yap.', az: 'Düzəlt.' },
      {
        en: 'Put it where it will be used and use it once.',
        tr: 'Kullanılacağı yere koy ve bir kere kullan.',
        az: 'İstifadə olunacağı yerə qoy və bir dəfə istifadə et.',
      },
    ],
    note: {
      prompt: { en: 'What it was, what it is now', tr: 'Neydi, şimdi ne oldu', az: 'Nə idi, indi nə oldu' },
      minChars: 12,
    },
    checks: [
      { kind: 'clock', minutes: 12 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'photo' }, { kind: 'away', minutes: 10 }] },
    ],
  },
  {
    id: 'teen-project-rota',
    category: 'social',
    minutes: 15,
    stars: 16,
    emoji: '📋',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'A rota the family will use', tr: 'Ailenin kullanacağı bir çizelge', az: 'Ailənin istifadə edəcəyi cədvəl' },
    body: {
      en: 'Draw up the week’s jobs and who does them, then put it in front of the family and see if it survives.',
      tr: 'Haftanın işlerini ve kimin yapacağını çıkar, sonra aileye göster ve dayanıyor mu bak.',
      az: 'Həftənin işlərini və kimin görəcəyini çıxar, sonra ailəyə göstər və dayanırmı bax.',
    },
    steps: [
      { en: 'List the jobs the week actually needs.', tr: 'Haftanın gerçekten ihtiyacı olan işleri listele.', az: 'Həftənin həqiqətən ehtiyacı olan işləri yaz.' },
      {
        en: 'Split them so nobody, including you, gets the worst of it.',
        tr: 'Kimseye, sana da, en kötüsü düşmeyecek şekilde paylaştır.',
        az: 'Heç kimə, sənə də, ən pisi düşməyəcək şəkildə böl.',
      },
      {
        en: 'Show it to the family and change what they argue with.',
        tr: 'Aileye göster ve itiraz ettiklerini değiştir.',
        az: 'Ailəyə göstər və etiraz etdiklərini dəyiş.',
      },
    ],
    note: {
      prompt: { en: 'Who ended up with what', tr: 'Kime ne düştü', az: 'Kimə nə düşdü' },
      minChars: 12,
    },
    checks: [
      { kind: 'clock', minutes: 8 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'photo' }, { kind: 'away', minutes: 6 }] },
    ],
  },
  {
    id: 'teen-project-cook',
    category: 'create',
    minutes: 30,
    stars: 26,
    emoji: '🍳',
    interests: ['cooking'],
    ageBands: ['10-13'],
    place: 'indoor',
    mode: 'duo',
    title: { en: 'Cook it with an adult', tr: 'Bir yetişkinle pişir', az: 'Böyüklə birlikdə bişir' },
    body: {
      en: 'Cook one simple recipe end to end with an adult in the kitchen. You do the cooking; they are there for the hot parts.',
      tr: 'Mutfakta bir yetişkinle basit bir tarifi baştan sona pişir. Pişiren sensin; sıcak kısımlar için onlar orada.',
      az: 'Mətbəxdə böyüklə birlikdə sadə bir resepti başdan sona bişir. Bişirən sənsən; isti hissələr üçün onlar yanındadır.',
    },
    parentBrief: {
      en: 'Hot pans and knives, so this is one of the few you sign off. Stay in the kitchen, let them do the cooking, and enter your parent code at the end.',
      tr: 'Sıcak tava ve bıçak var; bu yüzden onayladığınız birkaç görevden biri. Mutfakta kalın, pişirmeyi onlara bırakın ve sonunda ebeveyn kodunuzu girin.',
      az: 'İsti qab və bıçaq var, ona görə bu, təsdiqlədiyiniz bir neçə tapşırıqdan biridir. Mətbəxdə qalın, bişirməyi onlara həvalə edin və sonda valideyn kodunuzu daxil edin.',
    },
    checks: [{ kind: 'clock', minutes: 15 }, { kind: 'grownup' }],
  },

  /* ===================================== 3.4 contributing at home */
  {
    id: 'teen-family-unprompted',
    category: 'social',
    minutes: 12,
    stars: 13,
    emoji: '🫱',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'One job, nobody asked',
      tr: 'Kimse söylemeden bir iş',
      az: 'Heç kim deməmiş bir iş',
    },
    body: {
      en: 'Do a household job before anybody reminds you. The whole point is that nobody had to.',
      tr: 'Kimse hatırlatmadan bir ev işi yap. Bütün mesele kimsenin söylemek zorunda kalmaması.',
      az: 'Heç kim xatırlatmadan bir ev işi gör. Bütün məsələ heç kimin deməli olmamasıdır.',
    },
    pick: {
      question: { en: 'Which job?', tr: 'Hangi iş?', az: 'Hansı iş?' },
      options: [
        { en: 'Washing up', tr: 'Bulaşık', az: 'Qab-qacaq' },
        { en: 'Bins or recycling', tr: 'Çöp ya da geri dönüşüm', az: 'Zibil və ya təkrar emal' },
        { en: 'Laundry', tr: 'Çamaşır', az: 'Paltar' },
        { en: 'Floors', tr: 'Yerler', az: 'Döşəmə' },
        { en: 'Shopping carried or put away', tr: 'Alışveriş taşımak ya da yerleştirmek', az: 'Alış-verişi daşımaq və ya yerləşdirmək' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
      min: 1,
    },
    checks: [{ kind: 'clock', minutes: 6 }, { kind: 'picked', count: 1 }, { kind: 'away', minutes: 5 }],
  },
  {
    id: 'teen-family-table',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '🍽️',
    interests: [],
    ageBands: ['10-13'],
    place: 'indoor',
    partsOfDay: ['evening'],
    title: { en: 'Clear up after the meal', tr: 'Yemekten sonra topla', az: 'Yeməkdən sonra yığışdır' },
    body: {
      en: 'Take the table apart after a meal: plates away, surfaces clear, kitchen better than you found it.',
      tr: 'Yemekten sonra masayı kaldır: tabaklar yerine, tezgâh temiz, mutfak bulduğundan iyi.',
      az: 'Yeməkdən sonra masanı yığışdır: boşqablar yerinə, səthlər təmiz, mətbəx tapdığından yaxşı.',
    },
    pick: {
      question: { en: 'How far did you take it?', tr: 'Nereye kadar götürdün?', az: 'Haraya qədər apardın?' },
      options: [
        { en: 'Cleared the table', tr: 'Masayı boşalttım', az: 'Masanı boşaltdım' },
        { en: 'Washed or loaded up', tr: 'Yıkadım ya da makineye koydum', az: 'Yudum və ya maşına yığdım' },
        { en: 'Wiped the surfaces', tr: 'Tezgâhı sildim', az: 'Səthləri sildim' },
        { en: 'Leftovers put away', tr: 'Artanları kaldırdım', az: 'Qalanları yığışdırdım' },
        { en: 'Swept the floor', tr: 'Yeri süpürdüm', az: 'Yeri süpürdüm' },
      ],
      min: 2,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'picked', count: 2 },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 5 }] },
    ],
  },
  {
    id: 'teen-family-tutor',
    category: 'social',
    minutes: 20,
    stars: 20,
    emoji: '📐',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Sit with a younger one',
      tr: 'Küçük biriyle otur',
      az: 'Kiçik biri ilə otur',
    },
    body: {
      en: 'Help a younger brother, sister or cousin with something they are stuck on. Explain it, do not do it for them.',
      tr: 'Küçük kardeşine ya da kuzenine takıldığı bir konuda yardım et. Anlat, onun yerine yapma.',
      az: 'Kiçik bacına, qardaşına və ya qohum uşağına ilişib qaldığı mövzuda kömək et. İzah et, onun yerinə etmə.',
    },
    note: {
      prompt: {
        en: 'What you went through with them',
        tr: 'Onunla neyi çalıştın',
        az: 'Onunla nəyi keçdin',
      },
      minChars: 10,
    },
    checks: [
      { kind: 'clock', minutes: 12 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 10 }] },
    ],
  },
  {
    id: 'teen-family-roomplan',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🛏️',
    interests: [],
    ageBands: ['10-13'],
    place: 'indoor',
    title: { en: 'A plan for your own room', tr: 'Kendi odan için bir plan', az: 'Öz otağın üçün plan' },
    body: {
      en: 'Write a plan for keeping your room in order this week: three jobs, three days, small enough to actually happen.',
      tr: 'Bu hafta odanı düzenli tutmak için bir plan yaz: üç iş, üç gün, gerçekten olacak kadar küçük.',
      az: 'Bu həftə otağını səliqəli saxlamaq üçün plan yaz: üç iş, üç gün, həqiqətən olacaq qədər kiçik.',
    },
    note: {
      prompt: {
        en: 'One job and its day per line',
        tr: 'Her satıra bir iş ve günü',
        az: 'Hər sətirdə bir iş və günü',
      },
      lines: 3,
      minChars: 20,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'teen-family-screenfree',
    category: 'social',
    minutes: 30,
    stars: 26,
    emoji: '📵',
    interests: [],
    ageBands: ['10-13'],
    mode: 'duo',
    partsOfDay: ['evening'],
    title: {
      en: 'Run a screen free hour',
      tr: 'Ekransız bir saat yönet',
      az: 'Ekransız bir saat təşkil et',
    },
    body: {
      en: 'You organise it: pick the thing, tell the family when, and get every screen down for half an hour.',
      tr: 'Organize eden sensin: ne yapılacağını seç, aileye saati söyle ve yarım saat boyunca bütün ekranları indir.',
      az: 'Təşkil edən sənsən: nə ediləcəyini seç, ailəyə vaxtı de və yarım saat bütün ekranları kənara qoy.',
    },
    parentBrief: {
      en: 'They are running this one, so let them. Phones down for half an hour; their phone counts the quiet time and your code signs it off.',
      tr: 'Bunu onlar yönetiyor, bırakın yönetsinler. Yarım saat telefonlar aşağıda; telefonları sessiz zamanı sayar, kodunuz onaylar.',
      az: 'Bunu onlar təşkil edir, qoy etsinlər. Yarım saat telefonlar kənarda; telefonları sakit vaxtı sayır, kodunuz təsdiqləyir.',
    },
    checks: [{ kind: 'away', minutes: 20 }, { kind: 'grownup' }],
  },

  /* ============================ 3.5 reading, research and critical thinking */
  /*
   * The strand his brief asks an AI to mark, and the one place the app
   * deliberately does not.
   *
   * "AI fikrin doğru olub-olmadığını deyil, əsaslandırmanın mövcudluğunu
   * yoxlayır" — the check is that reasoning is *there*, not that it is right.
   * That is a length and shape test, and length and shape are measurable on
   * the phone without sending a word anywhere. Sending a thirteen year old's
   * private reflection to Google to be graded would break the promise the note
   * already makes (`NoteSpec`: the parent area never shows it and the export
   * strips it) in exchange for a verdict nobody wanted. So `note` carries the
   * conclusion, `minChars` and `lines` carry the rubric, and no model reads it.
   */
  {
    id: 'teen-read-sources',
    category: 'calm',
    minutes: 15,
    stars: 16,
    emoji: '⚖️',
    interests: ['books', 'science'],
    ageBands: ['10-13'],
    title: {
      en: 'Two sources, one question',
      tr: 'İki kaynak, tek soru',
      az: 'İki mənbə, bir sual',
    },
    body: {
      en: 'Pick something you actually want to know. Find two sources that disagree about it and work out where exactly they part company.',
      tr: 'Gerçekten merak ettiğin bir şey seç. Onun hakkında anlaşamayan iki kaynak bul ve tam olarak nerede ayrıldıklarını çıkar.',
      az: 'Həqiqətən bilmək istədiyin bir şey seç. Bu barədə razılaşmayan iki mənbə tap və dəqiq harada ayrıldıqlarını üzə çıxar.',
    },
    steps: [
      {
        en: 'Write the question first, in one line.',
        tr: 'Önce soruyu tek satırda yaz.',
        az: 'Əvvəlcə sualı bir sətirdə yaz.',
      },
      {
        en: 'Read both. Note who is saying it and why they might.',
        tr: 'İkisini de oku. Kimin söylediğini ve neden söylemiş olabileceğini not al.',
        az: 'İkisini də oxu. Kimin dediyini və niyə deyə biləcəyini qeyd et.',
      },
      {
        en: 'Find the one sentence where they actually contradict each other.',
        tr: 'Gerçekten çeliştikleri tek cümleyi bul.',
        az: 'Həqiqətən ziddiyyətə düşdükləri bir cümləni tap.',
      },
    ],
    note: {
      prompt: {
        en: 'Where they disagree, and which you find more solid',
        tr: 'Nerede ayrılıyorlar ve hangisi sana daha sağlam geliyor',
        az: 'Harada ayrılırlar və hansı sənə daha möhkəm gəlir',
      },
      placeholder: {
        en: 'They disagree about…\nI trust the second one more because…',
        tr: 'Şu konuda ayrılıyorlar…\nİkincisine daha çok güveniyorum çünkü…',
        az: 'Bu məsələdə ayrılırlar…\nİkinciyə daha çox inanıram, çünki…',
      },
      minChars: 60,
    },
    checks: [{ kind: 'clock', minutes: 10 }, { kind: 'note' }],
  },
  {
    id: 'teen-read-fifteen',
    category: 'calm',
    minutes: 20,
    stars: 20,
    emoji: '📖',
    interests: ['books'],
    ageBands: ['10-13'],
    title: {
      en: 'Fifteen minutes, three ideas',
      tr: 'On beş dakika, üç fikir',
      az: 'On beş dəqiqə, üç fikir',
    },
    body: {
      en: 'Read a book for fifteen minutes with the phone face down. Then write the three ideas worth keeping.',
      tr: 'Telefon yüzüstü, on beş dakika kitap oku. Sonra saklamaya değer üç fikri yaz.',
      az: 'Telefon üzüaşağı, on beş dəqiqə kitab oxu. Sonra saxlamağa dəyər üç fikri yaz.',
    },
    tip: {
      en: 'Three ideas, not three summaries. One line each is plenty.',
      tr: 'Üç fikir, üç özet değil. Her biri bir satır yeter.',
      az: 'Üç fikir, üç xülasə yox. Hər biri bir sətir bəsdir.',
    },
    note: {
      prompt: { en: 'One idea per line', tr: 'Her satıra bir fikir', az: 'Hər sətirdə bir fikir' },
      lines: 3,
      minChars: 40,
    },
    checks: [{ kind: 'clock', minutes: 15 }, { kind: 'away', minutes: 13 }, { kind: 'note' }],
  },
  {
    id: 'teen-read-claim',
    category: 'calm',
    minutes: 12,
    stars: 14,
    emoji: '🔍',
    interests: ['science'],
    ageBands: ['10-13'],
    title: {
      en: 'Is that actually true?',
      tr: 'Bu gerçekten doğru mu?',
      az: 'Bu həqiqətən doğrudur?',
    },
    body: {
      en: 'Take a claim you have run into this week and work out how much weight it can carry. Who said it, how would they know, and who gains if you believe it.',
      tr: 'Bu hafta karşına çıkan bir iddiayı al ve ne kadar ağırlık taşıyabileceğini çıkar. Kim söyledi, nereden biliyor olabilir ve inanırsan kim kazanır.',
      az: 'Bu həftə qarşına çıxan bir iddianı götür və nə qədər ağırlıq daşıya bildiyini üzə çıxar. Kim dedi, haradan bilə bilər və inansan kim qazanır.',
    },
    pick: {
      question: {
        en: 'What did you check?',
        tr: 'Neyi kontrol ettin?',
        az: 'Nəyi yoxladın?',
      },
      options: [
        { en: 'Who said it', tr: 'Kimin söylediğini', az: 'Kimin dediyini' },
        { en: 'How they would know', tr: 'Nereden bildiğini', az: 'Haradan bildiyini' },
        { en: 'Whether anyone else says it', tr: 'Başkasının da söyleyip söylemediğini', az: 'Başqasının da deyib-demədiyini' },
        { en: 'Who gains if I believe it', tr: 'İnanırsam kimin kazandığını', az: 'İnansam kimin qazandığını' },
        { en: 'When it was said', tr: 'Ne zaman söylendiğini', az: 'Nə vaxt deyildiyini' },
      ],
      min: 2,
    },
    note: {
      prompt: {
        en: 'What you landed on, and why',
        tr: 'Neye vardın ve neden',
        az: 'Nəyə gəldin və niyə',
      },
      minChars: 40,
    },
    checks: [{ kind: 'clock', minutes: 8 }, { kind: 'picked', count: 2 }, { kind: 'note' }],
  },
  {
    id: 'teen-read-advert',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '📣',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'How the advert works on you',
      tr: 'Reklam sana nasıl çalışıyor',
      az: 'Reklam sənə necə işləyir',
    },
    body: {
      en: 'Pick one advert you have seen a lot. Work out what it is actually promising, and which feeling it is aiming at.',
      tr: 'Çok gördüğün bir reklam seç. Aslında ne vaat ettiğini ve hangi duyguyu hedeflediğini çöz.',
      az: 'Çox gördüyün bir reklamı seç. Əslində nə vəd etdiyini və hansı hissi hədəflədiyini anla.',
    },
    pick: {
      question: {
        en: 'What is it leaning on?',
        tr: 'Neye yükleniyor?',
        az: 'Nəyə söykənir?',
      },
      options: [
        { en: 'Being left out', tr: 'Dışarıda kalmaya', az: 'Kənarda qalmağa' },
        { en: 'Someone you want to be like', tr: 'Benzemek istediğin birine', az: 'Bənzəmək istədiyin birinə' },
        { en: 'Hurry, before it goes', tr: 'Acele et, bitiyor', az: 'Tələs, qurtarır' },
        { en: 'Everyone else already has it', tr: 'Herkeste zaten var', az: 'Hamıda artıq var' },
        { en: 'It will fix something about you', tr: 'Sendeki bir şeyi düzeltecek', az: 'Səndəki nəyisə düzəldəcək' },
      ],
      min: 1,
    },
    note: {
      prompt: {
        en: 'What it promises, and what it actually sells',
        tr: 'Ne vaat ediyor ve gerçekte ne satıyor',
        az: 'Nə vəd edir və əslində nə satır',
      },
      minChars: 40,
    },
    checks: [{ kind: 'clock', minutes: 6 }, { kind: 'picked', count: 1 }, { kind: 'note' }],
  },
  {
    id: 'teen-read-character',
    category: 'calm',
    minutes: 12,
    stars: 13,
    emoji: '🎭',
    interests: ['books'],
    ageBands: ['10-13'],
    title: {
      en: 'Would you have done that?',
      tr: 'Sen olsan yapar mıydın?',
      az: 'Sən olsan edərdin?',
    },
    body: {
      en: 'Take a decision a character made in something you have read or watched. Say whether it was the right call, and argue it properly.',
      tr: 'Okuduğun ya da izlediğin bir şeydeki bir karakterin kararını al. Doğru karar mıydı, gerekçesiyle savun.',
      az: 'Oxuduğun və ya izlədiyin bir şeydə personajın verdiyi qərarı götür. Düzgün qərar idi? Əsaslandıraraq müdafiə et.',
    },
    tip: {
      en: 'There is no right answer here. There is only an answer with a reason under it.',
      tr: 'Burada doğru cevap yok. Sadece altında gerekçesi olan bir cevap var.',
      az: 'Burada düzgün cavab yoxdur. Yalnız altında əsası olan cavab var.',
    },
    note: {
      prompt: {
        en: 'Their decision, your verdict, your reason',
        tr: 'Onun kararı, senin hükmün, senin gerekçen',
        az: 'Onun qərarı, sənin hökmün, sənin əsasın',
      },
      minChars: 50,
    },
    checks: [{ kind: 'clock', minutes: 8 }, { kind: 'note' }],
  },

  /* ================================= 3.6 creativity and self-expression */
  /*
   * "Orijinallığa yarış balı verilmir" — nothing here is scored on how good it
   * is. Every mission in this strand pays the same stars whatever comes out,
   * the checks only establish that the time was spent and the thing exists,
   * and the closing question asks what they liked rather than how it went.
   */
  {
    id: 'teen-make-write',
    category: 'create',
    minutes: 20,
    stars: 20,
    emoji: '✍️',
    interests: ['books', 'drawing'],
    ageBands: ['10-13'],
    title: { en: 'Write the thing', tr: 'Şu şeyi yaz', az: 'O şeyi yaz' },
    body: {
      en: 'A short story or a poem, your choice. Nobody is marking it and nobody has to read it.',
      tr: 'Kısa bir hikaye ya da bir şiir, sen seç. Kimse not vermiyor, kimsenin okuması da gerekmiyor.',
      az: 'Qısa hekayə və ya şeir, seçim sənindir. Heç kim qiymətləndirmir, heç kimin oxuması da lazım deyil.',
    },
    note: {
      prompt: { en: 'Write it here', tr: 'Buraya yaz', az: 'Bura yaz' },
      lines: 5,
      minChars: 80,
    },
    check: {
      question: {
        en: 'What do you like most in it?',
        tr: 'İçinde en çok neyi beğendin?',
        az: 'İçində ən çox nəyi bəyəndin?',
      },
      options: [
        { en: 'One line in particular', tr: 'Özellikle bir satır', az: 'Xüsusilə bir sətir' },
        { en: 'How it ends', tr: 'Nasıl bittiği', az: 'Necə bitdiyi' },
        { en: 'That it exists at all', tr: 'Var olması', az: 'Ümumiyyətlə mövcud olması' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 12 }, { kind: 'note' }, { kind: 'answer' }],
  },
  {
    id: 'teen-make-comic',
    category: 'create',
    minutes: 25,
    stars: 24,
    emoji: '🗯️',
    interests: ['drawing'],
    ageBands: ['10-13'],
    place: 'indoor',
    proof: 'photo',
    objects: ['paper', 'pencil'],
    title: { en: 'One page of comic', tr: 'Bir sayfa çizgi roman', az: 'Bir səhifə komiks' },
    body: {
      en: 'Draw one full page: panels, speech, the lot. Stick figures are allowed and always have been.',
      tr: 'Tam bir sayfa çiz: kareler, konuşmalar, hepsi. Çöp adam serbest, hep serbestti.',
      az: 'Tam bir səhifə çək: kadrlar, danışıqlar, hamısı. Çöp adam olar, həmişə olub.',
    },
    steps: [
      {
        en: 'Divide the page into panels before you draw anything.',
        tr: 'Bir şey çizmeden önce sayfayı karelere böl.',
        az: 'Bir şey çəkməzdən əvvəl səhifəni kadrlara böl.',
      },
      {
        en: 'Work out the last panel first. Then aim at it.',
        tr: 'Önce son kareyi çöz. Sonra ona doğru git.',
        az: 'Əvvəlcə son kadrı həll et. Sonra ona doğru get.',
      },
      {
        en: 'Fill them in. Speech last.',
        tr: 'Kareleri doldur. Konuşmalar en son.',
        az: 'Kadrları doldur. Danışıqlar ən sonda.',
      },
    ],
    check: {
      question: {
        en: 'Which panel came out best?',
        tr: 'Hangi kare en iyi çıktı?',
        az: 'Hansı kadr ən yaxşı alındı?',
      },
      options: [
        { en: 'The first', tr: 'İlki', az: 'Birincisi' },
        { en: 'One in the middle', tr: 'Ortadakilerden biri', az: 'Ortadakilərdən biri' },
        { en: 'The last', tr: 'Sonuncusu', az: 'Sonuncusu' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 15 }, { kind: 'photo' }, { kind: 'answer' }],
  },
  {
    id: 'teen-make-rhythm',
    category: 'create',
    minutes: 12,
    stars: 13,
    emoji: '🥁',
    interests: ['music'],
    ageBands: ['10-13'],
    title: { en: 'A rhythm with no app', tr: 'Uygulamasız bir ritim', az: 'Tətbiqsiz bir ritm' },
    body: {
      en: 'Build a rhythm out of whatever is in the room: a table, a pen, a cup, your hands. Keep it going for a minute without losing it.',
      tr: 'Odadakilerle bir ritim kur: masa, kalem, bardak, ellerin. Bir dakika boyunca kaçırmadan sürdür.',
      az: 'Otaqdakılarla bir ritm qur: masa, qələm, stəkan, əllərin. Bir dəqiqə itirmədən davam etdir.',
    },
    tip: {
      en: 'Four beats, then change one of them. That is most songs.',
      tr: 'Dört vuruş, sonra birini değiştir. Şarkıların çoğu bu.',
      az: 'Dörd vuruş, sonra birini dəyiş. Mahnıların çoxu budur.',
    },
    check: {
      question: {
        en: 'What did you end up playing it on?',
        tr: 'Sonunda neyin üstünde çaldın?',
        az: 'Sonda nəyin üstündə çaldın?',
      },
      options: [
        { en: 'The table', tr: 'Masada', az: 'Masada' },
        { en: 'Something in the kitchen', tr: 'Mutfaktan bir şeyde', az: 'Mətbəxdən bir şeydə' },
        { en: 'Just my hands', tr: 'Sadece ellerimle', az: 'Sadəcə əllərimlə' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 8 }, { kind: 'away', minutes: 6 }, { kind: 'answer' }],
  },
  {
    id: 'teen-make-scene',
    category: 'create',
    minutes: 12,
    stars: 14,
    emoji: '🪟',
    interests: ['nature', 'books'],
    ageBands: ['10-13'],
    title: {
      en: 'Describe it instead of photographing it',
      tr: 'Fotoğrafını çekmek yerine anlat',
      az: 'Şəklini çəkmək yerinə təsvir et',
    },
    body: {
      en: 'Find something worth looking at and do not photograph it. Write it down instead, well enough that someone else could see it.',
      tr: 'Bakmaya değer bir şey bul ve fotoğrafını çekme. Onun yerine, başkası görebilecek kadar iyi yaz.',
      az: 'Baxmağa dəyər bir şey tap və şəklini çəkmə. Əvəzinə, başqası görə biləcək qədər yaxşı yaz.',
    },
    tip: {
      en: 'The camera takes ten seconds and you never look again. Writing it takes ten minutes and you keep it.',
      tr: 'Fotoğraf on saniye sürer ve bir daha bakmazsın. Yazmak on dakika sürer ve elinde kalır.',
      az: 'Şəkil on saniyə çəkir və bir daha baxmırsan. Yazmaq on dəqiqə çəkir və əlində qalır.',
    },
    note: {
      prompt: {
        en: 'What is there, and what it is like',
        tr: 'Orada ne var ve nasıl',
        az: 'Orada nə var və necədir',
      },
      minChars: 80,
    },
    checks: [{ kind: 'clock', minutes: 8 }, { kind: 'away', minutes: 5 }, { kind: 'note' }],
  },
  {
    id: 'teen-make-game',
    category: 'create',
    minutes: 25,
    stars: 24,
    emoji: '🎲',
    interests: ['building', 'science'],
    ageBands: ['10-13'],
    place: 'indoor',
    proof: 'photo',
    objects: ['paper', 'pencil'],
    title: { en: 'Invent the rules', tr: 'Kuralları uydur', az: 'Qaydaları uydur' },
    body: {
      en: 'Design a board or card game of your own and write the rules down properly. Someone who has never seen it should be able to play.',
      tr: 'Kendi masa ya da kart oyununu tasarla ve kurallarını düzgün yaz. Hiç görmemiş biri oynayabilmeli.',
      az: 'Öz stolüstü və ya kart oyununu dizayn et və qaydalarını düzgün yaz. Heç görməyən biri oynaya bilməlidir.',
    },
    steps: [
      {
        en: 'Decide how somebody wins. Everything else follows from that.',
        tr: 'Önce nasıl kazanıldığını belirle. Gerisi ondan çıkar.',
        az: 'Əvvəlcə necə udulduğunu müəyyən et. Qalanı ondan çıxır.',
      },
      {
        en: 'Write the rules out, numbered.',
        tr: 'Kuralları numaralandırarak yaz.',
        az: 'Qaydaları nömrələyərək yaz.',
      },
      {
        en: 'Play one round yourself and fix what breaks.',
        tr: 'Kendin bir tur oyna ve bozulan yeri düzelt.',
        az: 'Özün bir tur oyna və pozulan yeri düzəlt.',
      },
    ],
    check: {
      question: {
        en: 'What broke when you played it?',
        tr: 'Oynayınca ne bozuldu?',
        az: 'Oynayanda nə pozuldu?',
      },
      options: [
        { en: 'It was over too fast', tr: 'Çok çabuk bitti', az: 'Çox tez bitdi' },
        { en: 'It went on forever', tr: 'Bitmek bilmedi', az: 'Bitmək bilmədi' },
        { en: 'A rule made no sense', tr: 'Bir kural anlamsızdı', az: 'Bir qayda mənasız idi' },
        { en: 'Nothing, it worked', tr: 'Hiçbir şey, çalıştı', az: 'Heç nə, işlədi' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 15 }, { kind: 'photo' }, { kind: 'answer' }],
  },

  /* ================================ 3.7 social connection and communication */
  /*
   * "Danışığın səsi yazılmır və məzmunu analiz edilmir" — nothing in this
   * strand listens. What is measured is that the phone was down for the length
   * of it, and the other person can sign it off if they are there, which is
   * why every `grownup` here sits inside an `either` rather than being
   * required: a friend is not a grown up, and a conversation that only counts
   * when a parent witnesses it is not a conversation.
   */
  {
    id: 'teen-talk-family',
    category: 'social',
    minutes: 12,
    stars: 14,
    emoji: '🫖',
    interests: [],
    ageBands: ['10-13'],
    partsOfDay: ['evening'],
    title: {
      en: 'Ten minutes, no phones',
      tr: 'On dakika, telefon yok',
      az: 'On dəqiqə, telefonsuz',
    },
    body: {
      en: 'Sit with someone in your family and talk for ten minutes with both phones out of reach. Not about school.',
      tr: 'Ailenden biriyle otur ve iki telefon da uzaktayken on dakika konuş. Okul hakkında değil.',
      az: 'Ailəndən biri ilə otur və hər iki telefon uzaqda ikən on dəqiqə danış. Məktəb haqqında yox.',
    },
    note: {
      prompt: {
        en: 'What you ended up talking about',
        tr: 'Sonunda ne konuştunuz',
        az: 'Sonda nədən danışdınız',
      },
      minChars: 15,
    },
    checks: [
      { kind: 'clock', minutes: 10 },
      { kind: 'away', minutes: 9 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 10 }] },
    ],
  },
  {
    id: 'teen-talk-invite',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '🤙',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Ask them out to do something',
      tr: 'Bir şey yapmaya çağır',
      az: 'Nəyəsə dəvət et',
    },
    body: {
      en: 'Message a friend and propose something you would do in person. A real thing, a real day, not "we should hang out sometime".',
      tr: 'Bir arkadaşına yaz ve yüz yüze yapacağınız bir şey öner. Gerçek bir şey, gerçek bir gün, "bir ara takılalım" değil.',
      az: 'Bir dostuna yaz və üz-üzə edəcəyiniz nəyisə təklif et. Real bir şey, real bir gün, "nə vaxtsa görüşərik" yox.',
    },
    tip: {
      en: 'Name the thing and name the day. Vague invitations are how nothing happens.',
      tr: 'Şeyi de, günü de söyle. Belirsiz davetler hiçbir şeyin olmama yoludur.',
      az: 'Həm şeyi, həm günü de. Qeyri-müəyyən dəvətlər heç nəyin olmamasının yoludur.',
    },
    note: {
      prompt: {
        en: 'What you suggested, and when',
        tr: 'Ne önerdin ve ne zamana',
        az: 'Nə təklif etdin və nə vaxta',
      },
      minChars: 20,
    },
    checks: [{ kind: 'clock', minutes: 5 }, { kind: 'note' }],
  },
  {
    id: 'teen-talk-memory',
    category: 'social',
    minutes: 15,
    stars: 16,
    emoji: '📻',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Ask them what they were like',
      tr: 'Nasıl biri olduğunu sor',
      az: 'Necə biri olduğunu soruş',
    },
    body: {
      en: 'Ask an older person in your family for one memory from when they were your age. Then ask the follow up question.',
      tr: 'Ailendeki büyüklerden birine, senin yaşındayken yaşadığı bir anıyı sor. Sonra da devamını sor.',
      az: 'Ailəndəki böyüklərdən birinə, sənin yaşında ikən yaşadığı bir xatirəni soruş. Sonra da davamını soruş.',
    },
    tip: {
      en: 'The second question is where the real story is. Almost nobody asks it.',
      tr: 'Asıl hikaye ikinci soruda. Neredeyse kimse sormaz.',
      az: 'Əsl hekayə ikinci sualdadır. Demək olar heç kim soruşmur.',
    },
    note: {
      prompt: {
        en: 'The memory, in a few lines',
        tr: 'Anı, birkaç satırda',
        az: 'Xatirə, bir neçə sətirdə',
      },
      minChars: 50,
    },
    checks: [
      { kind: 'clock', minutes: 10 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 8 }] },
    ],
  },
  {
    id: 'teen-talk-boardgame',
    category: 'social',
    minutes: 30,
    stars: 26,
    emoji: '♟️',
    interests: [],
    ageBands: ['10-13'],
    place: 'indoor',
    title: {
      en: 'A game across a table',
      tr: 'Masa başında bir oyun',
      az: 'Masa arxasında bir oyun',
    },
    body: {
      en: 'Play a board or card game with someone in the same room. Phones somewhere else for the whole thing.',
      tr: 'Aynı odadaki biriyle masa ya da kart oyunu oyna. Telefonlar oyun boyunca başka bir yerde.',
      az: 'Eyni otaqdakı biri ilə stolüstü və ya kart oyunu oyna. Telefonlar oyun boyu başqa yerdə.',
    },
    check: {
      question: {
        en: 'How did it go?',
        tr: 'Nasıl gitti?',
        az: 'Necə keçdi?',
      },
      options: [
        { en: 'I won', tr: 'Ben kazandım', az: 'Mən uddum' },
        { en: 'They won', tr: 'O kazandı', az: 'O uddu' },
        { en: 'We never finished', tr: 'Bitiremedik', az: 'Bitirə bilmədik' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 20 },
      { kind: 'away', minutes: 18 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 22 }] },
    ],
  },
  {
    id: 'teen-talk-ifeel',
    category: 'social',
    minutes: 10,
    stars: 13,
    emoji: '💬',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Say it as "I felt"',
      tr: '"Ben hissettim" diye söyle',
      az: '"Mən hiss etdim" kimi de',
    },
    body: {
      en: 'Take a disagreement you are actually in and put your side as one sentence that starts "I felt". No "you always", no "you never".',
      tr: 'Şu an içinde olduğun bir anlaşmazlığı al ve kendi tarafını "ben hissettim" diye başlayan tek cümleyle kur. "Sen hep" yok, "sen asla" yok.',
      az: 'Hazırda içində olduğun bir mübahisəni götür və öz tərəfini "mən hiss etdim" ilə başlayan bir cümlə ilə qur. "Sən həmişə" yox, "sən heç vaxt" yox.',
    },
    tip: {
      en: 'Nobody can argue with what you felt. They can argue all day with what they always do.',
      tr: 'Ne hissettiğinle kimse tartışamaz. Hep ne yaptığıyla günlerce tartışır.',
      az: 'Nə hiss etdiyinlə heç kim mübahisə edə bilməz. Həmişə nə etdiyi ilə günlərlə edər.',
    },
    note: {
      prompt: {
        en: 'Your sentence',
        tr: 'Cümlen',
        az: 'Cümlən',
      },
      placeholder: {
        en: 'I felt … when …',
        tr: 'Ben … hissettim, … olduğunda',
        az: 'Mən … hiss etdim, … olanda',
      },
      minChars: 25,
    },
    checks: [{ kind: 'clock', minutes: 5 }, { kind: 'note' }],
  },

  /* ================================= 3.8 noticing your own digital behaviour */
  /*
   * The strand about the phone, done on the phone, which is the trap.
   *
   * His verification asks for app usage and notification state. Screen Guard
   * can read exactly that on Android — but it is behind `extra.screenGuard`,
   * off by default, and unavailable on iOS by Apple's design. Building this
   * strand on it would mean five challenges that silently never verify on an
   * ordinary build. So they rest on what every build measures — the clock and
   * how long the phone stayed face down — plus the child's own account. When
   * the guard flag is on, its figures strengthen the same missions rather than
   * being required by them.
   *
   * "Mesajların, paylaşımların və şəxsi məzmunun oxunması aparılmır": nothing
   * here reads a message, a feed or a notification's contents, and nothing
   * ever will.
   */
  {
    id: 'teen-screen-why',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🤔',
    interests: [],
    ageBands: ['10-13'],
    partsOfDay: ['evening'],
    title: {
      en: 'Three times you picked it up',
      tr: 'Telefonu aldığın üç an',
      az: 'Telefonu götürdüyün üç an',
    },
    body: {
      en: 'Think back over today and catch three moments you unlocked your phone. Write down what you were actually after each time.',
      tr: 'Bugünü geri sar ve telefonunu açtığın üç anı yakala. Her seferinde aslında ne aradığını yaz.',
      az: 'Bu günü geri sar və telefonunu açdığın üç anı tut. Hər dəfə əslində nə axtardığını yaz.',
    },
    tip: {
      en: '"Nothing in particular" is a real answer and the most common one.',
      tr: '"Özel bir şey değil" gerçek bir cevap ve en yaygın olanı.',
      az: '"Xüsusi bir şey yox" real cavabdır və ən çox rast gəlinənidir.',
    },
    note: {
      prompt: {
        en: 'One moment per line: what you wanted',
        tr: 'Her satıra bir an: ne istiyordun',
        az: 'Hər sətirdə bir an: nə istəyirdin',
      },
      lines: 3,
      minChars: 30,
    },
    checks: [{ kind: 'clock', minutes: 5 }, { kind: 'note' }],
  },
  {
    id: 'teen-screen-before',
    category: 'calm',
    minutes: 8,
    stars: 10,
    emoji: '🌀',
    interests: [],
    ageBands: ['10-13'],
    partsOfDay: ['evening'],
    title: {
      en: 'What came before the long one',
      tr: 'Uzun olandan önce ne vardı',
      az: 'Uzun olandan əvvəl nə var idi',
    },
    body: {
      en: 'Find today’s longest stretch on the phone. Now work out what you were feeling in the minute before it started.',
      tr: 'Bugün telefonda geçirdiğin en uzun süreyi bul. Şimdi başlamadan önceki dakikada ne hissettiğini çıkar.',
      az: 'Bu gün telefonda keçirdiyin ən uzun müddəti tap. İndi başlamazdan əvvəlki dəqiqədə nə hiss etdiyini üzə çıxar.',
    },
    check: {
      question: {
        en: 'What was it, just before?',
        tr: 'Hemen öncesinde neydi?',
        az: 'Elə əvvəlində nə idi?',
      },
      options: [
        { en: '😐 Bored', tr: '😐 Sıkılmış', az: '😐 Darıxmış' },
        { en: '😣 Fed up with something', tr: '😣 Bir şeye bunalmış', az: '😣 Nədənsə bezmiş' },
        { en: '😟 Putting something off', tr: '😟 Bir şeyi erteliyordum', az: '😟 Nəyisə təxirə salırdım' },
        { en: '🙂 Nothing, just habit', tr: '🙂 Hiçbir şey, alışkanlık', az: '🙂 Heç nə, vərdiş' },
      ],
    },
    note: {
      prompt: {
        en: 'What you would rather have done',
        tr: 'Onun yerine ne yapmayı tercih ederdin',
        az: 'Onun yerinə nə etməyi istərdin',
      },
      minChars: 15,
    },
    checks: [{ kind: 'clock', minutes: 4 }, { kind: 'answer' }, { kind: 'note' }],
  },
  {
    id: 'teen-screen-delay',
    category: 'calm',
    minutes: 30,
    stars: 26,
    emoji: '⏸️',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Open it half an hour later',
      tr: 'Yarım saat sonra aç',
      az: 'Yarım saat sonra aç',
    },
    body: {
      en: 'Pick the app you reach for first. Next time you want it, do not open it for half an hour — and do something else in that half hour.',
      tr: 'İlk uzandığın uygulamayı seç. Bir dahaki isteyişinde yarım saat açma ve o yarım saatte başka bir şey yap.',
      az: 'İlk uzandığın tətbiqi seç. Növbəti dəfə istəyəndə yarım saat açma və o yarım saatda başqa bir şey et.',
    },
    tip: {
      en: 'The wanting passes long before the half hour does. That is the thing worth finding out.',
      tr: 'İstek, yarım saat dolmadan çok önce geçer. Öğrenmeye değer olan da bu.',
      az: 'İstək yarım saat bitməmiş keçir. Öyrənməyə dəyən də budur.',
    },
    check: {
      question: {
        en: 'How long did wanting it last?',
        tr: 'İstek ne kadar sürdü?',
        az: 'İstək nə qədər davam etdi?',
      },
      options: [
        { en: 'A couple of minutes', tr: 'Birkaç dakika', az: 'Bir neçə dəqiqə' },
        { en: 'Most of the half hour', tr: 'Yarım saatin çoğu', az: 'Yarım saatın çoxu' },
        { en: 'I forgot about it', tr: 'Unuttum gitti', az: 'Unutdum getdi' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 30 }, { kind: 'away', minutes: 25 }, { kind: 'answer' }],
  },
  {
    id: 'teen-screen-quiet',
    category: 'calm',
    minutes: 30,
    stars: 26,
    emoji: '🔕',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Notifications off, properly',
      tr: 'Bildirimler kapalı, gerçekten',
      az: 'Bildirişlər bağlı, əməlli',
    },
    body: {
      en: 'Turn every notification off — not silent, off — and leave them off for half an hour while you get on with something.',
      tr: 'Bütün bildirimleri kapat — sessiz değil, kapalı — ve bir işle uğraşırken yarım saat kapalı bırak.',
      az: 'Bütün bildirişləri bağla — səssiz yox, bağlı — və nəyləsə məşğul ikən yarım saat bağlı saxla.',
    },
    tip: {
      en: 'Count how many were waiting at the end. That number is the whole point of the exercise.',
      tr: 'Sonunda kaç tane beklediğini say. O sayı bu işin bütün meselesi.',
      az: 'Sonda neçəsinin gözlədiyini say. O rəqəm bu işin bütün məsələsidir.',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'How many were waiting when you turned them back on?',
        tr: 'Geri açtığında kaç tane bekliyordu?',
        az: 'Geri açanda neçəsi gözləyirdi?',
      },
      min: 0,
      max: 200,
    },
    checks: [{ kind: 'clock', minutes: 30 }, { kind: 'away', minutes: 24 }, { kind: 'answer' }],
  },
  {
    id: 'teen-screen-swap',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '🔁',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Swap it for something else',
      tr: 'Yerine başka bir şey koy',
      az: 'Yerinə başqa bir şey qoy',
    },
    body: {
      en: 'Next time you find yourself scrolling without deciding to, stop and do something physical instead. Anything, for a quarter of an hour.',
      tr: 'Bir dahaki sefere karar vermeden kaydırırken kendini yakalarsan, dur ve onun yerine bedensel bir şey yap. Ne olursa, çeyrek saat.',
      az: 'Növbəti dəfə qərar vermədən sürüşdürdüyünü tutsan, dayan və əvəzinə bədəni işlədən bir şey et. Nə olursa, on beş dəqiqə.',
    },
    pick: {
      question: {
        en: 'What are you swapping it for?',
        tr: 'Yerine ne koyuyorsun?',
        az: 'Yerinə nə qoyursan?',
      },
      options: [
        { en: 'Going outside', tr: 'Dışarı çıkmak', az: 'Çölə çıxmaq' },
        { en: 'Music', tr: 'Müzik', az: 'Musiqi' },
        { en: 'Tidying something', tr: 'Bir şeyi toplamak', az: 'Nəyisə yığışdırmaq' },
        { en: 'Moving about', tr: 'Hareket etmek', az: 'Hərəkət etmək' },
        { en: 'Talking to someone', tr: 'Biriyle konuşmak', az: 'Biri ilə danışmaq' },
      ],
      min: 1,
      max: 1,
      first: true,
    },
    checks: [
      { kind: 'clock', minutes: 15 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'away', minutes: 12 }, { kind: 'active', minutes: 6 }] },
    ],
  },

  /* ============================== 3.9 attention and emotional regulation */
  /*
   * "Sistem tibbi diaqnoz və ya psixoloji vəziyyət barədə nəticə çıxarmır."
   *
   * The before and after readings are a `pick` with `first: true` and a
   * closing `check`, and that is deliberately all they are: two taps, stored
   * next to the mission, never summed, never trended, never shown as a chart
   * of a child's mood. Nothing in the app reads them back. They exist so the
   * child notices the difference themselves, which is the entire skill being
   * practised here.
   */
  {
    id: 'teen-calm-breath',
    category: 'calm',
    minutes: 5,
    stars: 8,
    emoji: '🫁',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'Three minutes of breathing', tr: 'Üç dakika nefes', az: 'Üç dəqiqə nəfəs' },
    body: {
      en: 'Three minutes. In for four, hold for four, out for six. Phone down, eyes wherever you like.',
      tr: 'Üç dakika. Dörde kadar al, dörde kadar tut, altıya kadar ver. Telefon aşağı, gözler istediğin yerde.',
      az: 'Üç dəqiqə. Dördə qədər al, dördə qədər saxla, altıya qədər ver. Telefon aşağı, gözlər istədiyin yerdə.',
    },
    pick: {
      question: {
        en: 'Where are you starting from?',
        tr: 'Nereden başlıyorsun?',
        az: 'Haradan başlayırsan?',
      },
      options: [
        { en: '😤 Wound up', tr: '😤 Gergin', az: '😤 Gərgin' },
        { en: '😐 Flat', tr: '😐 Durgun', az: '😐 Durğun' },
        { en: '🙂 Fine, just practising', tr: '🙂 İyiyim, alıştırma', az: '🙂 Yaxşıyam, məşqdir' },
      ],
      min: 1,
      max: 1,
      first: true,
    },
    check: {
      question: {
        en: 'And now?',
        tr: 'Peki şimdi?',
        az: 'Bəs indi?',
      },
      options: [
        { en: '😌 Steadier', tr: '😌 Daha sakin', az: '😌 Daha sakit' },
        { en: '😐 About the same', tr: '😐 Aynı gibi', az: '😐 Elə də dəyişməyib' },
        { en: '🥱 Sleepy', tr: '🥱 Uykulu', az: '🥱 Yuxulu' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 3 },
      { kind: 'away', minutes: 3 },
      { kind: 'picked', count: 1 },
      { kind: 'answer' },
    ],
  },
  {
    id: 'teen-calm-wait',
    category: 'calm',
    minutes: 5,
    stars: 9,
    emoji: '⏱️',
    interests: [],
    ageBands: ['10-13'],
    title: { en: 'Wait five minutes first', tr: 'Önce beş dakika bekle', az: 'Əvvəlcə beş dəqiqə gözlə' },
    body: {
      en: 'Next time your hand goes for the phone with no reason behind it, start this and wait five minutes before you open anything.',
      tr: 'Bir dahaki sefere elin sebepsizce telefona gidince bunu başlat ve bir şey açmadan önce beş dakika bekle.',
      az: 'Növbəti dəfə əlin səbəbsiz telefona gedəndə bunu başlat və nəyisə açmazdan əvvəl beş dəqiqə gözlə.',
    },
    check: {
      question: {
        en: 'After five minutes?',
        tr: 'Beş dakika sonra?',
        az: 'Beş dəqiqədən sonra?',
      },
      options: [
        { en: 'Did not want it any more', tr: 'Artık istemiyordum', az: 'Artıq istəmirdim' },
        { en: 'Still wanted it, opened it anyway', tr: 'Yine istedim, açtım', az: 'Yenə istədim, açdım' },
        { en: 'Found something better to do', tr: 'Daha iyi bir şey buldum', az: 'Daha yaxşı bir şey tapdım' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 5 }, { kind: 'away', minutes: 4 }, { kind: 'answer' }],
  },
  {
    id: 'teen-calm-express',
    category: 'create',
    minutes: 12,
    stars: 14,
    emoji: '🖤',
    interests: ['drawing'],
    ageBands: ['10-13'],
    title: {
      en: 'Get it out of your head',
      tr: 'Kafandan çıkar',
      az: 'Başından çıxar',
    },
    body: {
      en: 'Whatever you are carrying today, put it somewhere outside your head — write it or draw it. It does not have to make sense to anyone.',
      tr: 'Bugün ne taşıyorsan onu kafanın dışına koy — yaz ya da çiz. Kimseye bir anlam ifade etmesi gerekmiyor.',
      az: 'Bu gün nə daşıyırsansa, onu başının çölünə qoy — yaz və ya çək. Kimsəyə məna ifadə etməsi lazım deyil.',
    },
    tip: {
      en: 'Nobody reads this. Not a parent, not the app, not us.',
      tr: 'Bunu kimse okumuyor. Ne ebeveyn, ne uygulama, ne biz.',
      az: 'Bunu heç kim oxumur. Nə valideyn, nə tətbiq, nə biz.',
    },
    note: {
      prompt: { en: 'Yours alone', tr: 'Yalnızca senin', az: 'Yalnız sənin' },
      lines: 5,
      minChars: 30,
    },
    checks: [
      { kind: 'clock', minutes: 8 },
      { kind: 'either', of: [{ kind: 'note' }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'teen-calm-quiet20',
    category: 'calm',
    minutes: 22,
    stars: 22,
    emoji: '🚫',
    interests: [],
    ageBands: ['10-13'],
    title: {
      en: 'Twenty minutes, nothing buzzing',
      tr: 'Yirmi dakika, hiçbir şey titremiyor',
      az: 'İyirmi dəqiqə, heç nə titrəmir',
    },
    body: {
      en: 'Notifications off, then twenty minutes on one thing. This is not about the work — it is about what the quiet feels like.',
      tr: 'Bildirimler kapalı, sonra tek bir işte yirmi dakika. Mesele iş değil — sessizliğin nasıl hissettirdiği.',
      az: 'Bildirişlər bağlı, sonra bir işdə iyirmi dəqiqə. Məsələ iş deyil — sükutun necə hiss etdirməsidir.',
    },
    pick: {
      question: {
        en: 'How are you going in?',
        tr: 'Nasıl giriyorsun?',
        az: 'Necə girirsən?',
      },
      options: [
        { en: '😤 Restless', tr: '😤 Huzursuz', az: '😤 Narahat' },
        { en: '😐 Neutral', tr: '😐 Nötr', az: '😐 Neytral' },
        { en: '🙂 Ready', tr: '🙂 Hazır', az: '🙂 Hazır' },
      ],
      min: 1,
      max: 1,
      first: true,
    },
    check: {
      question: {
        en: 'And coming out?',
        tr: 'Peki çıkarken?',
        az: 'Bəs çıxanda?',
      },
      options: [
        { en: '😌 Calmer than I went in', tr: '😌 Girdiğimden sakin', az: '😌 Girdiyimdən sakit' },
        { en: '😐 No different', tr: '😐 Fark yok', az: '😐 Fərq yoxdur' },
        { en: '😣 Harder than I thought', tr: '😣 Sandığımdan zor', az: '😣 Düşündüyümdən çətin' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 20 },
      { kind: 'away', minutes: 17 },
      { kind: 'picked', count: 1 },
      { kind: 'answer' },
    ],
  },
  {
    id: 'teen-calm-walk',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '🚶',
    interests: ['nature'],
    ageBands: ['10-13'],
    title: {
      en: 'Walk it off',
      tr: 'Yürüyerek at',
      az: 'Yeriyərək at',
    },
    body: {
      en: 'When something has wound you up, go outside and walk for fifteen minutes. No headphones for the first five.',
      tr: 'Bir şey seni gerdiğinde dışarı çık ve on beş dakika yürü. İlk beş dakika kulaklık yok.',
      az: 'Nəsə səni gərginləşdirəndə çölə çıx və on beş dəqiqə yeri. İlk beş dəqiqə qulaqlıq yoxdur.',
    },
    pick: {
      question: {
        en: 'What is it, right now?',
        tr: 'Şu an ne var?',
        az: 'İndi nə var?',
      },
      options: [
        { en: '😤 Angry', tr: '😤 Kızgın', az: '😤 Hirsli' },
        { en: '😟 Worried', tr: '😟 Endişeli', az: '😟 Narahat' },
        { en: '😞 Flat', tr: '😞 Düşük', az: '😞 Düşkün' },
        { en: '🙂 Fine, just going out', tr: '🙂 İyiyim, çıkıyorum', az: '🙂 Yaxşıyam, çıxıram' },
      ],
      min: 1,
      max: 1,
      first: true,
    },
    check: {
      question: {
        en: 'And on the way back?',
        tr: 'Dönerken?',
        az: 'Qayıdanda?',
      },
      options: [
        { en: '😌 Lighter', tr: '😌 Daha hafif', az: '😌 Daha yüngül' },
        { en: '😐 Same', tr: '😐 Aynı', az: '😐 Eyni' },
        { en: '🤔 Thinking about it differently', tr: '🤔 Başka türlü düşünüyorum', az: '🤔 Başqa cür düşünürəm' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 12 },
      { kind: 'steps', count: 900 },
      { kind: 'picked', count: 1 },
      { kind: 'answer' },
    ],
  },

  /* ================================ 3.10 doing something for other people */
  /*
   * "Qlobal leaderboard əvəzinə qapalı komanda və şəxsi inkişaf paneli."
   *
   * The friends board is already closed and already opt-in — a username, a
   * code a friend's parent types in, no searching, and nothing on it but
   * numbers (`src/online/network.ts`). These missions add nothing to it and
   * send nothing new: the week long target is counted from this phone's own
   * confirmed missions with `tally`, so a team target works with no shared
   * location, no names, and no server round trip at all.
   */
  {
    id: 'teen-team-eco',
    category: 'outdoor',
    minutes: 20,
    stars: 20,
    emoji: '🌱',
    interests: ['nature', 'science'],
    ageBands: ['10-13'],
    title: {
      en: 'Plan one small green thing',
      tr: 'Küçük bir yeşil iş planla',
      az: 'Kiçik bir yaşıl iş planlaşdır',
    },
    body: {
      en: 'Pick one environmental thing that could actually happen at home or at school this month, and plan it out in stages.',
      tr: 'Bu ay evde ya da okulda gerçekten olabilecek çevresel bir iş seç ve aşamalarıyla planla.',
      az: 'Bu ay evdə və ya məktəbdə həqiqətən ola biləcək bir ekoloji iş seç və mərhələlərlə planlaşdır.',
    },
    steps: [
      {
        en: 'Name the problem in one sentence. Small and specific.',
        tr: 'Sorunu tek cümlede söyle. Küçük ve somut.',
        az: 'Problemi bir cümlədə de. Kiçik və konkret.',
      },
      {
        en: 'Write the first three steps and who has to say yes.',
        tr: 'İlk üç adımı ve kimin onay vermesi gerektiğini yaz.',
        az: 'İlk üç addımı və kimin razılıq verməli olduğunu yaz.',
      },
      {
        en: 'Put a date on step one.',
        tr: 'Birinci adıma bir tarih koy.',
        az: 'Birinci addıma bir tarix qoy.',
      },
    ],
    note: {
      prompt: {
        en: 'The problem, the first three steps, the date',
        tr: 'Sorun, ilk üç adım, tarih',
        az: 'Problem, ilk üç addım, tarix',
      },
      lines: 4,
      minChars: 60,
    },
    checks: [{ kind: 'clock', minutes: 12 }, { kind: 'note' }],
  },
  {
    id: 'teen-team-game',
    category: 'social',
    minutes: 30,
    stars: 28,
    emoji: '🏐',
    interests: ['football'],
    ageBands: ['10-13'],
    place: 'outdoor',
    title: {
      en: 'Get a game going',
      tr: 'Bir oyun kurdur',
      az: 'Bir oyun qurdur',
    },
    body: {
      en: 'Organise a game for a group with no screens in it. You pick the game, you round people up, you sort the teams.',
      tr: 'Bir grup için ekransız bir oyun organize et. Oyunu sen seç, insanları sen topla, takımları sen kur.',
      az: 'Bir qrup üçün ekransız oyun təşkil et. Oyunu sən seç, adamları sən yığ, komandaları sən qur.',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'How many played in the end?',
        tr: 'Sonunda kaç kişi oynadı?',
        az: 'Sonda neçə nəfər oynadı?',
      },
      min: 2,
      max: 30,
      goal: 3,
    },
    checks: [
      { kind: 'clock', minutes: 20 },
      { kind: 'away', minutes: 16 },
      { kind: 'answer' },
    ],
  },
  {
    id: 'teen-team-books',
    category: 'social',
    minutes: 20,
    stars: 20,
    emoji: '📦',
    interests: ['books'],
    ageBands: ['10-13'],
    place: 'indoor',
    mode: 'duo',
    proof: 'photo',
    objects: ['book', 'box'],
    title: {
      en: 'Books that should be somewhere else',
      tr: 'Başka yerde olması gereken kitaplar',
      az: 'Başqa yerdə olmalı kitablar',
    },
    body: {
      en: 'Go through the books nobody in the house reads any more. Ask properly whether they can go to someone who would, and box up the yes pile.',
      tr: 'Evde artık kimsenin okumadığı kitapları gözden geçir. Okuyacak birine gidebilir mi diye usulünce sor ve olur denenleri kutula.',
      az: 'Evdə artıq heç kimin oxumadığı kitabları nəzərdən keçir. Oxuyacaq birinə gedə bilərmi deyə əməlli soruş və razılıq verilənləri qutula.',
    },
    parentBrief: {
      en: 'They are asking, not telling. Say no to anything that should stay — a book somebody is keeping for a reason is not clutter. Then sign off what is actually going.',
      tr: 'Soruyor, bildirmiyor. Kalması gerekenlere hayır deyin — biri bir sebeple saklıyorsa o kitap fazlalık değil. Sonra gerçekten gidenleri onaylayın.',
      az: 'Soruşur, bildirmir. Qalmalı olanlara yox deyin — kimsə bir səbəbə görə saxlayırsa, o kitab artıq deyil. Sonra həqiqətən gedənləri təsdiqləyin.',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'How many are going?',
        tr: 'Kaç tanesi gidiyor?',
        az: 'Neçəsi gedir?',
      },
      min: 0,
      max: 60,
    },
    // Giving away things that belong to a household needs a real yes from the
    // household, so this is the one mission in the strand that waits for one.
    checks: [{ kind: 'clock', minutes: 12 }, { kind: 'answer' }, { kind: 'grownup' }],
  },
  {
    id: 'teen-team-idea',
    category: 'outdoor',
    minutes: 20,
    stars: 20,
    emoji: '🏙️',
    interests: ['building', 'nature'],
    ageBands: ['10-13'],
    title: {
      en: 'One thing that would fix this street',
      tr: 'Bu sokağı düzeltecek bir şey',
      az: 'Bu küçəni düzəldəcək bir şey',
    },
    body: {
      en: 'Walk your own street and find the thing that annoys everyone. Work out what would actually fix it and who could do it.',
      tr: 'Kendi sokağında yürü ve herkesi rahatsız eden şeyi bul. Onu gerçekten ne düzeltir ve kim yapabilir, çıkar.',
      az: 'Öz küçəndə gəz və hamını narahat edən şeyi tap. Onu həqiqətən nə düzəldər və kim edə bilər, üzə çıxar.',
    },
    tip: {
      en: 'A bin in the right place beats a plan nobody can pay for.',
      tr: 'Doğru yere konmuş bir çöp kutusu, kimsenin parasını veremeyeceği plandan iyidir.',
      az: 'Düz yerə qoyulmuş bir zibil qabı, heç kimin pulunu verə bilməyəcəyi plandan yaxşıdır.',
    },
    note: {
      prompt: {
        en: 'What is wrong, what would fix it, who could',
        tr: 'Ne yanlış, ne düzeltir, kim yapabilir',
        az: 'Nə səhvdir, nə düzəldər, kim edə bilər',
      },
      lines: 3,
      minChars: 50,
    },
    checks: [
      { kind: 'clock', minutes: 12 },
      { kind: 'note' },
      { kind: 'either', of: [{ kind: 'steps', count: 600 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'teen-team-week',
    category: 'social',
    minutes: 10,
    stars: 14,
    emoji: '🤝',
    interests: [],
    ageBands: ['10-13'],
    tool: 'weekGoal',
    title: {
      en: 'The week your group went offline',
      tr: 'Grubunun çevrimdışı geçirdiği hafta',
      az: 'Qrupunun oflayn keçirdiyi həftə',
    },
    body: {
      en: 'Agree a screen free target with your friends for this week, then count yours towards it. Five of your own missions make the week.',
      tr: 'Bu hafta için arkadaşlarınla ekransız bir hedef belirle, sonra kendi payını say. Kendi beş görevin haftayı tamamlar.',
      az: 'Bu həftə üçün dostlarınla ekransız hədəf razılaşdır, sonra öz payını say. Öz beş tapşırığın həftəni tamamlayır.',
    },
    tip: {
      en: 'Nothing about this leaves your phone. Your friends keep their own count on theirs.',
      tr: 'Bunun hiçbir parçası telefonundan çıkmıyor. Arkadaşların kendi sayılarını kendilerinde tutar.',
      az: 'Bunun heç bir hissəsi telefonundan çıxmır. Dostların öz saylarını özlərində saxlayır.',
    },
    checks: [{ kind: 'tally', missions: 'teen-', count: 5 }, { kind: 'grownup' }],
  },
];
