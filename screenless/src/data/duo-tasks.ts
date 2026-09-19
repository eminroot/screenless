import type { LibraryTask } from './tasks';

/**
 * Missions that need a grown up in the room.
 *
 * These exist because of the problem the app was built around: the phone is
 * usually handed over to buy ten quiet minutes. A duo mission spends those ten
 * minutes together instead, so the parent gets the quiet and the child gets the
 * parent. Every one carries a `parentBrief`, which is the only part the grown up
 * reads before handing the phone back.
 */
export const duoTasks: LibraryTask[] = [
  {
    id: 'duo-hide',
    category: 'social',
    mode: 'duo',
    minutes: 10,
    stars: 12,
    emoji: '🔍',
    interests: [],
    ageBands: ['3-5', '6-9', '10-13'],
    partsOfDay: ['afternoon', 'evening'],
    place: 'indoor',
    title: {
      en: 'The hidden toy',
      tr: 'Saklanan oyuncak',
      az: 'Gizlədilmiş oyuncaq',
    },
    body: {
      en: 'A grown up hides one toy in the room. You have three minutes to find it.',
      tr: 'Bir büyük odaya bir oyuncak saklar. Bulmak için üç dakikan var.',
      az: 'Böyüklərdən biri otaqda bir oyuncaq gizlədir. Tapmaq üçün üç dəqiqən var.',
    },
    steps: [
      {
        en: 'Turn around and count to twenty out loud.',
        tr: 'Arkanı dön ve yüksek sesle yirmiye kadar say.',
        az: 'Arxanı çevir və ucadan iyirmiyə qədər say.',
      },
      {
        en: 'Start looking. The grown up says hot or cold.',
        tr: 'Aramaya başla. Büyüğün sana sıcak ya da soğuk desin.',
        az: 'Axtarmağa başla. Böyük sənə isti və ya soyuq desin.',
      },
      {
        en: 'Found it? Now you hide it and they look.',
        tr: 'Buldun mu? Şimdi sen sakla, o arasın.',
        az: 'Tapdın? İndi sən gizlət, o axtarsın.',
      },
    ],
    parentBrief: {
      en: 'Hide one small toy somewhere reachable in this room while your child counts. Guide them with hot and cold, then swap roles.',
      tr: 'Çocuğunuz sayarken bu odada uzanabileceği bir yere küçük bir oyuncak saklayın. Sıcak soğuk diyerek yönlendirin, sonra sıra değiştirin.',
      az: 'Uşağınız sayarkən bu otaqda əli çatan bir yerə kiçik oyuncaq gizlədin. İsti soyuq deyərək yönləndirin, sonra rolları dəyişin.',
    },
  },
  {
    id: 'duo-tower',
    category: 'create',
    mode: 'duo',
    minutes: 12,
    stars: 14,
    emoji: '🗼',
    interests: ['building'],
    ageBands: ['3-5', '6-9', '10-13'],
    place: 'indoor',
    proof: 'photo',
    objects: ['blocks', 'box', 'cup', 'book'],
    title: {
      en: 'Tallest tower',
      tr: 'En yüksek kule',
      az: 'Ən hündür qüllə',
    },
    body: {
      en: 'You and a grown up each build a tower from things in the room. Whose stays up longest?',
      tr: 'Sen ve bir büyük, odadaki eşyalarla birer kule yapın. Kimin kulesi daha uzun ayakta kalıyor?',
      az: 'Sən və böyüklərdən biri otaqdakı əşyalarla qüllə qurun. Kimin qülləsi daha uzun dayanır?',
    },
    steps: [
      {
        en: 'Each of you gathers eight things that stack.',
        tr: 'Her biriniz üst üste konabilen sekiz şey toplayın.',
        az: 'Hər biriniz üst-üstə qoyula bilən səkkiz şey toplayın.',
      },
      {
        en: 'Build. No holding it up with your hands.',
        tr: 'Kuleyi yapın. Elle tutmak yok.',
        az: 'Qülləni qurun. Əllə tutmaq yoxdur.',
      },
      {
        en: 'Count to ten. Still standing? Take a photo of it.',
        tr: 'Ona kadar sayın. Hâlâ ayakta mı? Fotoğrafını çek.',
        az: 'Ona qədər sayın. Hələ ayaqdadır? Şəklini çək.',
      },
    ],
    parentBrief: {
      en: 'Build one too. Losing on purpose is allowed once, not twice.',
      tr: 'Siz de bir kule yapın. Bilerek kaybetmek bir kez serbest, iki kez değil.',
      az: 'Siz də bir qüllə qurun. Bilərəkdən uduzmaq bir dəfə olar, iki dəfə yox.',
    },
  },
  {
    id: 'duo-plane',
    category: 'create',
    mode: 'duo',
    minutes: 12,
    stars: 13,
    emoji: '✈️',
    interests: ['building', 'science'],
    ageBands: ['6-9', '10-13'],
    place: 'indoor',
    objects: ['paper'],
    title: {
      en: 'Whose plane wins',
      tr: 'Kimin uçağı kazanır',
      az: 'Kimin təyyarəsi udur',
    },
    body: {
      en: 'Fold a paper plane each and throw them from the same spot three times.',
      tr: 'İkiniz de birer kağıt uçak katlayın ve aynı yerden üç kez atın.',
      az: 'Hər ikiniz kağız təyyarə qatlayın və eyni yerdən üç dəfə atın.',
    },
    steps: [
      {
        en: 'Fold one plane each. Different shapes are better.',
        tr: 'Her biriniz bir uçak katlayın. Şekilleri farklı olsun.',
        az: 'Hər biriniz bir təyyarə qatlayın. Formaları fərqli olsun.',
      },
      {
        en: 'Mark a throwing line with a shoe.',
        tr: 'Bir ayakkabı ile atış çizgisi yapın.',
        az: 'Bir ayaqqabı ilə atış xətti düzəldin.',
      },
      {
        en: 'Three throws each. Longest one wins.',
        tr: 'Üçer atış. En uzağa giden kazanır.',
        az: 'Hərəyə üç atış. Ən uzağa gedən udur.',
      },
      {
        en: 'Change one fold on the loser and try again.',
        tr: 'Kaybeden uçakta bir katı değiştirin ve tekrar deneyin.',
        az: 'Uduzan təyyarədə bir qatı dəyişin və yenidən sınayın.',
      },
    ],
    parentBrief: {
      en: 'Fold yours differently on purpose. The point they should reach is that the shape changes the flight.',
      tr: 'Sizinkini bilerek farklı katlayın. Ulaşmalarını istediğimiz fikir şu: şekil uçuşu değiştiriyor.',
      az: 'Sizinkini qəsdən fərqli qatlayın. Çatmaları lazım olan fikir budur: forma uçuşu dəyişir.',
    },
  },
  {
    id: 'duo-colour',
    category: 'social',
    mode: 'duo',
    minutes: 8,
    stars: 9,
    emoji: '🎨',
    interests: ['drawing'],
    ageBands: ['3-5', '6-9'],
    place: 'indoor',
    title: {
      en: 'Five of one colour',
      tr: 'Aynı renkten beş tane',
      az: 'Eyni rəngdən beş dənə',
    },
    body: {
      en: 'A grown up picks a colour. Both of you find five things in that colour before the timer ends.',
      tr: 'Bir büyük bir renk seçsin. İkiniz de süre bitmeden o renkten beş şey bulun.',
      az: 'Böyük bir rəng seçsin. Hər ikiniz vaxt bitməmiş o rəngdən beş şey tapın.',
    },
    steps: [
      {
        en: 'The grown up says one colour out loud.',
        tr: 'Büyük yüksek sesle bir renk söylesin.',
        az: 'Böyük ucadan bir rəng desin.',
      },
      {
        en: 'Both of you go hunting at the same time.',
        tr: 'İkiniz aynı anda aramaya başlayın.',
        az: 'Hər ikiniz eyni anda axtarmağa başlayın.',
      },
      {
        en: 'Line up what you found and count together.',
        tr: 'Bulduklarınızı yan yana dizin ve birlikte sayın.',
        az: 'Tapdıqlarınızı yan-yana düzün və birlikdə sayın.',
      },
    ],
    parentBrief: {
      en: 'Pick a colour that is in the room but not everywhere. Green or blue usually works.',
      tr: 'Odada olan ama her yerde olmayan bir renk seçin. Genelde yeşil ya da mavi iyi gider.',
      az: 'Otaqda olan, amma hər yerdə olmayan bir rəng seçin. Adətən yaşıl və ya mavi yaxşı olur.',
    },
  },
  {
    id: 'duo-mirror',
    category: 'move',
    mode: 'duo',
    minutes: 8,
    stars: 9,
    emoji: '🪞',
    interests: ['dance'],
    ageBands: ['3-5', '6-9', '10-13'],
    place: 'indoor',
    title: {
      en: 'Copy the mirror',
      tr: 'Aynayı taklit et',
      az: 'Güzgünü təkrarla',
    },
    body: {
      en: 'Stand face to face with a grown up. One moves slowly, the other copies exactly.',
      tr: 'Bir büyükle karşı karşıya durun. Biri yavaşça hareket etsin, diğeri birebir taklit etsin.',
      az: 'Böyüklə üz-üzə durun. Biri yavaş hərəkət etsin, digəri eynilə təkrarlasın.',
    },
    steps: [
      {
        en: 'Face each other, one arm apart.',
        tr: 'Bir kol boyu mesafede karşı karşıya durun.',
        az: 'Bir qol məsafəsində üz-üzə durun.',
      },
      {
        en: 'The grown up leads for one minute. Copy everything.',
        tr: 'Bir dakika büyük yönetsin. Her şeyi taklit et.',
        az: 'Bir dəqiqə böyük aparsın. Hər şeyi təkrarla.',
      },
      { en: 'Swap. Now you lead.', tr: 'Değişin. Şimdi sen yönet.', az: 'Dəyişin. İndi sən apar.' },
      {
        en: 'Last round: go as slowly as you possibly can.',
        tr: 'Son tur: olabildiğince yavaş hareket edin.',
        az: 'Son tur: mümkün qədər yavaş hərəkət edin.',
      },
    ],
    parentBrief: {
      en: 'Slow is the whole game. Big fast moves end it in ten seconds.',
      tr: 'Oyunun tamamı yavaşlıkta. Hızlı büyük hareketler oyunu on saniyede bitirir.',
      az: 'Oyunun bütün məğzi yavaşlıqdadır. Sürətli iri hərəkətlər oyunu on saniyəyə bitirir.',
    },
  },
  {
    id: 'duo-story',
    category: 'calm',
    mode: 'duo',
    minutes: 12,
    stars: 12,
    emoji: '📖',
    interests: ['books', 'drawing'],
    ageBands: ['3-5', '6-9', '10-13'],
    partsOfDay: ['evening'],
    place: 'indoor',
    title: {
      en: 'When you were small',
      tr: 'Sen küçükken',
      az: 'Sən balaca olanda',
    },
    body: {
      en: 'Ask a grown up for a story from when they were your age. Then draw the best part.',
      tr: 'Bir büyükten senin yaşındayken yaşadığı bir anı iste. Sonra en güzel yerini çiz.',
      az: 'Böyükdən sənin yaşında olarkən başına gələn bir əhvalat istə. Sonra ən gözəl yerini çək.',
    },
    steps: [
      {
        en: 'Ask: what did you do for fun at my age?',
        tr: 'Sor: benim yaşımdayken eğlenmek için ne yapardın?',
        az: 'Soruş: mənim yaşımda olanda əylənmək üçün nə edirdin?',
      },
      { en: 'Listen all the way through.', tr: 'Sonuna kadar dinle.', az: 'Sonuna qədər dinlə.' },
      {
        en: 'Draw the part you liked most.',
        tr: 'En sevdiğin kısmı çiz.',
        az: 'Ən çox bəyəndiyin hissəni çək.',
      },
      { en: 'Show them the drawing.', tr: 'Çizimi ona göster.', az: 'Şəkli ona göstər.' },
    ],
    parentBrief: {
      en: 'One real memory beats a good story. Something small is fine: a street, a game, a bike.',
      tr: 'Gerçek bir anı, güzel bir hikâyeden iyidir. Küçük bir şey de olur: bir sokak, bir oyun, bir bisiklet.',
      az: 'Bir gerçək xatirə gözəl nağıldan yaxşıdır. Kiçik bir şey də olar: bir küçə, bir oyun, bir velosiped.',
    },
  },
  {
    id: 'duo-kitchen',
    category: 'social',
    mode: 'duo',
    minutes: 15,
    stars: 15,
    emoji: '🍽️',
    interests: ['cooking'],
    ageBands: ['6-9', '10-13'],
    partsOfDay: ['evening'],
    place: 'indoor',
    title: {
      en: 'Table crew',
      tr: 'Sofra ekibi',
      az: 'Süfrə komandası',
    },
    body: {
      en: 'Set the table with a grown up. You carry, they place, and nothing gets dropped.',
      tr: 'Bir büyükle sofrayı kur. Sen taşı, o yerleştirsin, hiçbir şey düşmesin.',
      az: 'Böyüklə süfrəni aç. Sən daşı, o düzsün, heç nə yerə düşməsin.',
    },
    steps: [
      {
        en: 'Ask what goes on the table tonight.',
        tr: 'Bu akşam sofraya ne konacak diye sor.',
        az: 'Bu axşam süfrəyə nə qoyulacağını soruş.',
      },
      {
        en: 'Carry things over one trip at a time.',
        tr: 'Her seferinde bir sefer yaparak taşı.',
        az: 'Hər dəfə bir gediş edərək daşı.',
      },
      {
        en: 'Count how many trips it took.',
        tr: 'Kaç sefer yaptığını say.',
        az: 'Neçə gediş etdiyini say.',
      },
      {
        en: 'Beat that number next time.',
        tr: 'Bir dahaki sefere bu sayıyı geç.',
        az: 'Növbəti dəfə bu sayı keç.',
      },
    ],
    parentBrief: {
      en: 'Hand over the unbreakable things only. The trip count is what makes it a game.',
      tr: 'Sadece kırılmayacak şeyleri verin. Oyun hâline getiren şey sefer sayısı.',
      az: 'Yalnız sınmayan şeyləri verin. Oyuna çevirən şey gediş sayıdır.',
    },
  },
  {
    id: 'duo-course',
    category: 'move',
    mode: 'duo',
    minutes: 12,
    stars: 15,
    emoji: '🏁',
    interests: ['football', 'dance'],
    ageBands: ['3-5', '6-9', '10-13'],
    place: 'indoor',
    proof: 'motion',
    motion: { kind: 'jump', count: 10 },
    objects: ['pillow', 'chair', 'box'],
    title: {
      en: 'Cushion course',
      tr: 'Yastık parkuru',
      az: 'Yastıq marşrutu',
    },
    body: {
      en: 'A grown up builds a course out of cushions. Run it, then finish with ten jumps.',
      tr: 'Bir büyük yastıklardan bir parkur kursun. Parkuru koş, sonunda on kere zıpla.',
      az: 'Böyük yastıqlardan marşrut qursun. Marşrutu qaç, sonunda on dəfə tullan.',
    },
    steps: [
      {
        en: 'Wait while the course is built.',
        tr: 'Parkur kurulurken bekle.',
        az: 'Marşrut qurularkən gözlə.',
      },
      { en: 'Run it once, slowly.', tr: 'Bir kez yavaşça koş.', az: 'Bir dəfə yavaşca qaç.' },
      {
        en: 'Run it twice more, faster each time.',
        tr: 'İki kez daha koş, her seferinde daha hızlı.',
        az: 'İki dəfə də qaç, hər dəfə daha sürətli.',
      },
      {
        en: 'Finish with ten jumps. The phone counts them.',
        tr: 'On zıplamayla bitir. Telefon sayacak.',
        az: 'On tullanma ilə bitir. Telefon sayacaq.',
      },
    ],
    parentBrief: {
      en: 'Cushions on the floor, a chair to go around, nothing to climb. Stay in the room while they run.',
      tr: 'Yere yastıklar, etrafından dolaşılacak bir sandalye, tırmanılacak hiçbir şey yok. Koşarken odada kalın.',
      az: 'Yerə yastıqlar, ətrafından dolanmaq üçün bir stul, dırmaşacaq heç nə yoxdur. Qaçarkən otaqda qalın.',
    },
  },
];
