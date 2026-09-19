import type { LibraryTask } from './tasks';

/**
 * The 3-5 curriculum.
 *
 * Five strands, five missions each, and none of them needs a child to read.
 * The buddy says the mission out loud, the steps are one short line apiece,
 * and the thing being asked for is always a physical object in the room rather
 * than an idea.
 *
 * How each one is checked is chosen per mission rather than by strand, because
 * the honest answer differs:
 *
 * - **Movement** where the phone can genuinely count it (hops, jumps) uses the
 *   accelerometer. Balancing and line walking cannot be counted by a phone in
 *   a pocket, so they do not pretend to be.
 * - **Anything with a result** — a drawing, a tower, a line of sorted objects —
 *   uses photo proof. The labeller is a hint for the parent and never a
 *   verdict: it establishes that a thing was made, never how good it is.
 * - **Anything a camera cannot see** — which cushion was softer, who was in
 *   the story — uses `check`, one question the child answers afterwards. Every
 *   answer is accepted; what it establishes is that they were there.
 *
 * Under all three the parent still confirms, which is the only step that can
 * actually award anything.
 *
 * Nothing here records audio. The speaking missions are witnessed by the grown
 * up who was asked to listen, which is both better evidence and no data at all.
 */
export const littleTasks: LibraryTask[] = [
  /* ============================================== colours, shapes and sizes */
  {
    id: 'little-colour-blue',
    category: 'move',
    minutes: 6,
    stars: 8,
    emoji: '🔵',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    title: { en: 'Three blue things', tr: 'Üç mavi şey', az: 'Üç mavi şey' },
    body: {
      en: 'Walk around the house and find three blue things. Bring all three to the same spot.',
      tr: 'Evin içinde dolaş ve mavi üç şey bul. Üçünü de aynı yere getir.',
      az: 'Evin içində gəz və mavi üç şey tap. Üçünü də eyni yerə gətir.',
    },
    steps: [
      { en: 'Find the first blue thing.', tr: 'İlk mavi şeyi bul.', az: 'Birinci mavi şeyi tap.' },
      { en: 'Now find the second.', tr: 'Şimdi ikincisini bul.', az: 'İndi ikincisini tap.' },
      {
        en: 'One more. Put all three side by side.',
        tr: 'Bir tane daha. Üçünü yan yana koy.',
        az: 'Bir dənə də. Üçünü yan-yana qoy.',
      },
    ],
    check: {
      question: {
        en: 'Which room had the most blue in it?',
        tr: 'En çok mavi hangi odadaydı?',
        az: 'Ən çox mavi hansı otaqda idi?',
      },
      options: [
        { en: 'The kitchen', tr: 'Mutfak', az: 'Mətbəx' },
        { en: 'A bedroom', tr: 'Yatak odası', az: 'Yataq otağı' },
        { en: 'Somewhere else', tr: 'Başka bir yer', az: 'Başqa bir yer' },
      ],
    },
  },
  {
    id: 'little-shape-round',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '⭕',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['ball', 'cup'],
    title: { en: 'Two round things', tr: 'Yuvarlak iki şey', az: 'Yumru iki şey' },
    body: {
      en: 'Find two things shaped like a circle. A plate, a lid, a ball — anything round counts.',
      tr: 'Daire şeklinde iki şey bul. Tabak, kapak, top — yuvarlak olan her şey sayılır.',
      az: 'Dairə formasında iki şey tap. Boşqab, qapaq, top — yumru olan hər şey sayılır.',
    },
    check: {
      question: {
        en: 'Which one was bigger?',
        tr: 'Hangisi daha büyüktü?',
        az: 'Hansı daha böyük idi?',
      },
      options: [
        { en: 'The first one', tr: 'Birincisi', az: 'Birincisi' },
        { en: 'The second one', tr: 'İkincisi', az: 'İkincisi' },
        { en: 'They were the same', tr: 'İkisi de aynıydı', az: 'İkisi də eyni idi' },
      ],
    },
  },
  {
    id: 'little-colour-sort',
    category: 'create',
    minutes: 8,
    stars: 10,
    emoji: '🔴',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['blocks', 'toycar'],
    title: { en: 'Red pile, yellow pile', tr: 'Kırmızı öbek, sarı öbek', az: 'Qırmızı topa, sarı topa' },
    body: {
      en: 'Put every red toy in one pile and every yellow toy in another. Keep the two piles apart.',
      tr: 'Bütün kırmızı oyuncakları bir öbeğe, bütün sarıları başka bir öbeğe koy. İki öbeği ayrı tut.',
      az: 'Bütün qırmızı oyuncaqları bir topaya, bütün sarıları başqa topaya yığ. İki topanı ayrı saxla.',
    },
    steps: [
      {
        en: 'Gather the red ones first.',
        tr: 'Önce kırmızıları topla.',
        az: 'Əvvəlcə qırmızıları yığ.',
      },
      { en: 'Now the yellow ones.', tr: 'Şimdi sarıları.', az: 'İndi sarıları.' },
      {
        en: 'Count out loud how many are in each.',
        tr: 'Her öbekte kaç tane olduğunu yüksek sesle say.',
        az: 'Hər topada neçə dənə olduğunu ucadan say.',
      },
    ],
    check: {
      question: {
        en: 'Which pile was bigger?',
        tr: 'Hangi öbek daha büyüktü?',
        az: 'Hansı topa daha böyük idi?',
      },
      options: [
        { en: 'The red one', tr: 'Kırmızı', az: 'Qırmızı' },
        { en: 'The yellow one', tr: 'Sarı', az: 'Sarı' },
        { en: 'The same', tr: 'İkisi de aynı', az: 'İkisi də eyni' },
      ],
    },
  },
  {
    id: 'little-big-small',
    category: 'calm',
    minutes: 6,
    stars: 8,
    emoji: '📏',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    title: { en: 'The big one and the little one', tr: 'Büyük olan ve küçük olan', az: 'Böyük olan və kiçik olan' },
    body: {
      en: 'Find the biggest thing you can carry and the smallest thing you can hold. Stand them next to each other.',
      tr: 'Taşıyabildiğin en büyük şeyi ve tutabildiğin en küçük şeyi bul. İkisini yan yana koy.',
      az: 'Daşıya bildiyin ən böyük şeyi və tuta bildiyin ən kiçik şeyi tap. İkisini yan-yana qoy.',
    },
    check: {
      question: {
        en: 'What was the big one?',
        tr: 'Büyük olan neydi?',
        az: 'Böyük olan nə idi?',
      },
      options: [
        { en: 'A cushion', tr: 'Bir yastık', az: 'Bir yastıq' },
        { en: 'A box', tr: 'Bir kutu', az: 'Bir qutu' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
    },
  },
  {
    id: 'little-colour-family',
    category: 'create',
    minutes: 8,
    stars: 10,
    emoji: '🎨',
    interests: ['drawing'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['blocks', 'teddy'],
    title: { en: 'All one colour', tr: 'Hepsi tek renk', az: 'Hamısı bir rəng' },
    body: {
      en: 'Pick one colour: red, blue or yellow. Now gather every toy you own in that colour into one heap.',
      tr: 'Bir renk seç: kırmızı, mavi ya da sarı. Şimdi o renkteki bütün oyuncaklarını tek bir yığına topla.',
      az: 'Bir rəng seç: qırmızı, mavi və ya sarı. İndi o rəngdə olan bütün oyuncaqlarını bir yığına topla.',
    },
    check: {
      question: {
        en: 'Which colour did you pick?',
        tr: 'Hangi rengi seçtin?',
        az: 'Hansı rəngi seçdin?',
      },
      options: [
        { en: 'Red', tr: 'Kırmızı', az: 'Qırmızı' },
        { en: 'Blue', tr: 'Mavi', az: 'Mavi' },
        { en: 'Yellow', tr: 'Sarı', az: 'Sarı' },
      ],
    },
  },

  /* ============================================== moving and staying upright */
  {
    id: 'little-hop-bunny',
    category: 'move',
    minutes: 5,
    stars: 8,
    emoji: '🐰',
    interests: ['animals'],
    ageBands: ['3-5'],
    proof: 'motion',
    motion: { kind: 'jump', count: 10 },
    title: { en: 'Ten bunny hops', tr: 'On tavşan zıplaması', az: 'On dovşan tullanması' },
    body: {
      en: 'Put your hands on your head for ears. Now hop ten times like a bunny, with both feet together.',
      tr: 'Ellerini kulak gibi başına koy. Şimdi iki ayağın bitişik, tavşan gibi on kere zıpla.',
      az: 'Əllərini qulaq kimi başına qoy. İndi iki ayağın bitişik, dovşan kimi on dəfə tullan.',
    },
    steps: [
      { en: 'Ears on your head.', tr: 'Kulaklar başında.', az: 'Qulaqlar başında.' },
      { en: 'Feet together.', tr: 'Ayaklar bitişik.', az: 'Ayaqlar bitişik.' },
      {
        en: 'Hop, and count out loud each time.',
        tr: 'Zıpla ve her seferinde yüksek sesle say.',
        az: 'Tullan və hər dəfə ucadan say.',
      },
    ],
    tip: {
      en: 'Land softly, like a bunny would.',
      tr: 'Tavşan gibi yumuşak in.',
      az: 'Dovşan kimi yumşaq en.',
    },
  },
  {
    id: 'little-line-walk',
    category: 'move',
    minutes: 8,
    stars: 9,
    emoji: '🧦',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['sock'],
    title: { en: 'Walk the line', tr: 'Çizgide yürü', az: 'Xətt boyunca yeri' },
    body: {
      en: 'Lay a long line across the floor with socks or a scarf. Walk along it without stepping off.',
      tr: 'Yere çoraplarla ya da bir atkıyla uzun bir çizgi yap. Dışına basmadan üstünde yürü.',
      az: 'Yerə corablarla və ya şərflə uzun bir xətt düz. Kənara basmadan üstündə yeri.',
    },
    steps: [
      {
        en: 'Make the line as long as the room.',
        tr: 'Çizgiyi oda kadar uzun yap.',
        az: 'Xətti otaq qədər uzun düz.',
      },
      { en: 'Walk it forwards.', tr: 'İleri doğru yürü.', az: 'İrəli doğru yeri.' },
      { en: 'Now walk it backwards.', tr: 'Şimdi geri geri yürü.', az: 'İndi geri-geri yeri.' },
    ],
    check: {
      question: {
        en: 'Did you wobble?',
        tr: 'Sallandın mı?',
        az: 'Yırğalandın?',
      },
      options: [
        { en: 'Not once', tr: 'Hiç sallanmadım', az: 'Heç yırğalanmadım' },
        { en: 'A little', tr: 'Biraz', az: 'Bir az' },
        { en: 'Loads', tr: 'Çok', az: 'Çox' },
      ],
    },
  },
  {
    id: 'little-reach-sky',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '🙌',
    interests: ['space'],
    ageBands: ['3-5'],
    title: { en: 'Reach as high as you go', tr: 'Elinin yettiği kadar uzan', az: 'Əlin çatan qədər uzan' },
    body: {
      en: 'Throw both arms straight up as high as they will go, then down. Five times, stretching a bit further each time.',
      tr: 'İki kolunu da dümdüz yukarı, olabildiğince uzat, sonra indir. Beş kere, her seferinde biraz daha uzanarak.',
      az: 'İki qolunu da düz yuxarı, bacardığın qədər uzat, sonra endir. Beş dəfə, hər dəfə bir az da uzanaraq.',
    },
    steps: [
      {
        en: 'Stand tall with your feet apart.',
        tr: 'Ayakların açık, dimdik dur.',
        az: 'Ayaqların açıq, dimdik dur.',
      },
      {
        en: 'Both arms straight up. Count each one out loud.',
        tr: 'İki kol dümdüz yukarı. Her birini yüksek sesle say.',
        az: 'İki qol düz yuxarı. Hər birini ucadan say.',
      },
      {
        en: 'On the fifth, hold it and count to three.',
        tr: 'Beşincide öyle kal ve üçe kadar say.',
        az: 'Beşincidə elə qal və üçə qədər say.',
      },
    ],
    tip: {
      en: 'Up on your toes on the last one.',
      tr: 'Sonuncuda parmak ucuna kalk.',
      az: 'Sonuncuda barmaqlarının ucuna qalx.',
    },
    check: {
      question: {
        en: 'Was the last one harder than the first?',
        tr: 'Sonuncusu ilkinden zor muydu?',
        az: 'Sonuncusu birincidən çətin idi?',
      },
      options: [
        { en: 'Yes, much harder', tr: 'Evet, çok daha zor', az: 'Bəli, çox çətin' },
        { en: 'The same', tr: 'Aynıydı', az: 'Eyni idi' },
        { en: 'No, easier', tr: 'Hayır, daha kolay', az: 'Xeyr, daha asan' },
      ],
    },
  },
  {
    id: 'little-free-dance',
    category: 'move',
    minutes: 2,
    stars: 6,
    emoji: '💃',
    interests: ['dance', 'music'],
    ageBands: ['3-5'],
    title: { en: 'Dancing with no music', tr: 'Müziksiz dans', az: 'Musiqisiz rəqs' },
    body: {
      en: 'There is no music this time. Make a song up in your head and dance to it for two whole minutes.',
      tr: 'Bu sefer müzik yok. Kafanda bir şarkı uydur ve iki dakika boyunca ona göre dans et.',
      az: 'Bu dəfə musiqi yoxdur. Başında bir mahnı uydur və tam iki dəqiqə ona uyğun rəqs et.',
    },
    check: {
      question: {
        en: 'What was your dance like?',
        tr: 'Dansın nasıldı?',
        az: 'Rəqsin necə idi?',
      },
      options: [
        { en: 'Fast', tr: 'Hızlı', az: 'Sürətli' },
        { en: 'Slow', tr: 'Yavaş', az: 'Yavaş' },
        { en: 'Both', tr: 'İkisi de', az: 'İkisi də' },
      ],
    },
  },
  {
    id: 'little-one-leg',
    category: 'move',
    mode: 'duo',
    minutes: 5,
    stars: 8,
    emoji: '🦩',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    title: { en: 'Stork', tr: 'Leylek', az: 'Leylək' },
    body: {
      en: 'Hold a grown up by the hand and stand on one leg while they count to ten. Then swap legs.',
      tr: 'Bir büyüğün elini tut ve o ona kadar sayarken tek ayak üstünde dur. Sonra ayak değiştir.',
      az: 'Bir böyüyün əlindən tut və o ona qədər sayarkən tək ayaq üstə dur. Sonra ayağı dəyiş.',
    },
    parentBrief: {
      en: 'Give them a hand to hold and count to ten out loud. Let go for a second or two near the end if they are steady.',
      tr: 'Tutunması için elinizi verin ve yüksek sesle ona kadar sayın. Dengesi iyiyse sona doğru bir iki saniye bırakın.',
      az: 'Tutunması üçün əlinizi verin və ucadan ona qədər sayın. Tarazlığı yaxşıdırsa, sona yaxın bir-iki saniyə buraxın.',
    },
    check: {
      question: {
        en: 'Which leg was easier?',
        tr: 'Hangi ayak daha kolaydı?',
        az: 'Hansı ayaq daha asan idi?',
      },
      options: [
        { en: 'The left', tr: 'Sol', az: 'Sol' },
        { en: 'The right', tr: 'Sağ', az: 'Sağ' },
        { en: 'Both the same', tr: 'İkisi de aynı', az: 'İkisi də eyni' },
      ],
    },
  },

  /* ======================================================= what things feel like */
  {
    id: 'little-soft-hard',
    category: 'calm',
    minutes: 6,
    stars: 8,
    emoji: '🧸',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['pillow', 'blocks'],
    title: { en: 'Soft one, hard one', tr: 'Yumuşak olan, sert olan', az: 'Yumşaq olan, sərt olan' },
    body: {
      en: 'Find one thing that is soft and one thing that is hard. Give them both a good squeeze.',
      tr: 'Yumuşak bir şey ve sert bir şey bul. İkisini de iyice sık.',
      az: 'Yumşaq bir şey və sərt bir şey tap. İkisini də yaxşıca sıx.',
    },
    check: {
      question: {
        en: 'Which one was softer?',
        tr: 'Hangisi daha yumuşaktı?',
        az: 'Hansı daha yumşaq idi?',
      },
      options: [
        { en: 'The first one', tr: 'Birincisi', az: 'Birincisi' },
        { en: 'The second one', tr: 'İkincisi', az: 'İkincisi' },
      ],
    },
  },
  {
    id: 'little-guess-touch',
    category: 'social',
    mode: 'duo',
    minutes: 8,
    stars: 10,
    emoji: '🙈',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    title: { en: 'Guess with your eyes shut', tr: 'Gözün kapalı bil', az: 'Gözün bağlı tap' },
    body: {
      en: 'Close your eyes and hold out your hands. A grown up puts something in them. What is it, just by touch?',
      tr: 'Gözlerini kapat ve ellerini uzat. Bir büyük eline bir şey koyacak. Sadece dokunarak ne olduğunu bil.',
      az: 'Gözlərini yum və əllərini uzat. Bir böyük əlinə bir şey qoyacaq. Yalnız toxunaraq nə olduğunu tap.',
    },
    parentBrief: {
      en: 'Pick three safe, ordinary things: a spoon, a sock, an apple. Nothing sharp, nothing hot, nothing small enough to swallow. Hand them over one at a time.',
      tr: 'Güvenli ve sıradan üç şey seçin: bir kaşık, bir çorap, bir elma. Keskin, sıcak ya da yutulacak kadar küçük hiçbir şey olmasın. Tek tek verin.',
      az: 'Təhlükəsiz və adi üç şey seçin: bir qaşıq, bir corab, bir alma. Kəskin, isti və ya udula biləcək qədər kiçik heç nə olmasın. Bir-bir verin.',
    },
    check: {
      question: {
        en: 'How many did you get right?',
        tr: 'Kaç tanesini bildin?',
        az: 'Neçəsini tapdın?',
      },
      options: [
        { en: 'All of them', tr: 'Hepsini', az: 'Hamısını' },
        { en: 'Some of them', tr: 'Bazılarını', az: 'Bəzilərini' },
        { en: 'None of them', tr: 'Hiçbirini', az: 'Heç birini' },
      ],
    },
  },
  {
    id: 'little-three-sounds',
    category: 'calm',
    minutes: 6,
    stars: 8,
    emoji: '👂',
    interests: ['music'],
    ageBands: ['3-5'],
    title: { en: 'Three sounds', tr: 'Üç ses', az: 'Üç səs' },
    body: {
      en: 'Sit still and listen hard. Find three different sounds, and copy each one with your own voice.',
      tr: 'Kıpırdamadan otur ve iyi dinle. Üç farklı ses bul ve her birini kendi sesinle taklit et.',
      az: 'Tərpənmədən otur və yaxşı qulaq as. Üç fərqli səs tap və hər birini öz səsinlə təqlid et.',
    },
    steps: [
      { en: 'Sit still. Listen.', tr: 'Kıpırdama. Dinle.', az: 'Tərpənmə. Qulaq as.' },
      {
        en: 'Copy the first sound you hear.',
        tr: 'Duyduğun ilk sesi taklit et.',
        az: 'Eşitdiyin ilk səsi təqlid et.',
      },
      { en: 'Now two more.', tr: 'Şimdi iki tane daha.', az: 'İndi iki dənə də.' },
    ],
    check: {
      question: {
        en: 'Which sound was the loudest?',
        tr: 'Hangi ses en gürültülüydü?',
        az: 'Hansı səs ən uca idi?',
      },
      options: [
        { en: 'The first', tr: 'Birinci', az: 'Birinci' },
        { en: 'The second', tr: 'İkinci', az: 'İkinci' },
        { en: 'The third', tr: 'Üçüncü', az: 'Üçüncü' },
      ],
    },
  },
  {
    id: 'little-warm-cool',
    category: 'calm',
    mode: 'duo',
    minutes: 6,
    stars: 8,
    emoji: '🪟',
    interests: ['science'],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['blanket'],
    title: { en: 'Cool one, warm one', tr: 'Serin olan, ılık olan', az: 'Sərin olan, ilıq olan' },
    body: {
      en: 'Put your hand flat on a window, then on a blanket. Neither one is hot. One of them feels cooler.',
      tr: 'Elini önce bir cama, sonra bir battaniyeye koy. İkisi de sıcak değil. Biri daha serin geliyor.',
      az: 'Əlini əvvəl pəncərəyə, sonra yorğana qoy. İkisi də isti deyil. Biri daha sərin gəlir.',
    },
    parentBrief: {
      en: 'Show them which two surfaces to touch before they start. Nothing in the kitchen, nothing near a heater, nothing that has been in the sun.',
      tr: 'Başlamadan önce hangi iki yüzeye dokunacağını siz gösterin. Mutfakta bir şey olmasın, ısıtıcı yakınında olmasın, güneşte kalmış bir şey olmasın.',
      az: 'Başlamazdan əvvəl hansı iki səthə toxunacağını siz göstərin. Mətbəxdə bir şey olmasın, qızdırıcının yanında olmasın, günəşdə qalmış bir şey olmasın.',
    },
    check: {
      question: {
        en: 'Which felt cooler?',
        tr: 'Hangisi daha serindi?',
        az: 'Hansı daha sərin idi?',
      },
      options: [
        { en: 'The window', tr: 'Cam', az: 'Pəncərə' },
        { en: 'The blanket', tr: 'Battaniye', az: 'Yorğan' },
        { en: 'They felt the same', tr: 'İkisi de aynıydı', az: 'İkisi də eyni idi' },
      ],
    },
  },
  {
    id: 'little-texture-line',
    category: 'create',
    minutes: 8,
    stars: 10,
    emoji: '🪨',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['towel', 'paper'],
    title: { en: 'Softest to roughest', tr: 'En yumuşaktan en pürüzlüye', az: 'Ən yumşaqdan ən kobuda' },
    body: {
      en: 'Find four things that feel different from each other. Line them up, softest at one end, roughest at the other.',
      tr: 'Birbirinden farklı hissettiren dört şey bul. En yumuşak bir uçta, en pürüzlü diğer uçta olacak şekilde diz.',
      az: 'Bir-birindən fərqli hiss olunan dörd şey tap. Ən yumşaq bir tərəfdə, ən kobud o biri tərəfdə olmaqla düz.',
    },
    check: {
      question: {
        en: 'Which end was the rough end?',
        tr: 'Pürüzlü uç hangisiydi?',
        az: 'Kobud tərəf hansı idi?',
      },
      options: [
        { en: 'The left', tr: 'Sol', az: 'Sol' },
        { en: 'The right', tr: 'Sağ', az: 'Sağ' },
      ],
    },
  },

  /* ================================================== making things up and making things */
  {
    id: 'little-made-up-animal',
    category: 'create',
    minutes: 10,
    stars: 12,
    emoji: '🖍️',
    interests: ['drawing', 'animals'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['paper', 'pencil'],
    title: { en: 'An animal nobody has seen', tr: 'Kimsenin görmediği bir hayvan', az: 'Heç kimin görmədiyi heyvan' },
    body: {
      en: 'Draw an animal that does not exist anywhere. Give it as many legs as you like and any colour you want.',
      tr: 'Hiçbir yerde olmayan bir hayvan çiz. Kaç bacak istersen o kadar ver, rengini de sen seç.',
      az: 'Heç yerdə olmayan bir heyvan çək. Neçə ayaq istəyirsən o qədər ver, rəngini də sən seç.',
    },
    check: {
      question: {
        en: 'How many legs did it have?',
        tr: 'Kaç bacağı vardı?',
        az: 'Neçə ayağı var idi?',
      },
      options: [
        { en: 'Two', tr: 'İki', az: 'İki' },
        { en: 'Four', tr: 'Dört', az: 'Dörd' },
        { en: 'Lots and lots', tr: 'Bir sürü', az: 'Çoxlu-çoxlu' },
      ],
    },
  },
  {
    id: 'little-toy-house',
    category: 'create',
    minutes: 12,
    stars: 13,
    emoji: '🏠',
    interests: ['building'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['blocks', 'box', 'teddy'],
    title: { en: 'A house for one toy', tr: 'Tek oyuncaklık bir ev', az: 'Bir oyuncaqlıq ev' },
    body: {
      en: 'Build a little house out of blocks or boxes. It has to be big enough for one toy to sit inside.',
      tr: 'Legolardan ya da kutulardan küçük bir ev yap. İçine bir oyuncağın oturabileceği kadar büyük olmalı.',
      az: 'Legolardan və ya qutulardan kiçik bir ev qur. İçində bir oyuncağın otura biləcəyi qədər böyük olmalıdır.',
    },
    steps: [
      {
        en: 'Choose which toy is going to live there.',
        tr: 'Orada hangi oyuncağın yaşayacağını seç.',
        az: 'Orada hansı oyuncağın yaşayacağını seç.',
      },
      { en: 'Build the walls.', tr: 'Duvarları yap.', az: 'Divarları qur.' },
      {
        en: 'Put the toy inside and check it fits.',
        tr: 'Oyuncağı içine koy ve sığıyor mu bak.',
        az: 'Oyuncağı içinə qoy və sığır-sığmır bax.',
      },
    ],
  },
  {
    id: 'little-paper-shape',
    category: 'create',
    minutes: 8,
    stars: 10,
    emoji: '📄',
    interests: ['building'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['paper'],
    title: { en: 'Fold it into something', tr: 'Katlayıp bir şey yap', az: 'Qatlayıb bir şey düzəlt' },
    body: {
      en: 'Take a piece of paper and fold it until it turns into something. A hat, a boat, a triangle — whatever it becomes.',
      tr: 'Bir kağıt al ve bir şeye dönüşene kadar katla. Şapka, kayık, üçgen — neye dönüşürse.',
      az: 'Bir kağız götür və nəyəsə çevrilənə qədər qatla. Papaq, qayıq, üçbucaq — nəyə çevrilsə.',
    },
    check: {
      question: {
        en: 'What did it turn into?',
        tr: 'Neye dönüştü?',
        az: 'Nəyə çevrildi?',
      },
      options: [
        { en: 'A hat', tr: 'Şapka', az: 'Papaq' },
        { en: 'A boat', tr: 'Kayık', az: 'Qayıq' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
    },
  },
  {
    id: 'little-sock-puppet',
    category: 'create',
    minutes: 10,
    stars: 11,
    emoji: '🧦',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['sock'],
    title: { en: 'The sock that talks', tr: 'Konuşan çorap', az: 'Danışan corab' },
    body: {
      en: 'Put a sock over your hand and open and close it like a mouth. Give it a name and let it say hello to someone.',
      tr: 'Bir çorabı eline geçir ve ağız gibi açıp kapat. Ona bir isim ver ve birine merhaba dedir.',
      az: 'Bir corabı əlinə keçir və ağız kimi aç-bağla. Ona ad ver və kiməsə salam dedir.',
    },
    check: {
      question: {
        en: 'Who did the puppet say hello to?',
        tr: 'Kukla kime merhaba dedi?',
        az: 'Kukla kimə salam dedi?',
      },
      options: [
        { en: 'A grown up', tr: 'Bir büyüğe', az: 'Bir böyüyə' },
        { en: 'A toy', tr: 'Bir oyuncağa', az: 'Bir oyuncağa' },
        { en: 'The mirror', tr: 'Aynaya', az: 'Güzgüyə' },
      ],
    },
  },
  {
    id: 'little-toy-scene',
    category: 'create',
    minutes: 10,
    stars: 11,
    emoji: '🎭',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['teddy', 'toycar'],
    title: { en: 'Three toys, one story', tr: 'Üç oyuncak, bir hikaye', az: 'Üç oyuncaq, bir hekayə' },
    body: {
      en: 'Pick three toys and set them up so it looks like something is happening. A party, a race, a rescue.',
      tr: 'Üç oyuncak seç ve bir şey oluyormuş gibi diz. Bir parti, bir yarış, bir kurtarma.',
      az: 'Üç oyuncaq seç və nəsə baş verirmiş kimi düz. Bir şənlik, bir yarış, bir xilasetmə.',
    },
    check: {
      question: {
        en: 'What was happening?',
        tr: 'Ne oluyordu?',
        az: 'Nə baş verirdi?',
      },
      options: [
        { en: 'A party', tr: 'Bir parti', az: 'Bir şənlik' },
        { en: 'A race', tr: 'Bir yarış', az: 'Bir yarış' },
        { en: 'A rescue', tr: 'Bir kurtarma', az: 'Bir xilasetmə' },
      ],
    },
  },

  /* ===================================================== talking and telling */
  {
    id: 'little-three-sentences',
    category: 'social',
    mode: 'duo',
    minutes: 6,
    stars: 8,
    emoji: '🧸',
    interests: [],
    ageBands: ['3-5'],
    title: { en: 'Three things about it', tr: 'Onunla ilgili üç şey', az: 'Onun haqqında üç şey' },
    body: {
      en: 'Pick your favourite toy. Say three whole sentences about it out loud to a grown up.',
      tr: 'En sevdiğin oyuncağı seç. Onunla ilgili üç tam cümleyi bir büyüğe yüksek sesle söyle.',
      az: 'Ən sevdiyin oyuncağı seç. Onun haqqında üç tam cümləni bir böyüyə ucadan de.',
    },
    parentBrief: {
      en: 'Listen, and count the three out on your fingers so they can see how far they have got. Do not correct anything.',
      tr: 'Dinleyin ve nerede olduğunu görebilsin diye üçü parmaklarınızla sayın. Hiçbir şeyi düzeltmeyin.',
      az: 'Qulaq asın və harada olduğunu görsün deyə üçü barmaqlarınızla sayın. Heç nəyi düzəltməyin.',
    },
    check: {
      question: {
        en: 'What did you say first?',
        tr: 'Önce ne söyledin?',
        az: 'Əvvəl nə dedin?',
      },
      options: [
        { en: 'What it looks like', tr: 'Neye benzediğini', az: 'Nəyə bənzədiyini' },
        { en: 'Where it came from', tr: 'Nereden geldiğini', az: 'Haradan gəldiyini' },
        { en: 'What I do with it', tr: 'Onunla ne yaptığımı', az: 'Onunla nə etdiyimi' },
      ],
    },
  },
  {
    id: 'little-story-no-pictures',
    category: 'social',
    mode: 'duo',
    minutes: 8,
    stars: 10,
    emoji: '📖',
    interests: ['books'],
    ageBands: ['3-5'],
    title: { en: 'A story with no pictures', tr: 'Resimsiz bir hikaye', az: 'Şəkilsiz bir hekayə' },
    body: {
      en: 'Make up a short story out of your own head. No book, no pictures. Tell it out loud from start to end.',
      tr: 'Kendi kafandan kısa bir hikaye uydur. Kitap yok, resim yok. Baştan sona yüksek sesle anlat.',
      az: 'Öz başından qısa bir hekayə uydur. Kitab yoxdur, şəkil yoxdur. Başdan sona ucadan danış.',
    },
    parentBrief: {
      en: 'Just listen. If they stall, ask "and then what?" once and wait. The story does not have to make sense.',
      tr: 'Sadece dinleyin. Takılırsa bir kez "sonra ne oldu?" deyip bekleyin. Hikayenin mantıklı olması gerekmiyor.',
      az: 'Sadəcə qulaq asın. Duruxsa, bir dəfə "sonra nə oldu?" deyib gözləyin. Hekayənin məntiqli olması vacib deyil.',
    },
    check: {
      question: {
        en: 'Who was in your story?',
        tr: 'Hikayende kim vardı?',
        az: 'Hekayəndə kim var idi?',
      },
      options: [
        { en: 'An animal', tr: 'Bir hayvan', az: 'Bir heyvan' },
        { en: 'A person', tr: 'Bir insan', az: 'Bir insan' },
        { en: 'Something made up', tr: 'Uydurma bir şey', az: 'Uydurma bir şey' },
      ],
    },
  },
  {
    id: 'little-good-thing',
    category: 'social',
    mode: 'duo',
    minutes: 5,
    stars: 7,
    emoji: '💛',
    interests: [],
    ageBands: ['3-5'],
    partsOfDay: ['evening'],
    title: { en: 'The best bit of today', tr: 'Bugünün en güzel anı', az: 'Bu günün ən gözəl anı' },
    body: {
      en: 'Tell someone about one thing that made you happy today. Then tell them why it did.',
      tr: 'Bugün seni sevindiren bir şeyi birine anlat. Sonra da neden sevindirdiğini söyle.',
      az: 'Bu gün səni sevindirən bir şeyi birinə danış. Sonra da niyə sevindirdiyini de.',
    },
    parentBrief: {
      en: 'Listen to the whole thing before you say anything. Then tell them yours.',
      tr: 'Bir şey söylemeden önce hepsini dinleyin. Sonra siz de kendinizinkini anlatın.',
      az: 'Bir şey deməzdən əvvəl hamısını dinləyin. Sonra siz də özünüzünkünü danışın.',
    },
    check: {
      question: {
        en: 'Where did it happen?',
        tr: 'Nerede oldu?',
        az: 'Harada oldu?',
      },
      options: [
        { en: 'At home', tr: 'Evde', az: 'Evdə' },
        { en: 'Outside', tr: 'Dışarıda', az: 'Çöldə' },
        { en: 'Somewhere else', tr: 'Başka bir yerde', az: 'Başqa bir yerdə' },
      ],
    },
  },
  {
    id: 'little-animal-voice',
    category: 'social',
    mode: 'duo',
    minutes: 6,
    stars: 8,
    emoji: '🐮',
    interests: ['animals'],
    ageBands: ['3-5'],
    title: { en: 'Be an animal', tr: 'Bir hayvan ol', az: 'Bir heyvan ol' },
    body: {
      en: 'Pick an animal and make its sound. Then tell a grown up three things about it.',
      tr: 'Bir hayvan seç ve sesini çıkar. Sonra bir büyüğe onunla ilgili üç şey anlat.',
      az: 'Bir heyvan seç və səsini çıxar. Sonra bir böyüyə onun haqqında üç şey danış.',
    },
    parentBrief: {
      en: 'Guess the animal wrong once on purpose. It gets a lot more out of them than guessing right.',
      tr: 'Bir kere bilerek yanlış tahmin edin. Doğru bilmekten çok daha fazla konuşturur.',
      az: 'Bir dəfə bilərəkdən səhv tapın. Düz tapmaqdan qat-qat çox danışdırır.',
    },
    check: {
      question: {
        en: 'What does your animal eat?',
        tr: 'Senin hayvanın ne yer?',
        az: 'Sənin heyvanın nə yeyir?',
      },
      options: [
        { en: 'Plants', tr: 'Bitki', az: 'Bitki' },
        { en: 'Meat', tr: 'Et', az: 'Ət' },
        { en: 'Everything', tr: 'Her şeyi', az: 'Hər şeyi' },
      ],
    },
  },
  {
    id: 'little-finish-story',
    category: 'social',
    mode: 'duo',
    minutes: 8,
    stars: 10,
    emoji: '✨',
    interests: ['books'],
    ageBands: ['3-5'],
    partsOfDay: ['evening'],
    title: { en: 'You finish it', tr: 'Sonunu sen getir', az: 'Sonunu sən gətir' },
    body: {
      en: 'A grown up starts a story and stops right in the middle. Your job is to say what happens next.',
      tr: 'Bir büyük hikayeye başlayıp tam ortasında duracak. Senin işin sonrasında ne olduğunu anlatmak.',
      az: 'Bir böyük hekayəyə başlayıb düz ortasında dayanacaq. Sənin işin sonra nə baş verdiyini danışmaqdır.',
    },
    parentBrief: {
      en: 'Three or four sentences, then stop somewhere awkward — halfway through a door opening. Hand it straight over and do not help.',
      tr: 'Üç dört cümle anlatın, sonra zor bir yerde kesin — kapı açılırken mesela. Sözü hemen devredin ve yardım etmeyin.',
      az: 'Üç-dörd cümlə danışın, sonra çətin bir yerdə kəsin — məsələn qapı açılarkən. Sözü dərhal verin və kömək etməyin.',
    },
    check: {
      question: {
        en: 'How did your ending go?',
        tr: 'Senin sonun nasıldı?',
        az: 'Sənin sonun necə oldu?',
      },
      options: [
        { en: 'Happy', tr: 'Mutlu', az: 'Xoşbəxt' },
        { en: 'Scary', tr: 'Korkutucu', az: 'Qorxulu' },
        { en: 'Silly', tr: 'Komik', az: 'Gülməli' },
      ],
    },
  },

  /* ================================================ five minutes with a grown up */
  /*
   * Every one of these is `duo`, because the mission *is* the grown up. This
   * is the strand the whole app was argued for: the phone gets handed over to
   * buy ten quiet minutes, and these spend those ten minutes together instead.
   * They are also the missions most worth faking, so `engine/integrity.ts`
   * watches the clock on them and tells the parent what it saw.
   */
  {
    id: 'little-book-together',
    category: 'calm',
    mode: 'duo',
    minutes: 5,
    stars: 8,
    emoji: '📖',
    interests: ['books'],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['book'],
    title: { en: 'Five minutes of book', tr: 'Beş dakika kitap', az: 'Beş dəqiqə kitab' },
    body: {
      en: 'Sit next to a grown up and look at a book together for five minutes. Point at things and ask what they are.',
      tr: 'Bir büyüğün yanına otur ve beş dakika birlikte kitaba bakın. Bir şeyleri göster ve ne olduklarını sor.',
      az: 'Bir böyüyün yanında otur və beş dəqiqə birlikdə kitaba baxın. Bir şeyləri göstər və nə olduğunu soruş.',
    },
    parentBrief: {
      en: 'Read it or just look at it, either is fine. Let them turn the pages, even out of order, and answer whatever they point at.',
      tr: 'İster okuyun ister sadece bakın, ikisi de olur. Sayfaları o çevirsin, sırası karışsa bile, ve gösterdiği her şeye cevap verin.',
      az: 'İstər oxuyun, istər sadəcə baxın, ikisi də olar. Səhifələri o çevirsin, sırası qarışsa da, və göstərdiyi hər şeyə cavab verin.',
    },
    check: {
      question: {
        en: 'What did you like best in the book?',
        tr: 'Kitapta en çok ne hoşuna gitti?',
        az: 'Kitabda ən çox nə xoşuna gəldi?',
      },
      options: [
        { en: 'The pictures', tr: 'Resimler', az: 'Şəkillər' },
        { en: 'The story', tr: 'Hikaye', az: 'Hekayə' },
        { en: 'The colours', tr: 'Renkler', az: 'Rənglər' },
      ],
    },
  },
  {
    id: 'little-tower-together',
    category: 'create',
    mode: 'duo',
    minutes: 10,
    stars: 12,
    emoji: '🧱',
    interests: ['building'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['blocks', 'box'],
    title: { en: 'One tower, two people', tr: 'Bir kule, iki kişi', az: 'Bir qüllə, iki nəfər' },
    body: {
      en: 'Build one tower together with a grown up. You put a block on, then they do, then you again. Keep going until it falls.',
      tr: 'Bir büyükle birlikte tek bir kule yapın. Sen bir parça koy, sonra o koysun, sonra yine sen. Devrilene kadar devam edin.',
      az: 'Bir böyüklə birlikdə tək bir qüllə qurun. Sən bir hissə qoy, sonra o qoysun, sonra yenə sən. Yıxılana qədər davam edin.',
    },
    steps: [
      {
        en: 'Put the first block down together.',
        tr: 'İlk parçayı birlikte koyun.',
        az: 'Birinci hissəni birlikdə qoyun.',
      },
      { en: 'Now take turns. No skipping.', tr: 'Şimdi sırayla. Atlamak yok.', az: 'İndi növbə ilə. Atlamaq yoxdur.' },
      {
        en: 'When it falls, photograph how tall it got.',
        tr: 'Devrildiğinde ne kadar yükseldiğinin fotoğrafını çek.',
        az: 'Yıxılanda nə qədər hündür olduğunun şəklini çək.',
      },
    ],
    parentBrief: {
      en: 'One tower between you, not one each. Take your turn properly, and let them place the block that brings it down.',
      tr: 'İkiniz için tek kule, ayrı ayrı değil. Sıranızı düzgün alın ve kuleyi deviren parçayı o koysun.',
      az: 'İkiniz üçün bir qüllə, ayrı-ayrı yox. Növbənizi düzgün alın və qülləni yıxan hissəni o qoysun.',
    },
  },
  {
    id: 'little-hug-thanks',
    category: 'social',
    mode: 'duo',
    minutes: 5,
    stars: 7,
    emoji: '🤗',
    interests: [],
    ageBands: ['3-5'],
    title: { en: 'A hug and a thank you', tr: 'Bir sarılma ve bir teşekkür', az: 'Bir qucaq və bir təşəkkür' },
    body: {
      en: 'Find someone in your family. Give them a proper hug, then tell them one thing you want to say thank you for.',
      tr: 'Ailenden birini bul. Ona sıkıca sarıl, sonra teşekkür etmek istediğin bir şeyi söyle.',
      az: 'Ailəndən birini tap. Ona möhkəm sarıl, sonra təşəkkür etmək istədiyin bir şeyi de.',
    },
    parentBrief: {
      en: 'Take the hug properly, it is half the mission. Then listen to the thank you without adding one of your own.',
      tr: 'Sarılmayı gerçekten kabul edin, işin yarısı o. Sonra teşekkürü kendi teşekkürünüzü eklemeden dinleyin.',
      az: 'Qucağı əsl qəbul edin, işin yarısı odur. Sonra təşəkkürü öz təşəkkürünüzü əlavə etmədən dinləyin.',
    },
    check: {
      question: {
        en: 'Who did you say it to?',
        tr: 'Kime söyledin?',
        az: 'Kimə dedin?',
      },
      options: [
        { en: 'Mum', tr: 'Anneme', az: 'Anama' },
        { en: 'Dad', tr: 'Babama', az: 'Atama' },
        { en: 'Someone else', tr: 'Başka birine', az: 'Başqa birinə' },
      ],
    },
  },
  {
    id: 'little-sing-together',
    category: 'social',
    mode: 'duo',
    minutes: 5,
    stars: 8,
    emoji: '🎤',
    interests: ['music'],
    ageBands: ['3-5'],
    title: { en: 'Sing it together', tr: 'Birlikte söyleyin', az: 'Birlikdə oxuyun' },
    body: {
      en: 'Sing a song with a grown up. Any song you both know. Loud enough that someone in the next room could hear it.',
      tr: 'Bir büyükle bir şarkı söyle. İkinizin de bildiği herhangi bir şarkı. Yan odadan duyulacak kadar yüksek sesle.',
      az: 'Bir böyüklə bir mahnı oxu. İkinizin də bildiyi hər hansı mahnı. Yan otaqdan eşidiləcək qədər ucadan.',
    },
    parentBrief: {
      en: 'Their song, their choice. Sing it properly — badly is fine, quietly is not.',
      tr: 'Şarkı onun, seçim onun. Gerçekten söyleyin — kötü olması sorun değil, kısık sesle olması sorun.',
      az: 'Mahnı onundur, seçim onundur. Əsl oxuyun — pis olması problem deyil, astadan olması problemdir.',
    },
    check: {
      question: {
        en: 'Who chose the song?',
        tr: 'Şarkıyı kim seçti?',
        az: 'Mahnını kim seçdi?',
      },
      options: [
        { en: 'Me', tr: 'Ben', az: 'Mən' },
        { en: 'The grown up', tr: 'Büyük', az: 'Böyük' },
        { en: 'We both did', tr: 'İkimiz birden', az: 'İkimiz birlikdə' },
      ],
    },
  },
  {
    id: 'little-fruit-plate',
    category: 'create',
    mode: 'duo',
    minutes: 10,
    stars: 12,
    emoji: '🍎',
    interests: ['cooking'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    title: { en: 'A plate of fruit', tr: 'Bir tabak meyve', az: 'Bir boşqab meyvə' },
    body: {
      en: 'Make a plate of fruit with a grown up. You choose what goes on it and how it is arranged. Then everyone eats it.',
      tr: 'Bir büyükle meyve tabağı hazırla. Neyin gireceğine ve nasıl dizileceğine sen karar ver. Sonra herkes yesin.',
      az: 'Bir böyüklə meyvə boşqabı hazırla. Nəyin olacağına və necə düzüləcəyinə sən qərar ver. Sonra hamı yesin.',
    },
    parentBrief: {
      en: 'You do all the cutting — every knife stays with you. They wash the fruit, choose it, and arrange the plate. Let the arrangement be theirs even if it is odd.',
      tr: 'Bütün kesme işi sizde — bıçak hep sizde kalsın. O meyveyi yıkasın, seçsin ve tabağı dizsin. Dizilişi tuhaf olsa bile ona bırakın.',
      az: 'Bütün kəsmə işi sizdədir — bıçaq həmişə sizdə qalsın. O meyvəni yusun, seçsin və boşqabı düzsün. Düzülüş qəribə olsa da ona buraxın.',
    },
    check: {
      question: {
        en: 'How did you arrange it?',
        tr: 'Nasıl dizdin?',
        az: 'Necə düzdün?',
      },
      options: [
        { en: 'In a circle', tr: 'Daire şeklinde', az: 'Dairə şəklində' },
        { en: 'In rows', tr: 'Sıra sıra', az: 'Sıra-sıra' },
        { en: 'In a picture', tr: 'Bir resim gibi', az: 'Bir şəkil kimi' },
      ],
    },
  },

  /* ============================================================ small jobs */
  /*
   * The responsibility strand. These are the shortest missions in the library
   * and the easiest to claim without doing, which is exactly why every one of
   * them ends in something a parent can see in ten seconds — a tidy shelf, a
   * laid table, an empty floor. `engine/integrity.ts` catches the other half:
   * the same small job claimed again and again in one afternoon.
   */
  {
    id: 'little-three-toys-away',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '🧹',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['toycar', 'teddy', 'blocks'],
    title: { en: 'Three toys home', tr: 'Üç oyuncak yerine', az: 'Üç oyuncaq yerinə' },
    body: {
      en: 'Pick three toys up off the floor and put each one back where it lives. Then photograph the empty floor.',
      tr: 'Yerden üç oyuncak al ve her birini ait olduğu yere koy. Sonra boşalan yerin fotoğrafını çek.',
      az: 'Yerdən üç oyuncaq götür və hər birini öz yerinə qoy. Sonra boşalan yerin şəklini çək.',
    },
    steps: [
      { en: 'First toy, back it goes.', tr: 'Birinci oyuncak, yerine.', az: 'Birinci oyuncaq, yerinə.' },
      { en: 'Second one.', tr: 'İkincisi.', az: 'İkincisi.' },
      { en: 'Third one. Now look at the floor.', tr: 'Üçüncüsü. Şimdi yere bak.', az: 'Üçüncüsü. İndi yerə bax.' },
    ],
  },
  {
    id: 'little-napkin-table',
    category: 'social',
    minutes: 5,
    stars: 7,
    emoji: '🍽️',
    interests: ['cooking'],
    ageBands: ['3-5'],
    place: 'indoor',
    title: { en: 'A napkin for everyone', tr: 'Herkese bir peçete', az: 'Hər kəsə bir salfet' },
    body: {
      en: 'Put a napkin at every place at the table. One each, and nobody left out — count the chairs first.',
      tr: 'Masada herkesin yerine bir peçete koy. Herkese bir tane, kimse atlanmasın — önce sandalyeleri say.',
      az: 'Masada hər kəsin yerinə bir salfet qoy. Hər kəsə bir dənə, heç kim atlanmasın — əvvəlcə stulları say.',
    },
    objects: ['chair'],
    check: {
      question: {
        en: 'How many did you put out?',
        tr: 'Kaç tane koydun?',
        az: 'Neçə dənə qoydun?',
      },
      options: [
        { en: 'Two', tr: 'İki', az: 'İki' },
        { en: 'Three', tr: 'Üç', az: 'Üç' },
        { en: 'More than three', tr: 'Üçten fazla', az: 'Üçdən çox' },
      ],
    },
  },
  {
    id: 'little-books-shelf',
    category: 'calm',
    minutes: 6,
    stars: 8,
    emoji: '📚',
    interests: ['books'],
    ageBands: ['3-5'],
    place: 'indoor',
    proof: 'photo',
    objects: ['book'],
    title: { en: 'Books back on the shelf', tr: 'Kitaplar rafa', az: 'Kitablar rəfə' },
    body: {
      en: 'Put your books back on the shelf, all of them standing up the same way round. Then photograph the shelf.',
      tr: 'Kitaplarını rafa geri koy, hepsi aynı yöne bakarak dik dursun. Sonra rafın fotoğrafını çek.',
      az: 'Kitablarını rəfə qaytar, hamısı eyni tərəfə baxaraq dik dursun. Sonra rəfin şəklini çək.',
    },
    tip: {
      en: 'Tallest at one end looks best.',
      tr: 'En uzunu bir uçta olursa daha güzel durur.',
      az: 'Ən uzunu bir tərəfdə olsa daha gözəl görünür.',
    },
  },
  {
    id: 'little-water-plant',
    category: 'calm',
    mode: 'duo',
    minutes: 5,
    stars: 7,
    emoji: '🪴',
    interests: ['nature'],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['plant'],
    title: { en: 'Water the plant', tr: 'Bitkiyi sula', az: 'Bitkini sula' },
    body: {
      en: 'Water a plant with a grown up. Touch the soil first. Then pour slowly and stop when you reach five.',
      tr: 'Bir büyükle bir bitkiyi sula. Önce toprağa dokun. Sonra yavaşça dök ve beşe gelince dur.',
      az: 'Bir böyüklə bitkini sula. Əvvəlcə torpağa toxun. Sonra yavaşca tök və beşə çatanda dayan.',
    },
    parentBrief: {
      en: 'You carry the water and hold the cup with them. Let them feel the soil before and after — that is the part worth doing.',
      tr: 'Suyu siz taşıyın ve bardağı onunla birlikte tutun. Toprağa önce ve sonra dokunsun — asıl değerli kısım o.',
      az: 'Suyu siz daşıyın və stəkanı onunla birlikdə tutun. Torpağa əvvəl və sonra toxunsun — əsl dəyərli hissə odur.',
    },
    check: {
      question: {
        en: 'What was the soil like before?',
        tr: 'Toprak önce nasıldı?',
        az: 'Torpaq əvvəl necə idi?',
      },
      options: [
        { en: 'Dry', tr: 'Kuru', az: 'Quru' },
        { en: 'Damp already', tr: 'Zaten nemliydi', az: 'Onsuz da nəm idi' },
        { en: 'I could not tell', tr: 'Anlayamadım', az: 'Bilə bilmədim' },
      ],
    },
  },
  {
    id: 'little-clothes-basket',
    category: 'move',
    minutes: 5,
    stars: 6,
    emoji: '🧺',
    interests: [],
    ageBands: ['3-5'],
    place: 'indoor',
    partsOfDay: ['evening'],
    objects: ['sock'],
    title: { en: 'Into the basket', tr: 'Sepete', az: 'Səbətə' },
    body: {
      en: 'Find the clothes you wore today and put them in the washing basket. Every single piece, socks included.',
      tr: 'Bugün giydiğin kıyafetleri bul ve kirli sepetine koy. Hepsini, çoraplar dahil.',
      az: 'Bu gün geyindiyin paltarları tap və səbətə qoy. Hamısını, coraplar da daxil.',
    },
    check: {
      question: {
        en: 'Did the socks go in too?',
        tr: 'Çoraplar da girdi mi?',
        az: 'Coraplar da girdi?',
      },
      options: [
        { en: 'Yes, both of them', tr: 'Evet, ikisi de', az: 'Bəli, ikisi də' },
        { en: 'I forgot. Done now', tr: 'Unutmuşum. Şimdi koydum', az: 'Unutmuşdum. İndi qoydum' },
      ],
    },
  },

  /* ===================================================== feelings, named */
  /*
   * Emotions, and deliberately nothing looking at anyone's face. No camera
   * runs in this strand: the child names the feeling themselves by tapping a
   * face, which is both the safer design and the one that actually teaches
   * the vocabulary. A model guessing at a four year old's expression would
   * teach them nothing and would be the single most invasive thing this app
   * could do.
   */
  {
    id: 'little-happy-face',
    category: 'social',
    mode: 'duo',
    minutes: 5,
    stars: 7,
    emoji: '😀',
    interests: [],
    ageBands: ['3-5'],
    title: { en: 'Show me the face', tr: 'Yüzünü göster', az: 'Üzünü göstər' },
    body: {
      en: 'Make the happiest face you can and show it to a grown up. Then a sad one. Then surprised. Can they guess each one?',
      tr: 'Yapabildiğin en mutlu yüzü yap ve bir büyüğe göster. Sonra üzgün bir yüz. Sonra şaşkın. Hepsini bilebilecek mi?',
      az: 'Bacardığın ən xoşbəxt üzü düzəlt və bir böyüyə göstər. Sonra kədərli üz. Sonra təəccüblü. Hamısını tapa biləcək?',
    },
    parentBrief: {
      en: 'Guess out loud, and get one wrong on purpose so they have to correct you. Then swap over and let them guess yours.',
      tr: 'Yüksek sesle tahmin edin ve bilerek birini yanlış bilin ki sizi düzeltsin. Sonra değişin, sizinkileri o bilsin.',
      az: 'Ucadan tapın və bilərəkdən birini səhv tapın ki, sizi düzəltsin. Sonra dəyişin, sizinkiləri o tapsın.',
    },
    check: {
      question: {
        en: 'Which face was easiest to make?',
        tr: 'Hangi yüzü yapmak en kolaydı?',
        az: 'Hansı üzü düzəltmək ən asan idi?',
      },
      options: [
        { en: '😀 Happy', tr: '😀 Mutlu', az: '😀 Xoşbəxt' },
        { en: '😢 Sad', tr: '😢 Üzgün', az: '😢 Kədərli' },
        { en: '😮 Surprised', tr: '😮 Şaşkın', az: '😮 Təəccüblü' },
      ],
    },
  },
  {
    id: 'little-how-today',
    category: 'calm',
    mode: 'duo',
    minutes: 5,
    stars: 6,
    emoji: '🎭',
    interests: [],
    ageBands: ['3-5'],
    partsOfDay: ['evening'],
    title: { en: 'How was today?', tr: 'Bugün nasıldı?', az: 'Bu gün necə idi?' },
    body: {
      en: 'Think about the whole day, from waking up until now. Pick the face that matches it, then tell a grown up why you picked it.',
      tr: 'Uyandığından şu ana kadar bütün günü düşün. Ona uyan yüzü seç, sonra bir büyüğe neden onu seçtiğini anlat.',
      az: 'Oyandığından bu ana qədər bütün günü düşün. Ona uyğun üzü seç, sonra bir böyüyə niyə onu seçdiyini danış.',
    },
    parentBrief: {
      en: 'Whatever face they pick, ask why once and then just listen. A bad day named out loud is the point; do not talk them out of it.',
      tr: 'Hangi yüzü seçerse seçsin, bir kez nedenini sorun ve sonra sadece dinleyin. Kötü bir günün adını koyabilmesi asıl mesele; onu vazgeçirmeye çalışmayın.',
      az: 'Hansı üzü seçsə seçsin, bir dəfə səbəbini soruşun və sonra sadəcə dinləyin. Pis günün adını qoya bilməsi əsas məsələdir; onu fikrindən daşındırmağa çalışmayın.',
    },
    check: {
      question: {
        en: 'So how was today?',
        tr: 'Peki bugün nasıldı?',
        az: 'Bəs bu gün necə keçdi?',
      },
      options: [
        { en: '😀 Good', tr: '😀 İyiydi', az: '😀 Yaxşı' },
        { en: '😐 In between', tr: '😐 Ne iyi ne kötü', az: '😐 Belə-belə' },
        { en: '😢 Not good', tr: '😢 İyi değildi', az: '😢 Yaxşı deyildi' },
      ],
    },
  },
  {
    id: 'little-cheer-toy',
    category: 'social',
    mode: 'duo',
    minutes: 6,
    stars: 8,
    emoji: '🧸',
    interests: ['animals'],
    ageBands: ['3-5'],
    place: 'indoor',
    objects: ['teddy'],
    title: { en: 'Your toy is sad', tr: 'Oyuncağın üzgün', az: 'Oyuncağın kədərlidir' },
    body: {
      en: 'Pretend one of your toys is feeling sad. Tell a grown up three things you would do to cheer it up. Then go and do one of them.',
      tr: 'Oyuncaklarından birinin üzgün olduğunu hayal et. Onu neşelendirmek için yapacağın üç şeyi bir büyüğe anlat. Sonra birini gerçekten yap.',
      az: 'Oyuncaqlarından birinin kədərli olduğunu təsəvvür et. Onu sevindirmək üçün edəcəyin üç şeyi bir böyüyə danış. Sonra birini həqiqətən et.',
    },
    parentBrief: {
      en: 'Ask why the toy is sad before you ask how to fix it. What comes out is usually about them, not the toy.',
      tr: 'Nasıl düzeltileceğini sormadan önce oyuncağın neden üzgün olduğunu sorun. Çıkan cevap genelde oyuncakla değil kendisiyle ilgilidir.',
      az: 'Necə düzəldiləcəyini soruşmazdan əvvəl oyuncağın niyə kədərli olduğunu soruşun. Çıxan cavab adətən oyuncaqla yox, özü ilə bağlı olur.',
    },
    check: {
      question: {
        en: 'Why was your toy sad?',
        tr: 'Oyuncağın neden üzgündü?',
        az: 'Oyuncağın niyə kədərli idi?',
      },
      options: [
        { en: 'It was on its own', tr: 'Yalnız kalmıştı', az: 'Tək qalmışdı' },
        { en: 'It lost something', tr: 'Bir şeyini kaybetmişti', az: 'Nəyisə itirmişdi' },
        { en: 'Nobody was playing', tr: 'Kimse oynamıyordu', az: 'Heç kim oynamırdı' },
      ],
    },
  },
  {
    id: 'little-three-breaths',
    category: 'calm',
    minutes: 3,
    stars: 6,
    emoji: '🫁',
    interests: [],
    ageBands: ['3-5'],
    title: { en: 'Three slow breaths', tr: 'Üç yavaş nefes', az: 'Üç yavaş nəfəs' },
    body: {
      en: 'This one is for next time you feel cross. Practise it now, while you are calm: three slow breaths, in through your nose and out through your mouth.',
      tr: 'Bu, bir dahaki sefere sinirlendiğinde işine yarayacak. Şimdi sakinken alıştırma yap: üç yavaş nefes, burnundan al, ağzından ver.',
      az: 'Bu, növbəti dəfə hirslənəndə işinə yarayacaq. İndi sakit ikən məşq et: üç yavaş nəfəs, burnundan al, ağzından ver.',
    },
    steps: [
      {
        en: 'Hand on your tummy. Feel it go out.',
        tr: 'Elin karnında. Şiştiğini hisset.',
        az: 'Əlin qarnında. Şişdiyini hiss et.',
      },
      {
        en: 'In through the nose, slowly. Three times.',
        tr: 'Burnundan yavaşça al. Üç kere.',
        az: 'Burnundan yavaşca al. Üç dəfə.',
      },
      {
        en: 'Out through the mouth, even slower.',
        tr: 'Ağzından ver, daha da yavaş.',
        az: 'Ağzından ver, daha da yavaş.',
      },
    ],
    tip: {
      en: 'Out should take longer than in. That is the whole trick.',
      tr: 'Vermek almaktan uzun sürmeli. Bütün marifet o.',
      az: 'Vermək almaqdan uzun çəkməlidir. Bütün ustalıq odur.',
    },
    check: {
      question: {
        en: 'How do you feel now?',
        tr: 'Şimdi nasıl hissediyorsun?',
        az: 'İndi özünü necə hiss edirsən?',
      },
      options: [
        { en: '😌 Calmer', tr: '😌 Daha sakin', az: '😌 Daha sakit' },
        { en: '😐 The same', tr: '😐 Aynı', az: '😐 Eyni' },
        { en: '🥱 Sleepy', tr: '🥱 Uykulu', az: '🥱 Yuxulu' },
      ],
    },
  },
  {
    id: 'little-share-good-feeling',
    category: 'social',
    mode: 'duo',
    minutes: 5,
    stars: 7,
    emoji: '💛',
    interests: [],
    ageBands: ['3-5'],
    partsOfDay: ['evening'],
    title: { en: 'Name the good feeling', tr: 'Güzel duyguya ad ver', az: 'Gözəl duyğuya ad ver' },
    body: {
      en: 'Tell a grown up about a feeling you liked having today. Not what happened — how it felt inside.',
      tr: 'Bugün içinde olmasından hoşlandığın bir duyguyu bir büyüğe anlat. Ne olduğunu değil — içeride nasıl hissettirdiğini.',
      az: 'Bu gün içində olmasından xoşlandığın bir duyğunu bir böyüyə danış. Nə baş verdiyini yox — içəridə necə hiss etdirdiyini.',
    },
    parentBrief: {
      en: 'Naming a feeling is much harder than naming an event, so expect a long pause. Tell them one of yours first if they are stuck.',
      tr: 'Bir duyguya ad vermek bir olayı anlatmaktan çok daha zordur, uzun bir sessizlik bekleyin. Takılırsa önce siz kendinizinkini anlatın.',
      az: 'Bir duyğuya ad vermək bir hadisəni danışmaqdan qat-qat çətindir, uzun sükut gözləyin. Duruxsa, əvvəlcə siz özünüzünkünü danışın.',
    },
    check: {
      question: {
        en: 'What was that feeling like?',
        tr: 'O duygu nasıl bir şeydi?',
        az: 'O duyğu necə idi?',
      },
      options: [
        { en: '😀 Bouncy', tr: '😀 Zıp zıp', az: '😀 Sevincli' },
        { en: '🤗 Warm', tr: '🤗 Sıcacık', az: '🤗 İsti' },
        { en: '😌 Quiet', tr: '😌 Sakin', az: '😌 Sakit' },
      ],
    },
  },
];
