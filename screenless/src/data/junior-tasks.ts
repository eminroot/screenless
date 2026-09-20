import type { LibraryTask } from './tasks';

/**
 * The 6-9 curriculum.
 *
 * Emin's strands, five missions each: adventure and exploring, movement games,
 * making and building, home hero, thinking and puzzles, books and stories,
 * friends and family games, nature detectives, kindness, and the super team.
 * Five to fifteen minutes apiece (the team's screen free half hour is the one
 * exception), a game rather than a chore, and never more than a handful of
 * choices on screen.
 *
 * The big difference from the 3-5 library is who checks. At this age the
 * parent no longer confirms every mission; the phone does, and the parent
 * looks at a sample (`engine/verify.ts`). So every mission here says, in
 * `checks`, what the phone can establish without anyone's word for it:
 *
 * - **Adventure** is proven by being there: a scanned treasure badge, the
 *   buddy's secret object held up to the camera, a photo of the five shapes.
 * - **Movement** is counted by the accelerometer, which also reports when the
 *   pattern looks like a shaken phone. No picture of the child is ever taken.
 * - **Making** needs time on the clock (a minimum making time), a result the
 *   child reports (floors, how far the plane flew), and either the phone put
 *   down while they worked or a photo of the thing they made.
 * - **Home hero** has the child tick what they actually did, with time and the
 *   phone put down or an after photo, and a grown up can simply say yes with
 *   their code when they were in the room.
 * - **Thinking** values the attempt and the screen free time over the right
 *   answer: any honest answer counts, wrong sums included.
 *
 * - **Books** are checked by the reading timer, which is the phone lying face
 *   down, plus one plain question about what was read.
 * - **Nature** goes outside, so it is the one strand where the grown up's code
 *   is required rather than offered: "evdən kənar" is the whole reason. Nothing
 *   records a location and nothing records a sound; what is kept is the time
 *   away from the screen, what the child ticked, and a photo when there is
 *   something to photograph.
 * - **Family games** and **kindness** are the missions somebody else was part
 *   of, so the grown up who was there can say yes on the spot with their code,
 *   and the child says who it was for. Kindness is never scored by how much or
 *   how big: every kindness mission is worth what its minutes are worth, and
 *   nothing counts them up into a ranking.
 * - **Super team** goals ask for this child's own contribution (their screen
 *   free time, their steps) plus a grown up vouching for the team. The two
 *   week long ones are only handed out once the week's missions are already
 *   done, so the mission is the moment the team hears it managed it.
 *
 * When a check does not pass, nothing is refused. The mission waits for a
 * grown up instead of being approved, which is the only consequence there is.
 *
 * Not built: verification across two phones, where a friend's own device
 * confirms a shared game or contributes its steps to a team goal. It needs the
 * friends board (`src/online`) to carry it, and the board is not deployed.
 */
export const juniorTasks: LibraryTask[] = [
  /* ============================================ 2.1 adventure and exploring */
  {
    id: 'junior-adventure-map',
    category: 'create',
    minutes: 12,
    stars: 14,
    emoji: '🗺️',
    interests: ['drawing'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'A treasure map of home', tr: 'Evin hazine haritası', az: 'Evin xəzinə xəritəsi' },
    body: {
      en: 'Draw a map of your home the way a bird would see it from above. Then hide a treasure on it.',
      tr: 'Evinin haritasını, yukarıdan bakan bir kuşun göreceği gibi çiz. Sonra üstüne bir hazine sakla.',
      az: 'Evinin xəritəsini yuxarıdan baxan quşun görəcəyi kimi çək. Sonra onun üstündə bir xəzinə gizlət.',
    },
    steps: [
      { en: 'Draw each room as a box.', tr: 'Her odayı bir kutu gibi çiz.', az: 'Hər otağı bir qutu kimi çək.' },
      {
        en: 'Draw a dotted path from your bed to the front door.',
        tr: 'Yatağından kapıya kadar noktalı bir yol çiz.',
        az: 'Çarpayından giriş qapısına qədər nöqtəli bir yol çək.',
      },
      {
        en: 'Hide a small toy at home and mark its spot with a big X.',
        tr: 'Evde küçük bir oyuncak sakla ve yerini büyük bir X ile işaretle.',
        az: 'Evdə kiçik bir oyuncaq gizlət və yerini böyük X ilə işarələ.',
      },
    ],
    tip: {
      en: 'Give your map to someone. Can they find the treasure?',
      tr: 'Haritanı birine ver. Hazineyi bulabilecek mi?',
      az: 'Xəritəni birinə ver. Görəsən, xəzinəni tapa biləcək?',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'How many rooms are on your map?',
        tr: 'Haritanda kaç oda var?',
        az: 'Xəritəndə neçə otaq var?',
      },
      min: 1,
      max: 30,
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 5 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-adventure-shapes',
    category: 'move',
    minutes: 8,
    stars: 10,
    emoji: '🔺',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Five shapes hunt', tr: 'Beş şekil avı', az: 'Beş forma ovu' },
    body: {
      en: 'Find five things at home, each one a different shape. Bring them all to one spot and show me.',
      tr: 'Evde her biri farklı şekilde beş şey bul. Hepsini tek bir yere getir ve bana göster.',
      az: 'Evdə hər biri fərqli formada olan beş əşya tap. Hamısını bir yerə gətir və mənə göstər.',
    },
    pick: {
      question: {
        en: 'Tick each shape as you find it',
        tr: 'Bulduğun her şekli işaretle',
        az: 'Tapdığın hər formanı işarələ',
      },
      options: [
        { en: 'Circle', tr: 'Daire', az: 'Dairə' },
        { en: 'Square', tr: 'Kare', az: 'Kvadrat' },
        { en: 'Triangle', tr: 'Üçgen', az: 'Üçbucaq' },
        { en: 'Rectangle', tr: 'Dikdörtgen', az: 'Düzbucaqlı' },
        { en: 'Oval', tr: 'Oval', az: 'Oval' },
        { en: 'Star', tr: 'Yıldız', az: 'Ulduz' },
        { en: 'Heart', tr: 'Kalp', az: 'Ürək' },
      ],
      min: 5,
      first: true,
    },
    checks: [{ kind: 'picked', count: 5 }, { kind: 'clock', minutes: 4 }, { kind: 'photo' }],
  },
  {
    id: 'junior-adventure-badge',
    category: 'move',
    minutes: 6,
    stars: 8,
    emoji: '🏅',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    mode: 'duo',
    needs: 'badges',
    tool: 'badgeHunt',
    title: { en: 'Find the hidden badge', tr: 'Saklanan rozeti bul', az: 'Gizlədilmiş nişanı tap' },
    body: {
      en: 'A grown up has hidden the treasure badge somewhere in this room. Find it and scan it.',
      tr: 'Bir büyük, hazine rozetini bu odada bir yere sakladı. Onu bul ve tara.',
      az: 'Böyük biri xəzinə nişanını bu otaqda harasa gizlədib. Onu tap və skan et.',
    },
    parentBrief: {
      en: 'Hide badge 6, the treasure chest, somewhere in this room that is safe to reach. Then hand the phone back.',
      tr: '6 numaralı rozeti, hazine sandığını, bu odada güvenle ulaşılabilecek bir yere saklayın. Sonra telefonu geri verin.',
      az: '6 nömrəli nişanı, xəzinə sandığını, bu otaqda təhlükəsiz çatıla bilən bir yerə gizlədin. Sonra telefonu geri verin.',
    },
    tip: {
      en: 'Ask for help: they can say warm or cold as you get closer.',
      tr: 'Yardım iste: yaklaştıkça sıcak ya da soğuk diyebilirler.',
      az: 'Kömək istə: yaxınlaşdıqca isti və ya soyuq deyə bilərlər.',
    },
    check: {
      question: { en: 'Where was it hiding?', tr: 'Nerede saklanıyordu?', az: 'Harada gizlənmişdi?' },
      options: [
        { en: 'Under something', tr: 'Bir şeyin altında', az: 'Nəyinsə altında' },
        { en: 'Behind something', tr: 'Bir şeyin arkasında', az: 'Nəyinsə arxasında' },
        { en: 'Inside something', tr: 'Bir şeyin içinde', az: 'Nəyinsə içində' },
        { en: 'On top of something', tr: 'Bir şeyin üstünde', az: 'Nəyinsə üstündə' },
      ],
    },
    checks: [{ kind: 'badges', count: 1 }, { kind: 'answer' }],
  },
  {
    id: 'junior-adventure-clues',
    category: 'move',
    minutes: 8,
    stars: 10,
    emoji: '🔎',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    tool: 'secretObject',
    title: { en: 'Three clues', tr: 'Üç ipucu', az: 'Üç ipucu' },
    body: {
      en: 'I am thinking of something in your home. Read my clues, find the real thing and show it to me.',
      tr: 'Evindeki bir şeyi düşünüyorum. İpuçlarımı oku, o şeyi bul ve bana göster.',
      az: 'Evindəki bir əşyanı fikirləşirəm. İpuçlarımı oxu, həmin əşyanı tap və mənə göstər.',
    },
    tip: {
      en: 'Try to guess after one clue. The fewer you need, the better the detective.',
      tr: 'Tek ipucuyla tahmin etmeyi dene. Ne kadar az ipucu, o kadar iyi dedektif.',
      az: 'Bir ipucu ilə tapmağa çalış. Nə qədər az ipucu, o qədər yaxşı detektiv.',
    },
    checks: [{ kind: 'secret' }, { kind: 'clock', minutes: 1 }],
  },
  {
    id: 'junior-adventure-route',
    category: 'move',
    minutes: 8,
    stars: 10,
    emoji: '🧭',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    needs: 'badges',
    tool: 'badgeRoute',
    title: { en: "Explorer's route", tr: 'Kâşif rotası', az: 'Kəşfiyyatçı marşrutu' },
    body: {
      en: 'Visit three treasure badges around the home in the order on the screen. Scan each one when you get there.',
      tr: 'Evdeki üç hazine rozetini ekrandaki sırayla ziyaret et. Her birine varınca tara.',
      az: 'Evdəki üç xəzinə nişanına ekrandakı ardıcıllıqla get. Hər birinə çatanda onu skan et.',
    },
    tip: {
      en: 'Walk, do not run. Stairs only with a grown up.',
      tr: 'Koşma, yürü. Merdivenlere sadece bir büyükle.',
      az: 'Qaçma, yeri. Pilləkənə yalnız böyüklə.',
    },
    checks: [{ kind: 'badges', count: 3 }],
  },

  /* ===================================================== 2.2 movement games */
  {
    id: 'junior-move-steps',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '👣',
    interests: [],
    ageBands: ['6-9'],
    title: { en: '300 steps', tr: '300 adım', az: '300 addım' },
    body: {
      en: 'Put the phone in your pocket and walk until I have counted 300 steps. Round the house, up and down the hall, anywhere safe.',
      tr: 'Telefonu cebine koy ve ben 300 adım sayana kadar yürü. Evin içinde, koridorda, güvenli her yerde.',
      az: 'Telefonu cibinə qoy və mən 300 addım sayana qədər yeri. Evin içində, dəhlizdə, təhlükəsiz hər yerdə.',
    },
    tip: {
      en: 'Ordinary walking counts best. Shaking the phone does not count at all.',
      tr: 'En iyi normal yürüyüş sayılır. Telefonu sallamak hiç sayılmaz.',
      az: 'Ən yaxşı adi yeriş sayılır. Telefonu silkələmək heç sayılmır.',
    },
    checks: [{ kind: 'steps', count: 300 }],
  },
  {
    id: 'junior-move-jumps',
    category: 'move',
    minutes: 5,
    stars: 7,
    emoji: '🦘',
    interests: [],
    ageBands: ['6-9'],
    proof: 'motion',
    motion: { kind: 'jump', count: 20 },
    title: { en: '20 jumps', tr: '20 zıplama', az: '20 tullanma' },
    body: {
      en: 'Hold the phone tight against your chest and jump 20 times. I will count every landing.',
      tr: 'Telefonu göğsüne sıkıca bastır ve 20 kez zıpla. Her inişini sayacağım.',
      az: 'Telefonu sinənə möhkəm sıx və 20 dəfə tullan. Hər yerə enişini sayacağam.',
    },
    steps: [
      {
        en: 'March on the spot for a minute to warm up.',
        tr: 'Isınmak için bir dakika yerinde say.',
        az: 'İsinmək üçün bir dəqiqə yerində addımla.',
      },
      {
        en: 'Find a clear spot with nothing around you.',
        tr: 'Etrafında hiçbir şey olmayan boş bir yer bul.',
        az: 'Ətrafında heç nə olmayan boş bir yer tap.',
      },
    ],
    checks: [{ kind: 'reps', count: 20 }],
  },
  {
    id: 'junior-move-ball',
    category: 'move',
    minutes: 8,
    stars: 10,
    emoji: '⚽',
    interests: ['football'],
    ageBands: ['6-9'],
    title: { en: 'Five minutes of ball', tr: 'Beş dakika top', az: 'Beş dəqiqə top oyunu' },
    body: {
      en: 'Play with a ball for five minutes: kick it, throw it, bounce it. The phone goes in a zipped pocket and counts how long you moved.',
      tr: 'Beş dakika topla oyna: vur, at, sektir. Telefon fermuarlı bir cebe girer ve ne kadar hareket ettiğini sayar.',
      az: 'Beş dəqiqə topla oyna: vur, at, yerə vur. Telefon fermuarlı cibə girir və nə qədər hərəkət etdiyini sayır.',
    },
    tip: {
      en: 'No zip? A grown up can keep the phone in their pocket and play with you.',
      tr: 'Fermuarlı cebin yok mu? Telefonu bir büyük cebinde tutup seninle oynayabilir.',
      az: 'Fermuarlı cibin yoxdur? Telefonu böyük biri cibində saxlayıb səninlə oynaya bilər.',
    },
    checks: [{ kind: 'active', minutes: 4 }],
  },
  {
    id: 'junior-move-obstacle',
    category: 'move',
    minutes: 12,
    stars: 14,
    emoji: '🚧',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: {
      en: 'Three-move obstacle course',
      tr: 'Üç hareketli engel parkuru',
      az: 'Üç hərəkətli maneə yolu',
    },
    body: {
      en: 'Build a mini obstacle course with three different moves in it, then run it three times.',
      tr: 'İçinde üç farklı hareket olan küçük bir engel parkuru kur, sonra üç kez tamamla.',
      az: 'İçində üç fərqli hərəkət olan kiçik maneə yolu qur, sonra onu üç dəfə keç.',
    },
    pick: {
      question: { en: 'Pick your three moves', tr: 'Üç hareketini seç', az: 'Üç hərəkətini seç' },
      options: [
        { en: 'Crawl under', tr: 'Altından sürün', az: 'Altından sürün' },
        { en: 'Jump over', tr: 'Üstünden atla', az: 'Üstündən tullan' },
        { en: 'Walk along a line', tr: 'Bir çizgi üstünde yürü', az: 'Xətt üzərində yeri' },
        { en: 'Hop on one foot', tr: 'Tek ayakla zıpla', az: 'Bir ayaq üstündə hoppan' },
        { en: 'Bear walk', tr: 'Ayı yürüyüşü', az: 'Ayı yerişi' },
        { en: 'Zigzag run', tr: 'Zikzak koş', az: 'Ziqzaq qaç' },
      ],
      min: 3,
      max: 3,
      first: true,
    },
    steps: [
      {
        en: 'Make a station for each move with cushions, chairs or tape.',
        tr: 'Her hareket için yastık, sandalye ya da bantla bir durak yap.',
        az: 'Hər hərəkət üçün yastıq, stul və ya lentlə bir dayanacaq düzəlt.',
      },
      {
        en: 'Check that nothing is sharp, slippery or wobbly.',
        tr: 'Keskin, kaygan ya da sallanan bir şey olmadığına bak.',
        az: 'İti, sürüşkən və ya laxlayan bir şey olmadığını yoxla.',
      },
      {
        en: 'Phone in your pocket, then run the course three times.',
        tr: 'Telefon cebinde, parkuru üç kez tamamla.',
        az: 'Telefon cibində, yolu üç dəfə keç.',
      },
    ],
    checks: [{ kind: 'picked', count: 3 }, { kind: 'active', minutes: 2 }],
  },
  {
    id: 'junior-move-dance',
    category: 'move',
    minutes: 7,
    stars: 9,
    emoji: '💃',
    interests: ['dance', 'music'],
    ageBands: ['6-9'],
    mode: 'duo',
    title: { en: 'Family dance', tr: 'Aile dansı', az: 'Ailə rəqsi' },
    body: {
      en: 'Put on a song and dance together for five minutes. Whoever has a pocket keeps the phone in it, so I can feel the dancing.',
      tr: 'Bir şarkı aç ve beş dakika birlikte dans edin. Cebi olan telefonu cebine koysun, böylece dansı hissedebilirim.',
      az: 'Bir mahnı aç və beş dəqiqə birlikdə rəqs edin. Kimin cibi varsa, telefonu cibinə qoysun ki, rəqsi hiss edim.',
    },
    parentBrief: {
      en: 'Five minutes of dancing together. Pick a song you both like and keep the phone in your pocket while you dance. At the end you can say yes with your parent code.',
      tr: 'Birlikte beş dakika dans. İkinizin de sevdiği bir şarkı seçin, dans ederken telefon cebinizde dursun. Sonunda ebeveyn kodunuzla onaylayabilirsiniz.',
      az: 'Birlikdə beş dəqiqə rəqs. İkinizin də sevdiyi mahnını seçin, rəqs edərkən telefon cibinizdə olsun. Sonda valideyn kodunuzla təsdiqləyə bilərsiniz.',
    },
    checks: [{ kind: 'either', of: [{ kind: 'active', minutes: 4 }, { kind: 'grownup' }] }],
  },

  /* ================================================== 2.3 make and build */
  {
    id: 'junior-make-bridge',
    category: 'create',
    minutes: 12,
    stars: 14,
    emoji: '🌉',
    interests: ['building', 'science'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'A paper bridge', tr: 'Kağıttan köprü', az: 'Kağızdan körpü' },
    body: {
      en: 'Build a bridge between two books out of one sheet of paper, then find out how much it can hold.',
      tr: 'İki kitabın arasına tek bir kağıttan köprü kur, sonra ne kadar yük taşıyabildiğini bul.',
      az: 'İki kitabın arasında bir vərəq kağızdan körpü qur, sonra onun nə qədər yük saxlaya bildiyini öyrən.',
    },
    steps: [
      {
        en: "Put two books a hand's width apart.",
        tr: 'İki kitabı bir karış arayla koy.',
        az: 'İki kitabı bir qarış aralı qoy.',
      },
      {
        en: 'Fold, roll or pleat one sheet of paper into a bridge.',
        tr: 'Bir kağıdı katlayarak, rulo yaparak ya da akordeon gibi büzerek köprüye çevir.',
        az: 'Bir vərəq kağızı qatlayaraq, bükərək və ya büzməli edərək körpüyə çevir.',
      },
      {
        en: 'Load it one small thing at a time: coins, blocks, crayons.',
        tr: 'Üstüne tek tek küçük şeyler koy: bozuk para, blok, boya kalemi.',
        az: 'Üstünə bir-bir kiçik şeylər qoy: qəpik, kubik, karandaş.',
      },
    ],
    answer: {
      kind: 'count',
      question: {
        en: 'How many things did it hold before it fell?',
        tr: 'Yıkılmadan önce kaç şey taşıdı?',
        az: 'Yıxılmazdan əvvəl neçə əşya saxladı?',
      },
      min: 0,
      max: 200,
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 5 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-make-blocks',
    category: 'create',
    minutes: 12,
    stars: 14,
    emoji: '🏢',
    interests: ['building'],
    ageBands: ['6-9'],
    place: 'indoor',
    objects: ['blocks'],
    title: { en: 'Three floors high', tr: 'Üç katlı bina', az: 'Üç mərtəbəli bina' },
    body: {
      en: 'Build a building out of toy blocks. It needs at least three floors.',
      tr: 'Oyuncak bloklardan bir bina yap. En az üç katı olmalı.',
      az: 'Oyuncaq kubiklərdən bir bina tik. Ən azı üç mərtəbəsi olmalıdır.',
    },
    steps: [
      {
        en: 'Build a strong ground floor first.',
        tr: 'Önce sağlam bir zemin kat yap.',
        az: 'Əvvəlcə möhkəm birinci mərtəbə tik.',
      },
      { en: 'Add the floors one at a time.', tr: 'Katları tek tek ekle.', az: 'Mərtəbələri bir-bir əlavə et.' },
      {
        en: 'Count the floors from the bottom up.',
        tr: 'Katları aşağıdan yukarı say.',
        az: 'Mərtəbələri aşağıdan yuxarı say.',
      },
    ],
    answer: {
      kind: 'count',
      question: { en: 'How many floors does it have?', tr: 'Kaç katı var?', az: 'Neçə mərtəbəsi var?' },
      min: 1,
      max: 50,
      goal: 3,
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 5 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-make-pencil-pot',
    category: 'create',
    minutes: 15,
    stars: 16,
    emoji: '✏️',
    interests: ['drawing'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: {
      en: 'Pencil pot from the recycling',
      tr: 'Atık malzemeden kalemlik',
      az: 'Təkrar materialdan qələm qabı',
    },
    body: {
      en: 'Turn something that was going in the bin into a pot for your pencils.',
      tr: 'Çöpe gidecek bir şeyi kalemlerin için bir kaba dönüştür.',
      az: 'Zibilə gedəcək bir şeyi karandaşların üçün qaba çevir.',
    },
    steps: [
      {
        en: 'Find something clean: a tin, a bottle, a box or a cardboard tube.',
        tr: 'Temiz bir şey bul: teneke kutu, şişe, kutu ya da karton rulo.',
        az: 'Təmiz bir şey tap: dəmir qutu, plastik şüşə, qutu və ya karton boru.',
      },
      {
        en: 'Ask a grown up to check there are no sharp edges.',
        tr: 'Keskin kenarı olmadığını bir büyüğe kontrol ettir.',
        az: 'Kəskin kənarı olmadığını böyük birinə yoxlat.',
      },
      {
        en: 'Decorate it with paper, tape or drawings.',
        tr: 'Kağıt, bant ya da çizimlerle süsle.',
        az: 'Onu kağız, lent və ya rəsmlərlə bəzə.',
      },
      { en: 'Put your pencils in.', tr: 'Kalemlerini içine koy.', az: 'Karandaşlarını içinə qoy.' },
    ],
    check: {
      question: { en: 'What did you make it from?', tr: 'Neyden yaptın?', az: 'Nədən düzəltdin?' },
      options: [
        { en: 'A tin', tr: 'Teneke kutu', az: 'Dəmir qutu' },
        { en: 'A bottle', tr: 'Şişe', az: 'Plastik şüşə' },
        { en: 'A box or a tube', tr: 'Kutu ya da rulo', az: 'Qutu və ya boru' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 8 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 6 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-make-plane',
    category: 'create',
    minutes: 10,
    stars: 12,
    emoji: '✈️',
    interests: ['science'],
    ageBands: ['6-9'],
    title: { en: 'Paper plane test flight', tr: 'Kağıt uçak test uçuşu', az: 'Kağız təyyarənin sınaq uçuşu' },
    body: {
      en: 'Fold a paper plane and test it like an engineer: fly it, change something, fly it again.',
      tr: 'Bir kağıt uçak katla ve bir mühendis gibi test et: uçur, bir şeyi değiştir, tekrar uçur.',
      az: 'Kağız təyyarə qatla və mühəndis kimi sına: uçur, bir şeyi dəyiş, yenə uçur.',
    },
    steps: [
      {
        en: 'Fold a plane from one sheet of paper.',
        tr: 'Tek bir kağıttan uçak katla.',
        az: 'Bir vərəq kağızdan təyyarə qatla.',
      },
      { en: 'Throw it three times from the same spot.', tr: 'Aynı yerden üç kez at.', az: 'Eyni yerdən üç dəfə at.' },
      {
        en: 'Change one fold, then throw it three more times.',
        tr: 'Bir katlamayı değiştir, sonra üç kez daha at.',
        az: 'Bir qatı dəyiş, sonra daha üç dəfə at.',
      },
    ],
    answer: {
      kind: 'count',
      question: {
        en: 'How many of your steps was the longest flight?',
        tr: 'En uzun uçuş kaç adımındı?',
        az: 'Ən uzun uçuş neçə addımın qədər idi?',
      },
      min: 0,
      max: 100,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-make-tower',
    category: 'create',
    minutes: 10,
    stars: 12,
    emoji: '🗼',
    interests: ['building'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Tower of ten things', tr: 'On eşyalık kule', az: 'On əşyalıq qüllə' },
    body: {
      en: 'Build one tower out of ten things from around the home, steady enough to stand while you count to ten.',
      tr: 'Evdeki on eşyadan, sen ona kadar sayarken ayakta kalacak kadar sağlam bir kule yap.',
      az: 'Evdəki on əşyadan elə möhkəm qüllə tik ki, sən ona qədər sayanda dayansın.',
    },
    steps: [
      { en: 'Collect ten things that will not break.', tr: 'Kırılmayacak on eşya topla.', az: 'Sınmayan on əşya yığ.' },
      {
        en: 'Stack all ten into one tower.',
        tr: 'Onunu da üst üste koyup tek bir kule yap.',
        az: 'Onunu da üst-üstə qoyub bir qüllə düzəlt.',
      },
      {
        en: 'Count to ten out loud. Is it still standing?',
        tr: 'Yüksek sesle ona kadar say. Hâlâ ayakta mı?',
        az: 'Ucadan ona qədər say. Hələ də dayanır?',
      },
    ],
    check: {
      question: { en: 'What did you put at the bottom?', tr: 'En alta ne koydun?', az: 'Ən altda nə qoydun?' },
      options: [
        { en: 'A book', tr: 'Kitap', az: 'Kitab' },
        { en: 'A box', tr: 'Kutu', az: 'Qutu' },
        { en: 'A pillow', tr: 'Yastık', az: 'Yastıq' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },

  /* ========================================================= 2.4 home hero */
  {
    id: 'junior-home-bed',
    category: 'calm',
    minutes: 6,
    stars: 8,
    emoji: '🛏️',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    partsOfDay: ['morning', 'afternoon'],
    beforePhoto: true,
    title: { en: 'Make your own bed', tr: 'Yatağını kendin topla', az: 'Öz yatağını düzəlt' },
    body: {
      en: 'Make your bed so neatly a hotel would give you a job.',
      tr: 'Yatağını bir otel seni işe alacak kadar düzgün topla.',
      az: 'Yatağını elə səliqəli düzəlt ki, otel səni işə götürsün.',
    },
    pick: {
      question: { en: 'What did you do?', tr: 'Neler yaptın?', az: 'Nələri etdin?' },
      options: [
        { en: 'Pulled the sheet straight', tr: 'Çarşafı düzelttim', az: 'Döşəkağını düzəltdim' },
        { en: 'Shook out the pillow', tr: 'Yastığı silkeledim', az: 'Yastığı silkələdim' },
        { en: 'Spread the blanket flat', tr: 'Battaniyeyi düzgünce serdim', az: 'Yorğanı səliqəli sərdim' },
        {
          en: 'Cleared off toys and clothes',
          tr: 'Oyuncakları ve kıyafetleri kaldırdım',
          az: 'Oyuncaqları və paltarları yığışdırdım',
        },
        { en: 'Folded my pyjamas', tr: 'Pijamamı katladım', az: 'Pijamamı qatladım' },
      ],
      min: 3,
    },
    checks: [
      { kind: 'picked', count: 3 },
      { kind: 'clock', minutes: 3 },
      { kind: 'either', of: [{ kind: 'away', minutes: 2 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-home-table',
    category: 'social',
    minutes: 8,
    stars: 10,
    emoji: '🍽️',
    interests: ['cooking'],
    ageBands: ['6-9'],
    place: 'indoor',
    partsOfDay: ['afternoon', 'evening'],
    title: { en: 'Help set the table', tr: 'Sofrayı kurmaya yardım et', az: 'Yemək masasını hazırlamağa kömək et' },
    body: {
      en: 'Help get the table ready for a family meal.',
      tr: 'Aile yemeği için sofranın hazırlanmasına yardım et.',
      az: 'Ailə yeməyi üçün masanın hazırlanmasına kömək et.',
    },
    tip: {
      en: 'Carry one thing at a time. Hot pots are for grown ups.',
      tr: 'Her seferinde tek bir şey taşı. Sıcak tencereler büyüklerin işi.',
      az: 'Hər dəfə bir şey daşı. İsti qazanlar böyüklərin işidir.',
    },
    pick: {
      question: { en: 'What did you put out?', tr: 'Masaya neler koydun?', az: 'Masaya nələr qoydun?' },
      options: [
        { en: 'Plates', tr: 'Tabaklar', az: 'Boşqablar' },
        { en: 'Spoons and forks', tr: 'Kaşık ve çatallar', az: 'Qaşıq və çəngəllər' },
        { en: 'Glasses or cups', tr: 'Bardaklar', az: 'Stəkanlar' },
        { en: 'Napkins', tr: 'Peçeteler', az: 'Salfetlər' },
        { en: 'Bread or water', tr: 'Ekmek ya da su', az: 'Çörək və ya su' },
        { en: 'Pulled the chairs in', tr: 'Sandalyeleri yerleştirdim', az: 'Stulları yerbəyer etdim' },
      ],
      min: 3,
    },
    checks: [
      { kind: 'picked', count: 3 },
      { kind: 'clock', minutes: 3 },
      { kind: 'either', of: [{ kind: 'away', minutes: 3 }, { kind: 'photo' }, { kind: 'grownup' }] },
    ],
  },
  {
    id: 'junior-home-shelf',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '📚',
    interests: ['books'],
    ageBands: ['6-9'],
    place: 'indoor',
    beforePhoto: true,
    title: { en: 'Tidy the bookshelf', tr: 'Kitap rafını düzenle', az: 'Kitab rəfini səliqəyə sal' },
    body: {
      en: 'Give a bookshelf a proper tidy, so every book is easy to find.',
      tr: 'Bir kitap rafını, her kitap kolayca bulunacak şekilde güzelce düzenle.',
      az: 'Kitab rəfini elə səliqəyə sal ki, hər kitabı asanlıqla tapmaq olsun.',
    },
    pick: {
      question: { en: 'What did you do?', tr: 'Neler yaptın?', az: 'Nələri etdin?' },
      options: [
        {
          en: 'Took off what does not belong',
          tr: 'Rafa ait olmayanları kaldırdım',
          az: 'Rəfə aid olmayanları götürdüm',
        },
        { en: 'Stood the books up straight', tr: 'Kitapları dik dizdim', az: 'Kitabları düz düzdüm' },
        {
          en: 'Put big books with big books',
          tr: 'Büyük kitapları bir araya koydum',
          az: 'Böyük kitabları bir yerə qoydum',
        },
        { en: 'Wiped off the dust', tr: 'Tozunu sildim', az: 'Tozunu sildim' },
        {
          en: 'Put back books lying around',
          tr: 'Ortada kalan kitapları yerine koydum',
          az: 'Ortada qalan kitabları yerinə qoydum',
        },
      ],
      min: 3,
    },
    checks: [
      { kind: 'picked', count: 3 },
      { kind: 'clock', minutes: 5 },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-home-clothes',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '👕',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    beforePhoto: true,
    title: { en: 'Sort the clean clothes', tr: 'Temiz kıyafetleri ayır', az: 'Təmiz paltarları qruplaşdır' },
    body: {
      en: 'Sort a pile of clean washing into groups, so it is ready to put away.',
      tr: 'Temiz çamaşır yığınını gruplara ayır, böylece yerlerine kaldırmaya hazır olsun.',
      az: 'Təmiz paltar yığınını qruplara ayır ki, yerinə qoymağa hazır olsun.',
    },
    pick: {
      question: { en: 'How did you sort them?', tr: 'Nasıl ayırdın?', az: 'Necə qruplaşdırdın?' },
      options: [
        { en: 'By whose they are', tr: 'Kimin olduğuna göre', az: 'Kimin olduğuna görə' },
        { en: 'Socks into pairs', tr: 'Çorapları eşleştirdim', az: 'Corabları cütlədim' },
        { en: 'T-shirts together', tr: 'Tişörtleri bir araya', az: 'Köynəkləri bir yerə' },
        { en: 'Trousers together', tr: 'Pantolonları bir araya', az: 'Şalvarları bir yerə' },
        { en: 'Folded them', tr: 'Katladım', az: 'Qatladım' },
      ],
      min: 2,
    },
    checks: [
      { kind: 'picked', count: 2 },
      { kind: 'clock', minutes: 5 },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-home-help',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '🤝',
    interests: [],
    ageBands: ['6-9'],
    title: { en: 'Offer a hand', tr: 'Yardım teklif et', az: 'Kömək təklif et' },
    body: {
      en: 'Find someone in your family and ask: can I help you with something? Then do the job all the way to the end.',
      tr: 'Ailenden birini bul ve sor: Sana bir konuda yardım edebilir miyim? Sonra işi sonuna kadar yap.',
      az: 'Ailəndən birini tap və soruş: Sənə nəsə kömək edə bilərəmmi? Sonra işi axıra qədər gör.',
    },
    pick: {
      question: { en: 'Who did you help?', tr: 'Kime yardım ettin?', az: 'Kimə kömək etdin?' },
      options: [
        { en: 'Mum', tr: 'Anneme', az: 'Anama' },
        { en: 'Dad', tr: 'Babama', az: 'Atama' },
        { en: 'A grandparent', tr: 'Büyükanne ya da büyükbabama', az: 'Nənəmə və ya babama' },
        { en: 'A brother or sister', tr: 'Kardeşime', az: 'Bacıma və ya qardaşıma' },
        { en: 'Someone else', tr: 'Başka birine', az: 'Başqa birinə' },
      ],
      min: 1,
    },
    check: {
      question: { en: 'What was the job?', tr: 'İş neydi?', az: 'İş nə idi?' },
      options: [
        { en: 'In the kitchen', tr: 'Mutfakta', az: 'Mətbəxdə' },
        { en: 'Cleaning or tidying', tr: 'Temizlik ya da toplama', az: 'Təmizlik və ya yığışdırma' },
        { en: 'Carrying something', tr: 'Bir şey taşımak', az: 'Nəsə daşımaq' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
    },
    checks: [
      { kind: 'picked', count: 1 },
      { kind: 'answer' },
      { kind: 'clock', minutes: 4 },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'grownup' }] },
    ],
  },

  /* ================================================ 2.5 thinking and puzzles */
  {
    id: 'junior-think-pattern',
    category: 'calm',
    minutes: 8,
    stars: 10,
    emoji: '🔁',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'A pattern of things', tr: 'Eşyalardan örüntü', az: 'Əşyalardan ardıcıllıq' },
    body: {
      en: 'Use things from around the home to make a pattern that repeats, like spoon, fork, spoon, fork.',
      tr: 'Evdeki eşyalarla tekrar eden bir örüntü yap: kaşık, çatal, kaşık, çatal gibi.',
      az: 'Evdəki əşyalarla təkrarlanan ardıcıllıq qur: qaşıq, çəngəl, qaşıq, çəngəl kimi.',
    },
    steps: [
      { en: 'Pick two or three kinds of things.', tr: 'İki ya da üç çeşit eşya seç.', az: 'İki və ya üç növ əşya seç.' },
      {
        en: 'Lay them in a line that repeats, at least eight long.',
        tr: 'En az sekiz tane olacak şekilde tekrar eden bir sıra diz.',
        az: 'Ən azı səkkiz dənə olmaqla təkrarlanan sıra düz.',
      },
      {
        en: 'Point at each one and say the pattern out loud.',
        tr: 'Her birini göstererek örüntüyü yüksek sesle söyle.',
        az: 'Hər birini göstərərək ardıcıllığı ucadan de.',
      },
    ],
    check: {
      question: {
        en: 'Which kind of pattern did you make?',
        tr: 'Nasıl bir örüntü yaptın?',
        az: 'Necə ardıcıllıq qurdun?',
      },
      options: [
        { en: '● ▲ ● ▲', tr: '● ▲ ● ▲', az: '● ▲ ● ▲' },
        { en: '● ● ▲ ▲', tr: '● ● ▲ ▲', az: '● ● ▲ ▲' },
        { en: '● ▲ ■ ● ▲ ■', tr: '● ▲ ■ ● ▲ ■', az: '● ▲ ■ ● ▲ ■' },
        { en: 'My own kind', tr: 'Kendi icadım', az: 'Öz ixtiram' },
      ],
    },
    checks: [
      { kind: 'answer' },
      { kind: 'clock', minutes: 4 },
      { kind: 'either', of: [{ kind: 'away', minutes: 3 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-think-riddle',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '❓',
    interests: [],
    ageBands: ['6-9'],
    title: { en: 'A riddle for a grown up', tr: 'Bir büyüğe bilmece', az: 'Valideynə tapmaca' },
    body: {
      en: 'Make up your own riddle about something at home, then try it on a grown up.',
      tr: 'Evdeki bir şey hakkında kendi bilmeceni uydur, sonra bir büyüğe sor.',
      az: 'Evdəki bir əşya haqqında öz tapmacanı qur, sonra onu valideyninə de.',
    },
    steps: [
      { en: 'Secretly pick one thing in the house.', tr: 'Evde gizlice bir şey seç.', az: 'Evdə gizlicə bir əşya seç.' },
      {
        en: 'Think of three clues that do not say its name.',
        tr: 'Adını söylemeyen üç ipucu düşün.',
        az: 'Adını deməyən üç ipucu fikirləş.',
      },
      {
        en: 'Tell the clues to a grown up, one at a time.',
        tr: 'İpuçlarını bir büyüğe teker teker söyle.',
        az: 'İpuçlarını valideyninə bir-bir de.',
      },
    ],
    check: {
      question: { en: 'Grown up: how did it go?', tr: 'Büyük: nasıl geçti?', az: 'Valideyn: necə keçdi?' },
      options: [
        { en: 'Guessed it on the first clue', tr: 'İlk ipucunda bildim', az: 'Birinci ipucunda tapdım' },
        { en: 'Needed all three clues', tr: 'Üç ipucu da gerekti', az: 'Hər üç ipucu lazım oldu' },
        { en: 'It stumped me', tr: 'Bilemedim', az: 'Tapa bilmədim' },
      ],
    },
    checks: [{ kind: 'grownup' }],
  },
  {
    id: 'junior-think-sort',
    category: 'calm',
    minutes: 8,
    stars: 10,
    emoji: '📏',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Smallest to biggest', tr: 'En küçükten en büyüğe', az: 'Ən kiçikdən ən böyüyə' },
    body: {
      en: 'Line up ten things in order of size, from the smallest to the biggest.',
      tr: 'On eşyayı boyuna göre, en küçükten en büyüğe sırala.',
      az: 'On əşyanı ölçüsünə görə, ən kiçikdən ən böyüyə düz.',
    },
    steps: [
      {
        en: 'Collect ten things of different sizes.',
        tr: 'Farklı boylarda on eşya topla.',
        az: 'Fərqli ölçülərdə on əşya yığ.',
      },
      {
        en: 'Line them up from smallest to biggest.',
        tr: 'Onları en küçükten en büyüğe diz.',
        az: 'Onları ən kiçikdən ən böyüyə düz.',
      },
      {
        en: 'Check each pair: is the next one really bigger?',
        tr: 'Her ikiliye bak: sonraki gerçekten daha büyük mü?',
        az: 'Hər cütü yoxla: növbəti həqiqətən daha böyükdür?',
      },
    ],
    check: {
      question: {
        en: 'How did you decide which was bigger?',
        tr: 'Hangisinin daha büyük olduğuna nasıl karar verdin?',
        az: 'Hansının daha böyük olduğuna necə qərar verdin?',
      },
      options: [
        { en: 'By how tall', tr: 'Boyuna bakarak', az: 'Hündürlüyünə baxaraq' },
        { en: 'By how long', tr: 'Uzunluğuna bakarak', az: 'Uzunluğuna baxaraq' },
        { en: 'By how heavy', tr: 'Ağırlığına bakarak', az: 'Ağırlığına baxaraq' },
        { en: 'It just looked bigger', tr: 'Daha büyük görünüyordu', az: 'Daha böyük görünürdü' },
      ],
    },
    checks: [
      { kind: 'answer' },
      { kind: 'clock', minutes: 4 },
      { kind: 'either', of: [{ kind: 'away', minutes: 3 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-think-maze',
    category: 'calm',
    minutes: 12,
    stars: 14,
    emoji: '🌀',
    interests: ['drawing'],
    ageBands: ['6-9'],
    title: { en: 'Draw a maze', tr: 'Labirent çiz', az: 'Labirint çək' },
    body: {
      en: 'Draw a maze on paper with one real way through, then see if someone can solve it.',
      tr: 'Kağıda tek bir gerçek yolu olan bir labirent çiz, sonra birinin çözüp çözemeyeceğine bak.',
      az: 'Kağızda yalnız bir düzgün yolu olan labirint çək, sonra kiminsə onu həll edə bildiyinə bax.',
    },
    steps: [
      { en: 'Mark a start and a finish.', tr: 'Bir başlangıç ve bir bitiş işaretle.', az: 'Başlanğıc və son nöqtəni işarələ.' },
      {
        en: 'Draw the one path that gets from start to finish.',
        tr: 'Başlangıçtan bitişe giden tek yolu çiz.',
        az: 'Başlanğıcdan sona gedən yeganə yolu çək.',
      },
      {
        en: 'Add walls and dead ends all around it.',
        tr: 'Etrafına duvarlar ve çıkmaz yollar ekle.',
        az: 'Ətrafına divarlar və dalan yollar əlavə et.',
      },
    ],
    answer: {
      kind: 'count',
      question: {
        en: 'How many dead ends did you draw?',
        tr: 'Kaç çıkmaz yol çizdin?',
        az: 'Neçə dalan yol çəkdin?',
      },
      min: 0,
      max: 100,
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 5 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-think-ten',
    category: 'calm',
    minutes: 8,
    stars: 10,
    emoji: '🔟',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Ten, three ways', tr: 'Üç yoldan on', az: 'Üç üsulla 10' },
    body: {
      en: 'Take ten small things and split them into two piles in three different ways. Every way still makes ten.',
      tr: 'On küçük şey al ve onları üç farklı şekilde iki yığına ayır. Her seferinde toplam yine on eder.',
      az: 'On kiçik əşya götür və onları üç fərqli üsulla iki topaya ayır. Hər dəfə cəmi yenə on olur.',
    },
    steps: [
      {
        en: 'Count out ten buttons, blocks or bits of pasta.',
        tr: 'On düğme, blok ya da makarna say.',
        az: 'On düymə, kubik və ya makaron say.',
      },
      {
        en: 'Split them into two piles and count each pile.',
        tr: 'İki yığına ayır ve her yığını say.',
        az: 'İki topaya ayır və hər topanı say.',
      },
      {
        en: 'Mix them up and split them a different way.',
        tr: 'Karıştır ve başka bir şekilde ayır.',
        az: 'Qarışdır və başqa cür ayır.',
      },
    ],
    answer: {
      kind: 'sums',
      question: { en: 'Write down your three ways', tr: 'Üç yolunu yaz', az: 'Üç üsulunu yaz' },
      target: 10,
      ways: 3,
    },
    checks: [
      { kind: 'answer' },
      { kind: 'clock', minutes: 3 },
      { kind: 'either', of: [{ kind: 'away', minutes: 2 }, { kind: 'photo' }] },
    ],
  },

  /* ============================================ 2.6 books and stories */
  {
    id: 'junior-book-read',
    category: 'calm',
    minutes: 12,
    stars: 13,
    emoji: '📖',
    interests: ['books'],
    ageBands: ['6-9'],
    partsOfDay: ['afternoon', 'evening'],
    title: { en: 'Ten minutes with a book', tr: 'Kitapla on dakika', az: 'Kitabla on dəqiqə' },
    body: {
      en: 'Read your book for ten minutes. Put me face down and I will count the quiet minutes for you.',
      tr: 'Kitabını on dakika oku. Beni yüzüstü koy, sessiz dakikaları senin için sayayım.',
      az: 'Kitabını on dəqiqə oxu. Məni üzüaşağı qoy, sakit dəqiqələri sənin üçün sayım.',
    },
    tip: {
      en: 'A comic or a magazine counts too.',
      tr: 'Çizgi roman ya da dergi de sayılır.',
      az: 'Komiks və ya jurnal da sayılır.',
    },
    check: {
      question: {
        en: 'Who was the part you read about?',
        tr: 'Okuduğun bölüm kimi anlatıyordu?',
        az: 'Oxuduğun hissə kimdən bəhs edirdi?',
      },
      options: [
        { en: 'A person', tr: 'Bir insanı', az: 'İnsandan' },
        { en: 'An animal', tr: 'Bir hayvanı', az: 'Heyvandan' },
        { en: 'Something magic', tr: 'Sihirli bir şeyi', az: 'Sehrli bir şeydən' },
        { en: 'Something real', tr: 'Gerçek bir şeyi', az: 'Real bir şeydən' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 9 }, { kind: 'away', minutes: 8 }, { kind: 'answer' }],
  },
  {
    id: 'junior-book-hero',
    category: 'create',
    minutes: 10,
    stars: 12,
    emoji: '🎨',
    interests: ['books', 'drawing'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Draw the hero', tr: 'Kahramanı çiz', az: 'Qəhrəmanı çək' },
    body: {
      en: 'Draw the hero of the part you just read, with everything the book says they have.',
      tr: 'Az önce okuduğun bölümün kahramanını, kitapta anlatılan her şeyiyle çiz.',
      az: 'İndicə oxuduğun hissənin qəhrəmanını, kitabda deyilən hər şeyi ilə birlikdə çək.',
    },
    steps: [
      {
        en: 'Think about what the book says they look like.',
        tr: 'Kitapta neye benzediği nasıl anlatılıyor, düşün.',
        az: 'Kitabda onun necə göründüyü barədə nə yazılıb, fikirləş.',
      },
      { en: 'Draw them big, on one sheet.', tr: 'Onu tek bir kağıda kocaman çiz.', az: 'Onu bir vərəqə böyük çək.' },
      { en: 'Write their name next to them.', tr: 'Yanına adını yaz.', az: 'Yanına adını yaz.' },
    ],
    check: {
      question: {
        en: 'Where does your hero live in the story?',
        tr: 'Kahramanın hikâyede nerede yaşıyor?',
        az: 'Qəhrəmanın hekayədə harada yaşayır?',
      },
      options: [
        { en: 'In a house', tr: 'Bir evde', az: 'Bir evdə' },
        { en: 'Outside somewhere', tr: 'Dışarıda bir yerde', az: 'Çöldə bir yerdə' },
        { en: 'Somewhere magic', tr: 'Sihirli bir yerde', az: 'Sehrli bir yerdə' },
        { en: 'The book does not say', tr: 'Kitapta yazmıyor', az: 'Kitabda yazılmayıb' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-book-ending',
    category: 'create',
    minutes: 10,
    stars: 12,
    emoji: '✨',
    interests: ['books'],
    ageBands: ['6-9'],
    title: { en: 'A new ending', tr: 'Yeni bir son', az: 'Yeni son' },
    body: {
      en: 'Think up a different ending for the story you are reading, then tell it to someone at home.',
      tr: 'Okuduğun hikâyeye başka bir son uydur, sonra evden birine anlat.',
      az: 'Oxuduğun hekayəyə başqa bir son fikirləş, sonra evdən birinə danış.',
    },
    steps: [
      { en: 'Say the old ending out loud.', tr: 'Eski sonu yüksek sesle söyle.', az: 'Köhnə sonu ucadan de.' },
      {
        en: 'Change one big thing about it.',
        tr: 'İçinde büyük bir şeyi değiştir.',
        az: 'Orada böyük bir şeyi dəyiş.',
      },
      {
        en: 'Tell your new ending to someone at home.',
        tr: 'Yeni sonunu evden birine anlat.',
        az: 'Yeni sonunu evdən birinə danış.',
      },
    ],
    check: {
      question: {
        en: 'How does your ending finish?',
        tr: 'Senin sonun nasıl bitiyor?',
        az: 'Sənin sonun necə bitir?',
      },
      options: [
        { en: 'Happily', tr: 'Mutlu', az: 'Xoşbəxt' },
        { en: 'Funnily', tr: 'Komik', az: 'Gülməli' },
        { en: 'With a surprise', tr: 'Sürprizle', az: 'Sürprizlə' },
        { en: 'Sadly', tr: 'Hüzünlü', az: 'Kədərli' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 4 }] },
    ],
  },
  {
    id: 'junior-book-tell',
    category: 'social',
    minutes: 8,
    stars: 10,
    emoji: '🗣️',
    interests: ['books'],
    ageBands: ['6-9'],
    title: {
      en: 'Tell someone what you read',
      tr: 'Okuduğunu birine anlat',
      az: 'Oxuduğunu birinə danış',
    },
    body: {
      en: 'Find someone at home and tell them what happens in your book so far.',
      tr: 'Evden birini bul ve kitabında şu ana kadar neler olduğunu anlat.',
      az: 'Evdən birini tap və kitabında indiyə qədər nə baş verdiyini danış.',
    },
    pick: {
      question: { en: 'Who did you tell?', tr: 'Kime anlattın?', az: 'Kimə danışdın?' },
      options: [
        { en: 'Mum', tr: 'Anneme', az: 'Anama' },
        { en: 'Dad', tr: 'Babama', az: 'Atama' },
        { en: 'A grandparent', tr: 'Büyükanne ya da büyükbabama', az: 'Nənəmə və ya babama' },
        { en: 'A brother or sister', tr: 'Kardeşime', az: 'Bacıma və ya qardaşıma' },
        { en: 'Someone else', tr: 'Başka birine', az: 'Başqa birinə' },
      ],
      min: 1,
    },
    checks: [
      { kind: 'clock', minutes: 4 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 3 }] },
    ],
  },
  {
    id: 'junior-book-words',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '🔤',
    interests: ['books'],
    ageBands: ['6-9'],
    title: { en: 'Three new words', tr: 'Üç yeni kelime', az: 'Üç yeni söz' },
    body: {
      en: 'Find three words in your book you have never used before, and find out what they mean.',
      tr: 'Kitabında daha önce hiç kullanmadığın üç kelime bul ve ne demek olduklarını öğren.',
      az: 'Kitabında indiyədək heç işlətmədiyin üç söz tap və onların nə demək olduğunu öyrən.',
    },
    steps: [
      {
        en: 'Find three new words and write them down.',
        tr: 'Üç yeni kelime bul ve yaz.',
        az: 'Üç yeni söz tap və onları yaz.',
      },
      {
        en: 'Ask a grown up what they mean, or look them up.',
        tr: 'Bir büyüğe ne demek olduklarını sor ya da bak.',
        az: 'Böyük birindən mənasını soruş və ya lüğətə bax.',
      },
      {
        en: 'Use one of them in a sentence out loud.',
        tr: 'Birini yüksek sesle bir cümlede kullan.',
        az: 'Birini ucadan bir cümlədə işlət.',
      },
    ],
    answer: {
      kind: 'count',
      question: {
        en: 'How many letters are in the longest word you found?',
        tr: 'Bulduğun en uzun kelime kaç harfli?',
        az: 'Tapdığın ən uzun söz neçə hərflidir?',
      },
      min: 1,
      max: 25,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 4 }, { kind: 'photo' }] },
    ],
  },

  /* ==================================== 2.7 friends and family games */
  {
    id: 'junior-play-board',
    category: 'social',
    minutes: 15,
    stars: 16,
    emoji: '🎲',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    mode: 'duo',
    partsOfDay: ['afternoon', 'evening'],
    title: { en: 'A game with someone', tr: 'Biriyle oyun', az: 'Biri ilə oyun' },
    body: {
      en: 'Play a board game or a card game with someone at home, right through to the end.',
      tr: 'Evden biriyle bir kutu oyunu ya da kart oyunu oyna, sonuna kadar.',
      az: 'Evdən biri ilə stolüstü və ya kart oyunu oyna, sona qədər.',
    },
    parentBrief: {
      en: 'One board game or card game together, played to the end. When you finish you can say yes with your parent code.',
      tr: 'Birlikte bir kutu ya da kart oyunu, sonuna kadar. Bitirince ebeveyn kodunuzla onaylayabilirsiniz.',
      az: 'Birlikdə bir stolüstü və ya kart oyunu, sona qədər. Bitirəndə valideyn kodunuzla təsdiqləyə bilərsiniz.',
    },
    check: {
      question: { en: 'Who won?', tr: 'Kim kazandı?', az: 'Kim qazandı?' },
      options: [
        { en: 'I did', tr: 'Ben', az: 'Mən' },
        { en: 'They did', tr: 'O', az: 'O' },
        { en: 'It was a draw', tr: 'Berabere', az: 'Bərabərə' },
        { en: 'We did not finish', tr: 'Bitiremedik', az: 'Bitirə bilmədik' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 10 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 8 }] },
    ],
  },
  {
    id: 'junior-play-ball-friend',
    category: 'outdoor',
    minutes: 12,
    stars: 13,
    emoji: '🏐',
    interests: ['football'],
    ageBands: ['6-9'],
    place: 'outdoor',
    title: { en: 'Ball with a friend', tr: 'Arkadaşınla top', az: 'Dostunla top' },
    body: {
      en: 'Go outside and play ball with a friend. Phone in a zipped pocket, where it can feel the game.',
      tr: 'Dışarı çık ve bir arkadaşınla top oyna. Telefon fermuarlı cepte, oyunu hissedebileceği yerde.',
      az: 'Çölə çıx və dostunla top oyna. Telefon fermuarlı cibdə, oyunu hiss edə biləcəyi yerdə.',
    },
    tip: {
      en: 'Stay where a grown up said you can play.',
      tr: 'Bir büyüğün izin verdiği yerde kal.',
      az: 'Böyüklərin icazə verdiyi yerdə qal.',
    },
    check: {
      question: { en: 'What did you play?', tr: 'Ne oynadınız?', az: 'Nə oynadınız?' },
      options: [
        { en: 'Football', tr: 'Futbol', az: 'Futbol' },
        { en: 'Catch', tr: 'Yakalamaca', az: 'Tutmaca' },
        { en: 'Keepy-uppy', tr: 'Sektirmece', az: 'Havada saxlama' },
        { en: 'A game we made up', tr: 'Kendi uydurduğumuz oyun', az: 'Özümüz uydurduğumuz oyun' },
      ],
    },
    checks: [{ kind: 'active', minutes: 6 }, { kind: 'answer' }],
  },
  {
    id: 'junior-play-wordchain',
    category: 'social',
    minutes: 8,
    stars: 10,
    emoji: '🔗',
    interests: [],
    ageBands: ['6-9'],
    mode: 'duo',
    title: { en: 'Word chain', tr: 'Kelime zinciri', az: 'Söz zənciri' },
    body: {
      en: 'Play word chain with your family: every word starts with the last letter of the one before.',
      tr: 'Ailenle kelime zinciri oyna: her kelime bir öncekinin son harfiyle başlar.',
      az: 'Ailənlə söz zənciri oyna: hər söz əvvəlkinin son hərfi ilə başlayır.',
    },
    parentBrief: {
      en: 'Word chain, out loud, as long as you can make it. At the end you can say yes with your parent code.',
      tr: 'Sesli kelime zinciri, uzatabildiğiniz kadar. Sonunda ebeveyn kodunuzla onaylayabilirsiniz.',
      az: 'Ucadan söz zənciri, uzada bildiyiniz qədər. Sonda valideyn kodunuzla təsdiqləyə bilərsiniz.',
    },
    answer: {
      kind: 'count',
      question: {
        en: 'How long was your longest chain?',
        tr: 'En uzun zinciriniz kaç kelimeydi?',
        az: 'Ən uzun zənciriniz neçə söz oldu?',
      },
      min: 0,
      max: 100,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 4 }] },
    ],
  },
  {
    id: 'junior-play-story-turns',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '📜',
    interests: ['books'],
    ageBands: ['6-9'],
    mode: 'duo',
    title: { en: 'A story, one line each', tr: 'Sırayla hikâye', az: 'Növbəli hekayə' },
    body: {
      en: 'Make up a story with someone at home, one sentence each, turn by turn.',
      tr: 'Evden biriyle sırayla, birer cümleyle bir hikâye uydur.',
      az: 'Evdən biri ilə növbə ilə, bir-bir cümlə deyərək hekayə qur.',
    },
    parentBrief: {
      en: 'A story made up together, one sentence each. Say yes with your parent code when you reach the end.',
      tr: 'Birlikte, birer cümleyle uydurulan bir hikâye. Sona gelince ebeveyn kodunuzla onaylayın.',
      az: 'Birlikdə, bir-bir cümlə ilə qurulan hekayə. Sona çatanda valideyn kodunuzla təsdiqləyin.',
    },
    check: {
      question: { en: 'How did your story end?', tr: 'Hikâyeniz nasıl bitti?', az: 'Hekayəniz necə bitdi?' },
      options: [
        { en: 'Happily', tr: 'Mutlu', az: 'Xoşbəxt' },
        { en: 'With a big surprise', tr: 'Büyük bir sürprizle', az: 'Böyük sürprizlə' },
        { en: 'Funnily', tr: 'Komik', az: 'Gülməli' },
        { en: 'It is still going', tr: 'Hâlâ devam ediyor', az: 'Hələ də davam edir' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 5 }] },
    ],
  },
  {
    id: 'junior-play-team-task',
    category: 'social',
    minutes: 12,
    stars: 13,
    emoji: '🛠️',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    mode: 'duo',
    title: { en: 'A ten minute team job', tr: 'On dakikalık takım işi', az: 'On dəqiqəlik komanda işi' },
    body: {
      en: 'Pick a job at home that is too big for one person, and do it together for ten minutes.',
      tr: 'Evde tek kişiye fazla gelen bir iş seçin ve on dakika birlikte yapın.',
      az: 'Evdə bir nəfərə çətin olan bir iş seçin və on dəqiqə birlikdə görün.',
    },
    parentBrief: {
      en: 'Ten minutes on one job that needs two people. Let them choose their half of it. Your parent code says yes at the end.',
      tr: 'İki kişi gerektiren bir işte on dakika. Kendi yarısını seçmesine izin verin. Sonunda ebeveyn kodunuz onaylar.',
      az: 'İki nəfər tələb edən bir işdə on dəqiqə. Öz payını seçməsinə imkan verin. Sonda valideyn kodunuz təsdiqləyir.',
    },
    pick: {
      question: {
        en: 'What did you do together?',
        tr: 'Birlikte ne yaptınız?',
        az: 'Birlikdə nə etdiniz?',
      },
      options: [
        { en: 'Cooked something', tr: 'Bir şey pişirdik', az: 'Nəsə bişirdik' },
        { en: 'Tidied a room', tr: 'Bir odayı topladık', az: 'Bir otağı yığışdırdıq' },
        { en: 'Built something', tr: 'Bir şey yaptık', az: 'Nəsə düzəltdik' },
        { en: 'Sorted the washing', tr: 'Çamaşırları ayırdık', az: 'Paltarları ayırdıq' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
      min: 1,
    },
    checks: [
      { kind: 'clock', minutes: 8 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 6 }] },
    ],
  },

  /* ============================================ 2.8 nature detectives */
  {
    id: 'junior-nature-leaves',
    category: 'outdoor',
    minutes: 12,
    stars: 13,
    emoji: '🍂',
    interests: ['nature'],
    ageBands: ['6-9'],
    place: 'outdoor',
    title: { en: 'Three different leaves', tr: 'Üç farklı yaprak', az: 'Üç fərqli yarpaq' },
    body: {
      en: 'Go outside with a grown up and find three leaves that are not the same. Lay them side by side and look at what is different.',
      tr: 'Bir büyükle dışarı çık ve birbirinin aynısı olmayan üç yaprak bul. Yan yana diz ve nelerin farklı olduğuna bak.',
      az: 'Bir böyüklə çölə çıx və bir-birinin eyni olmayan üç yarpaq tap. Yan-yana düz və nələrin fərqli olduğuna bax.',
    },
    steps: [
      {
        en: 'Find three leaves that look different from each other.',
        tr: 'Birbirinden farklı görünen üç yaprak bul.',
        az: 'Bir-birindən fərqli görünən üç yarpaq tap.',
      },
      {
        en: 'Lay them out from the biggest to the smallest.',
        tr: 'En büyükten en küçüğe diz.',
        az: 'Ən böyükdən ən kiçiyə düz.',
      },
      {
        en: 'Tick what is different about them.',
        tr: 'Aralarındaki farkları işaretle.',
        az: 'Aralarındakı fərqləri işarələ.',
      },
    ],
    tip: {
      en: 'Leaves already on the ground. Nothing gets pulled off a tree.',
      tr: 'Yerdeki yapraklar. Ağaçtan hiçbir şey koparmıyoruz.',
      az: 'Yerdəki yarpaqlar. Ağacdan heç nə qoparılmır.',
    },
    pick: {
      question: {
        en: 'What is different about them?',
        tr: 'Aralarındaki fark ne?',
        az: 'Aralarındakı fərq nədir?',
      },
      options: [
        { en: 'The shape', tr: 'Şekli', az: 'Forması' },
        { en: 'The size', tr: 'Boyu', az: 'Ölçüsü' },
        { en: 'The colour', tr: 'Rengi', az: 'Rəngi' },
        { en: 'The edges', tr: 'Kenarları', az: 'Kənarları' },
        { en: 'How they feel', tr: 'Dokusu', az: 'Toxunuşu' },
      ],
      min: 2,
    },
    // "Evdən kənar tapşırıqlar üçün valideyn təsdiqi məcburidir": every mission
    // in this strand that leaves the house asks for the parent code on the
    // spot, and it is never offered as the alternative to something else.
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'picked', count: 2 },
      { kind: 'photo' },
      { kind: 'grownup' },
    ],
  },
  {
    id: 'junior-nature-sounds',
    category: 'outdoor',
    minutes: 10,
    stars: 11,
    emoji: '🔊',
    interests: ['nature'],
    ageBands: ['6-9'],
    place: 'outdoor',
    title: { en: 'Five sounds outside', tr: 'Dışarıda beş ses', az: 'Çöldə beş səs' },
    body: {
      en: 'Stand still outside with a grown up, put the phone down and listen. Tick every different sound you hear.',
      tr: 'Bir büyükle dışarıda kıpırdamadan dur, telefonu bırak ve dinle. Duyduğun her farklı sesi işaretle.',
      az: 'Bir böyüklə çöldə tərpənmədən dur, telefonu yerə qoy və qulaq as. Eşitdiyin hər fərqli səsi işarələ.',
    },
    steps: [
      {
        en: 'Put the phone down and stay still.',
        tr: 'Telefonu bırak ve kıpırdama.',
        az: 'Telefonu qoy və tərpənmə.',
      },
      {
        en: 'Listen for as long as you can without talking.',
        tr: 'Konuşmadan, dayanabildiğin kadar dinle.',
        az: 'Danışmadan, bacardığın qədər qulaq as.',
      },
      {
        en: 'Tick the five you are sure about.',
        tr: 'Emin olduğun beş tanesini işaretle.',
        az: 'Əmin olduğun beşini işarələ.',
      },
    ],
    tip: {
      en: 'Nothing is recorded. The phone is not listening, you are.',
      tr: 'Hiçbir ses kaydedilmiyor. Dinleyen telefon değil, sensin.',
      az: 'Heç bir səs yazılmır. Qulaq asan telefon deyil, sənsən.',
    },
    pick: {
      question: {
        en: 'What did you hear?',
        tr: 'Ne duydun?',
        az: 'Nə eşitdin?',
      },
      options: [
        { en: 'A bird', tr: 'Bir kuş', az: 'Bir quş' },
        { en: 'The wind', tr: 'Rüzgar', az: 'Külək' },
        { en: 'Leaves', tr: 'Yapraklar', az: 'Yarpaqlar' },
        { en: 'Water', tr: 'Su', az: 'Su' },
        { en: 'An insect', tr: 'Bir böcek', az: 'Bir həşərat' },
        { en: 'Rain', tr: 'Yağmur', az: 'Yağış' },
        { en: 'An animal', tr: 'Bir hayvan', az: 'Bir heyvan' },
        { en: 'Something else', tr: 'Başka bir şey', az: 'Başqa bir şey' },
      ],
      min: 5,
    },
    checks: [
      { kind: 'away', minutes: 5 },
      { kind: 'picked', count: 5 },
      { kind: 'grownup' },
    ],
  },
  {
    id: 'junior-nature-clouds',
    category: 'create',
    minutes: 12,
    stars: 13,
    emoji: '☁️',
    interests: ['nature', 'drawing'],
    ageBands: ['6-9'],
    place: 'outdoor',
    title: { en: 'Draw the clouds', tr: 'Bulutları çiz', az: 'Buludları çək' },
    body: {
      en: 'Go outside with a grown up and look up. Draw the shape of one cloud exactly as you see it, then give it a name.',
      tr: 'Bir büyükle dışarı çık ve yukarı bak. Bir bulutun şeklini gördüğün gibi çiz, sonra ona bir isim ver.',
      az: 'Bir böyüklə çölə çıx və yuxarı bax. Bir buludun formasını gördüyün kimi çək, sonra ona ad ver.',
    },
    steps: [
      {
        en: 'Find a cloud that looks like something.',
        tr: 'Bir şeye benzeyen bir bulut bul.',
        az: 'Bir şeyə bənzəyən bir bulud tap.',
      },
      {
        en: 'Draw its shape before it changes.',
        tr: 'Şekli değişmeden çiz.',
        az: 'Forması dəyişmədən çək.',
      },
      {
        en: 'Write the name you gave it underneath.',
        tr: 'Verdiğin ismi altına yaz.',
        az: 'Verdiyin adı altına yaz.',
      },
    ],
    check: {
      question: {
        en: 'What did your cloud look like?',
        tr: 'Bulutun neye benziyordu?',
        az: 'Buludun nəyə bənzəyirdi?',
      },
      options: [
        { en: 'An animal', tr: 'Bir hayvana', az: 'Bir heyvana' },
        { en: 'A face', tr: 'Bir yüze', az: 'Bir üzə' },
        { en: 'A mountain', tr: 'Bir dağa', az: 'Bir dağa' },
        {
          en: 'Nothing anyone has seen',
          tr: 'Kimsenin görmediği bir şeye',
          az: 'Heç kimin görmədiyi bir şeyə',
        },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 6 },
      { kind: 'photo' },
      { kind: 'answer' },
      { kind: 'grownup' },
    ],
  },
  {
    id: 'junior-nature-birds',
    category: 'outdoor',
    minutes: 12,
    stars: 13,
    emoji: '🐦',
    interests: ['nature', 'animals'],
    ageBands: ['6-9'],
    place: 'outdoor',
    title: { en: 'Two different birds', tr: 'İki farklı kuş', az: 'İki fərqli quş' },
    body: {
      en: 'From a spot a grown up picked, wait quietly until you have seen two birds that are not the same. Watch them, do not follow them.',
      tr: 'Bir büyüğün seçtiği bir yerden, birbirinin aynısı olmayan iki kuş görene kadar sessizce bekle. İzle, peşlerinden gitme.',
      az: 'Bir böyüyün seçdiyi bir yerdən, bir-birinin eyni olmayan iki quş görənə qədər səssizcə gözlə. İzlə, arxalarınca getmə.',
    },
    steps: [
      {
        en: 'Sit or stand somewhere you can see the sky.',
        tr: 'Gökyüzünü görebileceğin bir yere otur ya da dur.',
        az: 'Səmanı görə biləcəyin bir yerdə otur və ya dayan.',
      },
      {
        en: 'Wait for the first bird, then a different one.',
        tr: 'İlk kuşu bekle, sonra farklı bir tane daha.',
        az: 'Birinci quşu gözlə, sonra fərqli birini.',
      },
      {
        en: 'Tick what they did while you watched.',
        tr: 'İzlerken ne yaptıklarını işaretle.',
        az: 'İzləyərkən nə etdiklərini işarələ.',
      },
    ],
    tip: {
      en: 'Stay where the grown up can see you the whole time.',
      tr: 'Büyüğün seni görebileceği yerde kal.',
      az: 'Böyüyün səni görə biləcəyi yerdə qal.',
    },
    pick: {
      question: {
        en: 'What did the birds do?',
        tr: 'Kuşlar ne yaptı?',
        az: 'Quşlar nə etdi?',
      },
      options: [
        { en: 'Flew past', tr: 'Uçup geçti', az: 'Uçub keçdi' },
        { en: 'Hopped on the ground', tr: 'Yerde zıpladı', az: 'Yerdə hoppandı' },
        { en: 'Sat still', tr: 'Kıpırdamadan durdu', az: 'Tərpənmədən durdu' },
        { en: 'Ate something', tr: 'Bir şey yedi', az: 'Bir şey yedi' },
        { en: 'Made a sound', tr: 'Ses çıkardı', az: 'Səs çıxardı' },
      ],
      min: 2,
    },
    checks: [
      { kind: 'away', minutes: 5 },
      { kind: 'picked', count: 2 },
      { kind: 'grownup' },
    ],
  },
  {
    id: 'junior-nature-plant',
    category: 'calm',
    minutes: 8,
    stars: 9,
    emoji: '🌱',
    interests: ['nature', 'science'],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'Watch one plant', tr: 'Bir bitkiyi izle', az: 'Bir bitkini izlə' },
    body: {
      en: 'Pick one plant at home. Draw exactly what it looks like today and write the date on it. Keep the drawing: in three days you draw it again and compare.',
      tr: 'Evdeki bir bitkiyi seç. Bugün nasıl göründüğünü olduğu gibi çiz ve üzerine tarihi yaz. Çizimi sakla: üç gün sonra tekrar çizip karşılaştıracaksın.',
      az: 'Evdəki bir bitkini seç. Bugün necə göründüyünü olduğu kimi çək və üzərinə tarixi yaz. Rəsmi saxla: üç gün sonra yenidən çəkib müqayisə edəcəksən.',
    },
    steps: [
      {
        en: 'Choose one plant you can visit every day.',
        tr: 'Her gün bakabileceğin bir bitki seç.',
        az: 'Hər gün baxa biləcəyin bir bitki seç.',
      },
      {
        en: 'Count its leaves and draw it exactly.',
        tr: 'Yapraklarını say ve olduğu gibi çiz.',
        az: 'Yarpaqlarını say və olduğu kimi çək.',
      },
      {
        en: 'Write the date and put the drawing somewhere safe.',
        tr: 'Tarihi yaz ve çizimi güvenli bir yere koy.',
        az: 'Tarixi yaz və rəsmi etibarlı bir yerə qoy.',
      },
    ],
    check: {
      question: {
        en: 'What will you look for in three days?',
        tr: 'Üç gün sonra neye bakacaksın?',
        az: 'Üç gün sonra nəyə baxacaqsan?',
      },
      options: [
        { en: 'New leaves', tr: 'Yeni yapraklara', az: 'Yeni yarpaqlara' },
        { en: 'Whether it grew', tr: 'Büyüyüp büyümediğine', az: 'Böyüyüb-böyümədiyinə' },
        { en: 'The colour', tr: 'Rengine', az: 'Rənginə' },
        { en: 'If it needs water', tr: 'Suya ihtiyacı var mı', az: 'Suya ehtiyacı var, ya yox' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 4 },
      { kind: 'photo' },
      { kind: 'answer' },
    ],
  },

  /* ================================================= 2.9 kindness missions */
  {
    id: 'junior-kind-note',
    category: 'social',
    minutes: 8,
    stars: 10,
    emoji: '💌',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    title: { en: 'A thank you note', tr: 'Teşekkür notu', az: 'Təşəkkür qeydi' },
    body: {
      en: 'Write a thank you note to someone in your family and leave it where they will find it.',
      tr: 'Ailenden birine teşekkür notu yaz ve bulacağı bir yere bırak.',
      az: 'Ailəndən birinə təşəkkür qeydi yaz və tapacağı bir yerə qoy.',
    },
    steps: [
      {
        en: 'Think of one thing they did for you.',
        tr: 'Senin için yaptığı bir şeyi düşün.',
        az: 'Sənin üçün etdiyi bir şeyi fikirləş.',
      },
      { en: 'Write the note and sign it.', tr: 'Notu yaz ve altına adını yaz.', az: 'Qeydi yaz və altına adını yaz.' },
      {
        en: 'Leave it somewhere they will find it.',
        tr: 'Bulacağı bir yere bırak.',
        az: 'Tapacağı bir yerə qoy.',
      },
    ],
    pick: {
      question: { en: 'Who is it for?', tr: 'Kime yazdın?', az: 'Kimə yazdın?' },
      options: [
        { en: 'Mum', tr: 'Anneme', az: 'Anama' },
        { en: 'Dad', tr: 'Babama', az: 'Atama' },
        { en: 'A grandparent', tr: 'Büyükanne ya da büyükbabama', az: 'Nənəmə və ya babama' },
        { en: 'A brother or sister', tr: 'Kardeşime', az: 'Bacıma və ya qardaşıma' },
        { en: 'Someone else', tr: 'Başka birine', az: 'Başqa birinə' },
      ],
      min: 1,
    },
    checks: [
      { kind: 'clock', minutes: 4 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'away', minutes: 3 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-kind-share',
    category: 'social',
    minutes: 8,
    stars: 10,
    emoji: '🧸',
    interests: [],
    ageBands: ['6-9'],
    title: { en: 'Share a toy', tr: 'Bir oyuncağını paylaş', az: 'Oyuncağını paylaş' },
    body: {
      en: 'Pick one of your own toys and share it with someone for a whole game.',
      tr: 'Kendi oyuncaklarından birini seç ve bir oyun boyunca biriyle paylaş.',
      az: 'Öz oyuncaqlarından birini seç və bir oyun boyu biri ilə paylaş.',
    },
    pick: {
      question: { en: 'Who did you share with?', tr: 'Kiminle paylaştın?', az: 'Kiminlə paylaşdın?' },
      options: [
        { en: 'A brother or sister', tr: 'Kardeşimle', az: 'Bacım və ya qardaşımla' },
        { en: 'A friend', tr: 'Bir arkadaşımla', az: 'Bir dostumla' },
        { en: 'A cousin', tr: 'Kuzenimle', az: 'Əmim və ya dayım uşağı ilə' },
        { en: 'Someone else', tr: 'Başka biriyle', az: 'Başqa biri ilə' },
      ],
      min: 1,
    },
    check: {
      question: { en: 'How did it go?', tr: 'Nasıl geçti?', az: 'Necə keçdi?' },
      options: [
        { en: 'We both had fun', tr: 'İkimiz de eğlendik', az: 'İkimiz də əyləndik' },
        { en: 'They loved it', tr: 'Çok sevdi', az: 'Çox xoşuna gəldi' },
        { en: 'Sharing was hard', tr: 'Paylaşmak zordu', az: 'Paylaşmaq çətin oldu' },
        { en: 'We swapped toys', tr: 'Oyuncak değiştirdik', az: 'Oyuncaq dəyişdik' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 4 },
      { kind: 'picked', count: 1 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'away', minutes: 3 }, { kind: 'grownup' }] },
    ],
  },
  {
    id: 'junior-kind-sibling',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '🧒',
    interests: [],
    ageBands: ['6-9'],
    title: {
      en: 'Help someone smaller',
      tr: 'Küçük birine yardım et',
      az: 'Kiçik birinə kömək et',
    },
    body: {
      en: 'Find a younger brother, sister or cousin and help them with something they find hard.',
      tr: 'Küçük kardeşini ya da kuzenini bul ve zorlandığı bir şeyde ona yardım et.',
      az: 'Kiçik bacını, qardaşını və ya qohum uşağını tap və çətinlik çəkdiyi bir işdə ona kömək et.',
    },
    check: {
      question: { en: 'What did you help with?', tr: 'Ne konuda yardım ettin?', az: 'Nədə kömək etdin?' },
      options: [
        { en: 'Getting dressed', tr: 'Giyinmesine', az: 'Geyinməkdə' },
        { en: 'Tidying up', tr: 'Toplamasına', az: 'Yığışdırmaqda' },
        { en: 'A game or a puzzle', tr: 'Bir oyunda ya da yapbozda', az: 'Oyunda və ya pazlda' },
        { en: 'Something else', tr: 'Başka bir şeyde', az: 'Başqa bir şeydə' },
      ],
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'answer' },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 4 }] },
    ],
  },
  {
    id: 'junior-kind-word',
    category: 'social',
    minutes: 5,
    stars: 7,
    emoji: '💬',
    interests: [],
    ageBands: ['6-9'],
    title: { en: 'A kind word', tr: 'Güzel bir söz', az: 'Xoş bir söz' },
    body: {
      en: 'Say something kind to a friend today, out loud, to their face.',
      tr: 'Bugün bir arkadaşına güzel bir şey söyle, yüzüne, sesli olarak.',
      az: 'Bu gün dostuna xoş bir söz de, üzünə, ucadan.',
    },
    check: {
      question: { en: 'What did you say?', tr: 'Ne söyledin?', az: 'Nə dedin?' },
      options: [
        { en: 'Thank you', tr: 'Teşekkür ederim', az: 'Təşəkkür edirəm' },
        { en: 'Well done', tr: 'Aferin', az: 'Afərin' },
        { en: 'I am glad you are my friend', tr: 'Arkadaşım olduğun için mutluyum', az: 'Dostum olduğun üçün sevinirəm' },
        { en: 'Something else kind', tr: 'Başka güzel bir şey', az: 'Başqa xoş bir söz' },
      ],
    },
    checks: [{ kind: 'clock', minutes: 3 }, { kind: 'answer' }, { kind: 'away', minutes: 3 }],
  },
  {
    id: 'junior-kind-pet',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '🐾',
    interests: ['animals'],
    ageBands: ['6-9'],
    mode: 'duo',
    title: {
      en: 'Look after a pet together',
      tr: 'Birlikte evcil hayvana bak',
      az: 'Birlikdə ev heyvanına bax',
    },
    body: {
      en: 'Help a grown up look after a pet: water, food, brushing or a walk.',
      tr: 'Bir büyükle birlikte evcil hayvana bak: su, mama, tarama ya da yürüyüş.',
      az: 'Böyüklə birlikdə ev heyvanına bax: su, yem, daramaq və ya gəzinti.',
    },
    parentBrief: {
      en: 'Looking after the pet together. Show them what to do and let them do it. Your parent code says yes at the end.',
      tr: 'Evcil hayvana birlikte bakın. Ne yapılacağını gösterin ve bırakın kendisi yapsın. Sonunda ebeveyn kodunuz onaylar.',
      az: 'Ev heyvanına birlikdə baxın. Nə etmək lazım olduğunu göstərin və özü etsin. Sonda valideyn kodunuz təsdiqləyir.',
    },
    pick: {
      question: { en: 'What did you do?', tr: 'Neler yaptın?', az: 'Nələri etdin?' },
      options: [
        { en: 'Filled the water', tr: 'Suyunu doldurdum', az: 'Suyunu doldurdum' },
        { en: 'Gave food', tr: 'Mamasını verdim', az: 'Yemini verdim' },
        { en: 'Brushed them', tr: 'Taradım', az: 'Daradım' },
        { en: 'Cleaned up', tr: 'Temizledim', az: 'Təmizlədim' },
        { en: 'Went for a walk', tr: 'Yürüyüşe çıkardım', az: 'Gəzintiyə çıxartdım' },
        { en: 'Played with them', tr: 'Oynadım', az: 'Onunla oynadım' },
      ],
      min: 1,
    },
    checks: [
      { kind: 'clock', minutes: 5 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 4 }] },
    ],
  },

  /* ==================================================== 2.10 super team */
  {
    id: 'junior-team-screenfree',
    category: 'social',
    minutes: 30,
    stars: 26,
    emoji: '📵',
    interests: [],
    ageBands: ['6-9'],
    mode: 'duo',
    partsOfDay: ['afternoon', 'evening'],
    title: {
      en: 'Half an hour, no screens',
      tr: 'Yarım saat, ekransız',
      az: 'Yarım saat, ekransız',
    },
    body: {
      en: 'Put every screen down for half an hour and be together. I will count the quiet time on this one.',
      tr: 'Yarım saat boyunca bütün ekranları bırakın ve birlikte olun. Sessiz zamanı bu telefondan sayarım.',
      az: 'Yarım saat bütün ekranları kənara qoyun və birlikdə olun. Sakit vaxtı bu telefonda sayacağam.',
    },
    parentBrief: {
      en: 'Half an hour with the phones down, together. This phone counts the time it spends lying face down, and your parent code says yes at the end.',
      tr: 'Telefonlar bir kenarda, birlikte yarım saat. Bu telefon yüzüstü durduğu süreyi sayar, sonunda ebeveyn kodunuz onaylar.',
      az: 'Telefonlar kənarda, birlikdə yarım saat. Bu telefon üzüaşağı qaldığı vaxtı sayır, sonda valideyn kodunuz təsdiqləyir.',
    },
    tip: {
      en: 'Cards, cooking, a walk, a jigsaw. Anything but screens.',
      tr: 'Kart, yemek, yürüyüş, yapboz. Ekran dışında her şey.',
      az: 'Kart, yemək, gəzinti, pazl. Ekrandan başqa hər şey.',
    },
    checks: [{ kind: 'away', minutes: 25 }, { kind: 'grownup' }],
  },
  {
    id: 'junior-team-steps',
    category: 'move',
    minutes: 15,
    stars: 16,
    emoji: '👟',
    interests: [],
    ageBands: ['6-9'],
    title: {
      en: 'A thousand steps as a team',
      tr: 'Takımca bin adım',
      az: 'Komanda ilə min addım',
    },
    body: {
      en: 'Walk a thousand steps with a friend or your family. Phone in your pocket: it counts your part of the team.',
      tr: 'Bir arkadaşınla ya da ailenle bin adım yürü. Telefon cebinde: takımdaki senin payını sayar.',
      az: 'Dostunla və ya ailənlə min addım yeri. Telefon cibində: komandada sənin payını sayır.',
    },
    tip: {
      en: 'Everyone walks together. This phone counts the steps it can feel, which are yours.',
      tr: 'Herkes birlikte yürür. Bu telefon hissettiği adımları, yani senin adımlarını sayar.',
      az: 'Hamı birlikdə yeriyir. Bu telefon hiss etdiyi addımları, yəni sənin addımlarını sayır.',
    },
    checks: [{ kind: 'steps', count: 1000 }],
  },
  {
    id: 'junior-team-room',
    category: 'social',
    minutes: 15,
    stars: 16,
    emoji: '🧹',
    interests: [],
    ageBands: ['6-9'],
    place: 'indoor',
    mode: 'duo',
    beforePhoto: true,
    title: { en: 'Tidy a room as a team', tr: 'Takımca bir odayı topla', az: 'Komanda ilə otağı səliqəyə sal' },
    body: {
      en: 'Pick one room and tidy it together with your family. Share the jobs out before you start.',
      tr: 'Bir oda seçin ve ailenizle birlikte toplayın. Başlamadan önce işleri paylaşın.',
      az: 'Bir otaq seçin və ailənizlə birlikdə səliqəyə salın. Başlamazdan əvvəl işləri bölün.',
    },
    parentBrief: {
      en: 'One room, tidied together, with the jobs shared out first. Your parent code says yes at the end.',
      tr: 'Bir oda, işler önceden paylaşılarak birlikte toplanır. Sonunda ebeveyn kodunuz onaylar.',
      az: 'Bir otaq, işlər əvvəlcədən bölünərək birlikdə səliqəyə salınır. Sonda valideyn kodunuz təsdiqləyir.',
    },
    pick: {
      question: { en: 'What was your job?', tr: 'Senin işin neydi?', az: 'Sənin işin nə idi?' },
      options: [
        { en: 'Things off the floor', tr: 'Yerdekileri kaldırmak', az: 'Yerdəkiləri yığmaq' },
        { en: 'Putting things away', tr: 'Eşyaları yerine koymak', az: 'Əşyaları yerinə qoymaq' },
        { en: 'Wiping', tr: 'Silmek', az: 'Silmək' },
        { en: 'Sorting into piles', tr: 'Öbeklere ayırmak', az: 'Topalara ayırmaq' },
        { en: 'Bins and recycling', tr: 'Çöp ve geri dönüşüm', az: 'Zibil və təkrar emal' },
      ],
      min: 1,
    },
    checks: [
      { kind: 'clock', minutes: 8 },
      { kind: 'picked', count: 1 },
      { kind: 'either', of: [{ kind: 'grownup' }, { kind: 'away', minutes: 6 }, { kind: 'photo' }] },
    ],
  },
  {
    id: 'junior-team-bookweek',
    category: 'calm',
    minutes: 10,
    stars: 12,
    emoji: '📚',
    interests: ['books'],
    ageBands: ['6-9'],
    mode: 'duo',
    title: {
      en: 'Three book hours this week',
      tr: 'Bu hafta üç kitap saati',
      az: 'Bu həftə üç kitab saatı',
    },
    body: {
      en: 'Your team has done three book missions this week. Sit down together and tell each other the best bit.',
      tr: 'Takımın bu hafta üç kitap görevi yaptı. Birlikte oturun ve en güzel yeri birbirinize anlatın.',
      az: 'Komandan bu həftə üç kitab tapşırığı yerinə yetirdi. Birlikdə oturun və ən maraqlı yeri bir-birinizə danışın.',
    },
    parentBrief: {
      en: 'Three book missions in one week, done. Ask for the best bit of each, then say yes with your parent code.',
      tr: 'Bir haftada üç kitap görevi tamam. Her birinin en güzel yerini sorun, sonra ebeveyn kodunuzla onaylayın.',
      az: 'Bir həftədə üç kitab tapşırığı tamamdır. Hər birinin ən maraqlı yerini soruşun, sonra valideyn kodunuzla təsdiqləyin.',
    },
    checks: [{ kind: 'tally', missions: 'junior-book-', count: 3 }, { kind: 'grownup' }],
  },
  {
    id: 'junior-team-kindweek',
    category: 'social',
    minutes: 10,
    stars: 12,
    emoji: '💚',
    interests: [],
    ageBands: ['6-9'],
    mode: 'duo',
    title: {
      en: 'Five kind things this week',
      tr: 'Bu hafta beş iyilik',
      az: 'Bu həftə beş yaxşılıq',
    },
    body: {
      en: 'Your team has done five kindness missions this week. Say out loud who each one was for.',
      tr: 'Takımın bu hafta beş iyilik görevi yaptı. Her birinin kime olduğunu yüksek sesle söyleyin.',
      az: 'Komandan bu həftə beş yaxşılıq tapşırığı etdi. Hər birinin kimə olduğunu ucadan deyin.',
    },
    parentBrief: {
      en: 'Five kindness missions in one week. Hear who each one was for, then say yes with your parent code. Nothing is scored on how big they were.',
      tr: 'Bir haftada beş iyilik görevi. Her birinin kime olduğunu dinleyin, sonra ebeveyn kodunuzla onaylayın. Ne kadar büyük oldukları puanlanmaz.',
      az: 'Bir həftədə beş yaxşılıq tapşırığı. Hər birinin kimə olduğunu dinləyin, sonra valideyn kodunuzla təsdiqləyin. Onların böyüklüyünə görə bal verilmir.',
    },
    checks: [{ kind: 'tally', missions: 'junior-kind-', count: 5 }, { kind: 'grownup' }],
  },
];
