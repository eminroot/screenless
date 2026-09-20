import type { Localized } from '../i18n/types';
import { FIND_KINDS, type FindKindId } from '../state/types';
import { palette } from '../theme/tokens';

/**
 * What a child can find outside, and how the buddy walks them through it.
 *
 * The labeller only ever picks which of these twelve cards to open. Everything
 * after that is the child looking: counting legs, feeling bark, holding a leaf
 * up to the sun. That is the design rather than a workaround. A phone that
 * announced "silver birch" would end the moment; a buddy that asks "rough or
 * smooth?" starts one, and the child is the one who decides.
 */

export type FindOption = {
  /** Stored on the find, so a card can be rebuilt from the record alone. */
  tag: string;
  emoji: string;
  label: Localized;
};

export type FindQuestion = {
  id: string;
  prompt: Localized;
  options: FindOption[];
  /** The one question whose answer names the sub kind on the collection card. */
  decides?: boolean;
};

export type FindFact = {
  id: string;
  /**
   * Questions the child has to have answered before this unlocks. The better
   * facts sit behind more looking, which is the only currency here.
   */
  at: number;
  text: Localized;
};

export type FindVariant = { tag: string; emoji: string; name: Localized };

export type FindKind = {
  id: FindKindId;
  emoji: string;
  color: string;
  name: Localized;
  /** What the buddy blurts out the second it sees one. */
  reaction: Localized;
  /** Shown before anything else when the thing in front of the child can hurt. */
  caution?: Localized;
  /** Labels that mean this kind and nothing else. */
  keywords: string[];
  /** Labels that only count when nothing specific matched. */
  weak: string[];
  questions: FindQuestion[];
  facts: FindFact[];
  variants: FindVariant[];
};

export const findKinds: FindKind[] = [
  {
    id: 'tree',
    emoji: '🌳',
    color: palette.leaf,
    name: { en: 'tree', tr: 'ağaç', az: 'ağac' },
    reaction: {
      en: 'A TREE? A real one? I have never touched a tree in my life!',
      tr: 'AĞAÇ MI? Gerçek bir ağaç mı? Ben hayatımda hiç ağaca dokunmadım!',
      az: 'AĞACMI? Əsl ağac? Mən ömrümdə heç vaxt ağaca toxunmamışam!',
    },
    keywords: ['tree', 'trunk', 'woody plant', 'branch', 'forest', 'palm', 'bark'],
    weak: ['plant', 'vegetation', 'wood'],
    questions: [
      {
        id: 'size',
        prompt: {
          en: 'Stand next to it. How big is it?',
          tr: 'Yanına git. Ne kadar büyük?',
          az: 'Yanına get. Nə qədər böyükdür?',
        },
        options: [
          {
            tag: 'huge',
            emoji: '🏠',
            label: { en: 'Taller than a house', tr: 'Evden uzun', az: 'Evdən uzun' },
          },
          {
            tag: 'tall',
            emoji: '🧍',
            label: {
              en: 'Taller than a grown up',
              tr: 'Bir yetişkinden uzun',
              az: 'Böyük adamdan uzun',
            },
          },
          {
            tag: 'small',
            emoji: '🙂',
            label: { en: 'Smaller than me', tr: 'Benden küçük', az: 'Məndən kiçik' },
          },
        ],
      },
      {
        id: 'bark',
        prompt: {
          en: 'Touch the bark. What does it feel like?',
          tr: 'Kabuğuna dokun. Nasıl geliyor?',
          az: 'Qabığına toxun. Necə gəlir?',
        },
        options: [
          {
            tag: 'rough',
            emoji: '🪵',
            label: { en: 'Rough and cracked', tr: 'Sert ve çatlak', az: 'Sərt və çatlaq' },
          },
          {
            tag: 'smooth',
            emoji: '📄',
            label: { en: 'Smooth like paper', tr: 'Kâğıt gibi pürüzsüz', az: 'Kağız kimi hamar' },
          },
          {
            tag: 'bumpy',
            emoji: '🫧',
            label: { en: 'Bumpy and lumpy', tr: 'Yumru yumru', az: 'Yumru-yumru' },
          },
        ],
      },
      {
        id: 'branches',
        decides: true,
        prompt: {
          en: 'Look up. What is in the branches?',
          tr: 'Yukarı bak. Dallarında ne var?',
          az: 'Yuxarı bax. Budaqlarında nə var?',
        },
        options: [
          {
            tag: 'green',
            emoji: '🍃',
            label: { en: 'Green leaves', tr: 'Yeşil yapraklar', az: 'Yaşıl yarpaqlar' },
          },
          {
            tag: 'turning',
            emoji: '🍁',
            label: {
              en: 'Yellow or red leaves',
              tr: 'Sarı ya da kırmızı yapraklar',
              az: 'Sarı və ya qırmızı yarpaqlar',
            },
          },
          {
            tag: 'bare',
            emoji: '🪹',
            label: { en: 'Nothing, it is bare', tr: 'Hiçbir şey, çıplak', az: 'Heç nə, çılpaqdır' },
          },
          {
            tag: 'needles',
            emoji: '🌲',
            label: { en: 'Little needles', tr: 'Küçük iğneler', az: 'Kiçik iynələr' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'tree-alive',
        at: 1,
        text: {
          en: 'A tree is the biggest living thing you will meet today. It is alive, just very slow.',
          tr: 'Ağaç bugün karşılaşacağın en büyük canlı. O da yaşıyor, sadece çok yavaş.',
          az: 'Ağac bu gün rastlaşacağın ən böyük canlıdır. O da yaşayır, sadəcə çox yavaş.',
        },
      },
      {
        id: 'tree-roots',
        at: 2,
        text: {
          en: 'The part you can see is about the same size as the part hiding under the ground.',
          tr: 'Gördüğün kısım, toprağın altında saklanan kısımla neredeyse aynı büyüklükte.',
          az: 'Gördüyün hissə, torpağın altında gizlənən hissə ilə demək olar ki, eyni böyüklükdədir.',
        },
      },
      {
        id: 'tree-old',
        at: 3,
        text: {
          en: 'This tree was standing here before you were born. It is older than you, maybe older than your grandmother.',
          tr: 'Bu ağaç sen doğmadan önce de buradaydı. Senden yaşlı, belki babaannenden bile.',
          az: 'Bu ağac sən doğulmamışdan əvvəl də burada idi. Səndən yaşlıdır, bəlkə nənəndən də.',
        },
      },
    ],
    variants: [
      { tag: 'green', emoji: '🌳', name: { en: 'green tree', tr: 'yeşil ağaç', az: 'yaşıl ağac' } },
      {
        tag: 'turning',
        emoji: '🍁',
        name: { en: 'autumn tree', tr: 'sonbahar ağacı', az: 'payız ağacı' },
      },
      {
        tag: 'bare',
        emoji: '🪹',
        name: { en: 'sleeping tree', tr: 'uyuyan ağaç', az: 'yatan ağac' },
      },
      {
        tag: 'needles',
        emoji: '🌲',
        name: { en: 'needle tree', tr: 'iğneli ağaç', az: 'iynəli ağac' },
      },
    ],
  },

  {
    id: 'leaf',
    emoji: '🍃',
    color: palette.mint,
    name: { en: 'leaf', tr: 'yaprak', az: 'yarpaq' },
    reaction: {
      en: 'A leaf! Bring it close. I want to see the lines in it.',
      tr: 'Yaprak! Yaklaştır. İçindeki çizgileri görmek istiyorum.',
      az: 'Yarpaq! Yaxınlaşdır. İçindəki xətləri görmək istəyirəm.',
    },
    keywords: ['leaf', 'leaves', 'foliage', 'frond', 'petiole'],
    weak: ['plant', 'green', 'terrestrial plant'],
    questions: [
      {
        id: 'shape',
        decides: true,
        prompt: {
          en: 'Look at the edge. What shape is it?',
          tr: 'Kenarına bak. Nasıl bir şekli var?',
          az: 'Kənarına bax. Necə formadadır?',
        },
        options: [
          {
            tag: 'pointy',
            emoji: '⭐',
            label: { en: 'Pointy and jagged', tr: 'Sivri ve tırtıklı', az: 'Şiş və dişli' },
          },
          {
            tag: 'round',
            emoji: '🥚',
            label: { en: 'Round and smooth', tr: 'Yuvarlak ve düz', az: 'Yumru və hamar' },
          },
          {
            tag: 'hand',
            emoji: '🖐️',
            label: { en: 'Like an open hand', tr: 'Açık el gibi', az: 'Açıq əl kimi' },
          },
          {
            tag: 'needle',
            emoji: '🌲',
            label: { en: 'Thin like a needle', tr: 'İğne gibi ince', az: 'İynə kimi nazik' },
          },
        ],
      },
      {
        id: 'veins',
        prompt: {
          en: 'Hold it up to the sun. Do you see lines?',
          tr: 'Güneşe doğru tut. Çizgiler görüyor musun?',
          az: 'Günəşə tərəf tut. Xətlər görürsən?',
        },
        options: [
          { tag: 'many', emoji: '🕸️', label: { en: 'Lots of them', tr: 'Bir sürü', az: 'Çoxlu' } },
          {
            tag: 'one',
            emoji: '➖',
            label: { en: 'One thick one', tr: 'Bir kalın çizgi', az: 'Bir qalın xətt' },
          },
          {
            tag: 'none',
            emoji: '🚫',
            label: { en: 'I cannot see any', tr: 'Hiç göremiyorum', az: 'Heç görmürəm' },
          },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          { tag: 'green', emoji: '💚', label: { en: 'Green', tr: 'Yeşil', az: 'Yaşıl' } },
          { tag: 'yellow', emoji: '💛', label: { en: 'Yellow', tr: 'Sarı', az: 'Sarı' } },
          { tag: 'red', emoji: '❤️', label: { en: 'Red', tr: 'Kırmızı', az: 'Qırmızı' } },
          { tag: 'brown', emoji: '🤎', label: { en: 'Brown', tr: 'Kahverengi', az: 'Qəhvəyi' } },
        ],
      },
    ],
    facts: [
      {
        id: 'leaf-kitchen',
        at: 1,
        text: {
          en: 'Every leaf is a tiny kitchen. It makes food out of sunlight.',
          tr: 'Her yaprak minik bir mutfak. Güneş ışığından yemek yapıyor.',
          az: 'Hər yarpaq balaca bir mətbəxdir. Günəş işığından yemək hazırlayır.',
        },
      },
      {
        id: 'leaf-pipes',
        at: 2,
        text: {
          en: 'Those lines are pipes. Water climbs up them all day long, all the way from the roots.',
          tr: 'O çizgiler birer boru. Su bütün gün onların içinden tırmanıyor, ta köklerden.',
          az: 'O xətlər borulardır. Su bütün günü onların içi ilə qalxır, ta köklərdən.',
        },
      },
      {
        id: 'leaf-green',
        at: 3,
        text: {
          en: 'Leaves are green because of something called chlorophyll. In autumn the tree takes it back, and that is when you get yellow and red.',
          tr: 'Yapraklar klorofil denen bir şey yüzünden yeşil. Sonbaharda ağaç onu geri alıyor, sarılar ve kırmızılar o zaman çıkıyor.',
          az: 'Yarpaqlar xlorofil adlanan bir şeyə görə yaşıldır. Payızda ağac onu geri alır, sarılar və qırmızılar da onda çıxır.',
        },
      },
    ],
    variants: [
      {
        tag: 'pointy',
        emoji: '⭐',
        name: { en: 'pointy leaf', tr: 'sivri yaprak', az: 'şiş yarpaq' },
      },
      {
        tag: 'round',
        emoji: '🥚',
        name: { en: 'round leaf', tr: 'yuvarlak yaprak', az: 'yumru yarpaq' },
      },
      { tag: 'hand', emoji: '🖐️', name: { en: 'hand leaf', tr: 'el yaprağı', az: 'əl yarpağı' } },
      {
        tag: 'needle',
        emoji: '🌲',
        name: { en: 'needle leaf', tr: 'iğne yaprak', az: 'iynə yarpaq' },
      },
    ],
  },

  {
    id: 'flower',
    emoji: '🌸',
    color: palette.bubble,
    name: { en: 'flower', tr: 'çiçek', az: 'çiçək' },
    reaction: {
      en: 'A flower! Look but do not grab. A bee might be busy in there.',
      tr: 'Çiçek! Bak ama koparma. İçinde bir arı çalışıyor olabilir.',
      az: 'Çiçək! Bax, amma qoparma. İçində arı işləyə bilər.',
    },
    keywords: ['flower', 'petal', 'blossom', 'rose', 'tulip', 'daisy', 'flowering plant', 'bloom'],
    weak: ['plant', 'garden'],
    questions: [
      {
        id: 'petals',
        prompt: {
          en: 'Count the petals. How many?',
          tr: 'Yapraklarını say. Kaç tane?',
          az: 'Ləçəklərini say. Neçə dənədir?',
        },
        options: [
          {
            tag: 'few',
            emoji: '3️⃣',
            label: { en: 'Fewer than five', tr: 'Beşten az', az: 'Beşdən az' },
          },
          {
            tag: 'five',
            emoji: '5️⃣',
            label: { en: 'About five', tr: 'Beş kadar', az: 'Beş qədər' },
          },
          {
            tag: 'many',
            emoji: '🔟',
            label: { en: 'Lots and lots', tr: 'Bir sürü', az: 'Çoxlu-çoxlu' },
          },
        ],
      },
      {
        id: 'colour',
        decides: true,
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          { tag: 'yellow', emoji: '🌻', label: { en: 'Yellow', tr: 'Sarı', az: 'Sarı' } },
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          {
            tag: 'pink',
            emoji: '🌸',
            label: { en: 'Pink or purple', tr: 'Pembe ya da mor', az: 'Çəhrayı və ya bənövşəyi' },
          },
          { tag: 'red', emoji: '🌹', label: { en: 'Red', tr: 'Kırmızı', az: 'Qırmızı' } },
        ],
      },
      {
        id: 'smell',
        prompt: {
          en: 'Smell it, but keep your nose back a bit.',
          tr: 'Kokla ama burnunu biraz uzak tut.',
          az: 'İylə, amma burnunu bir az uzaq tut.',
        },
        options: [
          { tag: 'sweet', emoji: '😍', label: { en: 'Lovely', tr: 'Çok güzel', az: 'Çox gözəl' } },
          {
            tag: 'none',
            emoji: '😐',
            label: { en: 'Nothing at all', tr: 'Hiçbir şey', az: 'Heç nə' },
          },
          { tag: 'odd', emoji: '🤨', label: { en: 'Strange', tr: 'Tuhaf', az: 'Qəribə' } },
        ],
      },
    ],
    facts: [
      {
        id: 'flower-hello',
        at: 1,
        text: {
          en: 'A flower is how a plant says hello to bees.',
          tr: 'Çiçek, bitkinin arılara merhaba deme şekli.',
          az: 'Çiçək bitkinin arılara salam verməsidir.',
        },
      },
      {
        id: 'flower-pollen',
        at: 2,
        text: {
          en: 'The yellow dust inside is called pollen. Bees carry it away on their legs by accident, and that is how new flowers happen.',
          tr: 'İçindeki sarı toza polen deniyor. Arılar onu bacaklarında kazara taşıyor, yeni çiçekler böyle oluyor.',
          az: 'İçindəki sarı toz polen adlanır. Arılar onu ayaqlarında təsadüfən daşıyır, yeni çiçəklər də belə yaranır.',
        },
      },
      {
        id: 'flower-sleep',
        at: 3,
        text: {
          en: 'Most flowers close up at night and open again in the morning. They sleep, in their own way.',
          tr: 'Çoğu çiçek geceleri kapanıp sabah yeniden açılıyor. Kendilerince uyuyorlar.',
          az: 'Çiçəklərin çoxu gecə bağlanıb səhər yenidən açılır. Öz qaydalarınca yatırlar.',
        },
      },
    ],
    variants: [
      {
        tag: 'yellow',
        emoji: '🌻',
        name: { en: 'yellow flower', tr: 'sarı çiçek', az: 'sarı çiçək' },
      },
      {
        tag: 'white',
        emoji: '🤍',
        name: { en: 'white flower', tr: 'beyaz çiçek', az: 'ağ çiçək' },
      },
      {
        tag: 'pink',
        emoji: '🌸',
        name: { en: 'pink flower', tr: 'pembe çiçek', az: 'çəhrayı çiçək' },
      },
      {
        tag: 'red',
        emoji: '🌹',
        name: { en: 'red flower', tr: 'kırmızı çiçek', az: 'qırmızı çiçək' },
      },
    ],
  },

  {
    id: 'bug',
    emoji: '🐛',
    color: palette.clay,
    name: { en: 'minibeast', tr: 'böcek', az: 'böcək' },
    reaction: {
      en: 'A bug! Hands behind your back. Just look. How many legs has it got?',
      tr: 'Böcek! Ellerini arkana koy. Sadece bak. Kaç bacağı var?',
      az: 'Böcək! Əllərini arxana qoy. Sadəcə bax. Neçə ayağı var?',
    },
    caution: {
      en: 'Look from where you are standing. Never touch a bug you do not know, and never touch one with yellow and black stripes.',
      tr: 'Durduğun yerden bak. Tanımadığın bir böceğe asla dokunma, sarı siyah çizgilisine hiç dokunma.',
      az: 'Durduğun yerdən bax. Tanımadığın böcəyə heç vaxt toxunma, sarı-qara zolaqlısına isə heç.',
    },
    keywords: [
      'insect',
      'bug',
      'beetle',
      'ant',
      'bee',
      'wasp',
      'butterfly',
      'moth',
      'spider',
      'caterpillar',
      'snail',
      'worm',
      'ladybug',
      'ladybird',
      'dragonfly',
      'grasshopper',
      'fly',
    ],
    weak: ['invertebrate', 'pollinator', 'arthropod', 'pest'],
    questions: [
      {
        id: 'legs',
        decides: true,
        prompt: {
          en: 'Count the legs from where you are.',
          tr: 'Durduğun yerden bacaklarını say.',
          az: 'Durduğun yerdən ayaqlarını say.',
        },
        options: [
          { tag: 'insect', emoji: '6️⃣', label: { en: 'Six', tr: 'Altı', az: 'Altı' } },
          { tag: 'spider', emoji: '8️⃣', label: { en: 'Eight', tr: 'Sekiz', az: 'Səkkiz' } },
          {
            tag: 'many',
            emoji: '🐛',
            label: {
              en: 'Too many to count',
              tr: 'Sayamayacak kadar çok',
              az: 'Saya bilməyəcək qədər çox',
            },
          },
          { tag: 'none', emoji: '🐌', label: { en: 'None at all', tr: 'Hiç yok', az: 'Heç yoxdur' } },
        ],
      },
      {
        id: 'move',
        prompt: { en: 'What is it doing?', tr: 'Ne yapıyor?', az: 'Nə edir?' },
        options: [
          { tag: 'fly', emoji: '🦋', label: { en: 'Flying', tr: 'Uçuyor', az: 'Uçur' } },
          { tag: 'walk', emoji: '🐜', label: { en: 'Walking', tr: 'Yürüyor', az: 'Gəzir' } },
          { tag: 'hop', emoji: '🦗', label: { en: 'Hopping', tr: 'Zıplıyor', az: 'Tullanır' } },
          { tag: 'still', emoji: '😴', label: { en: 'Sitting still', tr: 'Duruyor', az: 'Dayanıb' } },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          {
            tag: 'dark',
            emoji: '⚫',
            label: { en: 'Black or brown', tr: 'Siyah ya da kahverengi', az: 'Qara və ya qəhvəyi' },
          },
          {
            tag: 'red',
            emoji: '🔴',
            label: { en: 'Red or orange', tr: 'Kırmızı ya da turuncu', az: 'Qırmızı və ya narıncı' },
          },
          {
            tag: 'shiny',
            emoji: '✨',
            label: {
              en: 'Shiny green or blue',
              tr: 'Parlak yeşil ya da mavi',
              az: 'Parlaq yaşıl və ya mavi',
            },
          },
          {
            tag: 'stripey',
            emoji: '🟡',
            label: {
              en: 'Yellow and black stripes',
              tr: 'Sarı siyah çizgili',
              az: 'Sarı-qara zolaqlı',
            },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'bug-legs',
        at: 1,
        text: {
          en: 'Six legs means it is an insect. Eight legs means it is a spider, and a spider is not an insect at all.',
          tr: 'Altı bacak varsa o bir böcek. Sekiz bacak varsa o bir örümcek, ve örümcek hiç de böcek değil.',
          az: 'Altı ayaq varsa, o, həşəratdır. Səkkiz ayaq varsa, o, hörümçəkdir, hörümçək isə ümumiyyətlə həşərat deyil.',
        },
      },
      {
        id: 'bug-ant',
        at: 2,
        text: {
          en: 'An ant can lift fifty times what it weighs. That would be you picking up a car.',
          tr: 'Bir karınca kendi ağırlığının elli katını kaldırabiliyor. Bu, senin bir arabayı kaldırman demek.',
          az: 'Bir qarışqa öz çəkisinin əlli qatını qaldıra bilir. Bu, sənin bir maşını qaldırmağın deməkdir.',
        },
      },
      {
        id: 'bug-taste',
        at: 3,
        text: {
          en: 'Most insects taste with their feet. They stand on their dinner to find out what it is.',
          tr: 'Böceklerin çoğu ayaklarıyla tat alıyor. Ne yediklerini anlamak için yemeğin üstüne basıyorlar.',
          az: 'Həşəratların çoxu ayaqları ilə dad bilir. Nə yediklərini anlamaq üçün yeməyin üstünə çıxırlar.',
        },
      },
    ],
    variants: [
      { tag: 'insect', emoji: '🐜', name: { en: 'insect', tr: 'altı bacaklı', az: 'altı ayaqlı' } },
      { tag: 'spider', emoji: '🕷️', name: { en: 'spider', tr: 'örümcek', az: 'hörümçək' } },
      { tag: 'many', emoji: '🐛', name: { en: 'many legs', tr: 'çok bacaklı', az: 'çox ayaqlı' } },
      { tag: 'none', emoji: '🐌', name: { en: 'no legs', tr: 'bacaksız', az: 'ayaqsız' } },
    ],
  },

  {
    id: 'bird',
    emoji: '🐦',
    color: palette.sky,
    name: { en: 'bird', tr: 'kuş', az: 'quş' },
    reaction: {
      en: 'A bird! Stand very still so you do not scare it. What is it doing?',
      tr: 'Kuş! Kıpırdama, sakın korkutma. Ne yapıyor?',
      az: 'Quş! Tərpənmə, qorxutma. Nə edir?',
    },
    keywords: [
      'bird',
      'beak',
      'wing',
      'duck',
      'pigeon',
      'sparrow',
      'crow',
      'seagull',
      'gull',
      'chicken',
      'owl',
      'parrot',
      'swan',
      'stork',
      'eagle',
    ],
    weak: ['wildlife', 'fauna', 'flight'],
    questions: [
      {
        id: 'size',
        decides: true,
        prompt: {
          en: 'How big is it? Use your hand to measure.',
          tr: 'Ne kadar büyük? Elinle ölç.',
          az: 'Nə qədər böyükdür? Əlinlə ölç.',
        },
        options: [
          {
            tag: 'tiny',
            emoji: '🤏',
            label: { en: 'Smaller than my hand', tr: 'Elimden küçük', az: 'Əlimdən kiçik' },
          },
          {
            tag: 'handy',
            emoji: '✋',
            label: { en: 'About my hand', tr: 'Elim kadar', az: 'Əlim qədər' },
          },
          {
            tag: 'big',
            emoji: '🙌',
            label: { en: 'Bigger than my head', tr: 'Kafamdan büyük', az: 'Başımdan böyük' },
          },
        ],
      },
      {
        id: 'doing',
        prompt: { en: 'What is it doing?', tr: 'Ne yapıyor?', az: 'Nə edir?' },
        options: [
          { tag: 'fly', emoji: '🕊️', label: { en: 'Flying', tr: 'Uçuyor', az: 'Uçur' } },
          {
            tag: 'walk',
            emoji: '🚶',
            label: { en: 'Walking about', tr: 'Yerde yürüyor', az: 'Yerdə gəzir' },
          },
          { tag: 'sit', emoji: '🪹', label: { en: 'Sitting still', tr: 'Duruyor', az: 'Dayanıb' } },
          { tag: 'eat', emoji: '🍞', label: { en: 'Eating', tr: 'Yemek yiyor', az: 'Yemək yeyir' } },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          {
            tag: 'plain',
            emoji: '🤎',
            label: { en: 'Grey or brown', tr: 'Gri ya da kahverengi', az: 'Boz və ya qəhvəyi' },
          },
          { tag: 'black', emoji: '⚫', label: { en: 'Black', tr: 'Siyah', az: 'Qara' } },
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          {
            tag: 'bright',
            emoji: '🌈',
            label: { en: 'Bright colours', tr: 'Rengarenk', az: 'Rəngarəng' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'bird-bones',
        at: 1,
        text: {
          en: 'Bird bones are hollow inside, like a straw. That is why a bird weighs less than one of your shoes.',
          tr: 'Kuşların kemikleri içi boş, pipet gibi. Bu yüzden bir kuş senin bir ayakkabından daha hafif.',
          az: 'Quşların sümükləri içi boşdur, saman çöpü kimi. Ona görə quş sənin bir ayaqqabından yüngüldür.',
        },
      },
      {
        id: 'bird-teeth',
        at: 2,
        text: {
          en: 'Birds have no teeth at all. They swallow tiny stones, and the stones grind the food up inside them.',
          tr: 'Kuşların hiç dişi yok. Minik taşlar yutuyorlar, taşlar da yemeği içeride öğütüyor.',
          az: 'Quşların heç dişi yoxdur. Balaca daşlar udurlar, daşlar da yeməyi içəridə üyüdür.',
        },
      },
      {
        id: 'bird-sleep',
        at: 3,
        text: {
          en: 'Some birds sleep with one half of their brain at a time, so the other half can keep watch.',
          tr: 'Bazı kuşlar beyinlerinin yarısıyla uyuyor, diğer yarısı nöbet tutuyor.',
          az: 'Bəzi quşlar beyinlərinin yarısı ilə yatır, o biri yarısı isə növbə çəkir.',
        },
      },
    ],
    variants: [
      { tag: 'tiny', emoji: '🐤', name: { en: 'little bird', tr: 'küçük kuş', az: 'balaca quş' } },
      { tag: 'handy', emoji: '🐦', name: { en: 'bird', tr: 'kuş', az: 'quş' } },
      { tag: 'big', emoji: '🦅', name: { en: 'big bird', tr: 'büyük kuş', az: 'böyük quş' } },
    ],
  },

  {
    id: 'animal',
    emoji: '🐾',
    color: palette.sunDeep,
    name: { en: 'animal', tr: 'hayvan', az: 'heyvan' },
    reaction: {
      en: 'An animal! Do not go closer until a grown up says it is alright.',
      tr: 'Hayvan! Büyüğün tamam demeden yaklaşma.',
      az: 'Heyvan! Böyüyün icazə verməyincə yaxınlaşma.',
    },
    caution: {
      en: 'Never walk up to an animal you do not know. Ask a grown up first, every single time.',
      tr: 'Tanımadığın bir hayvana asla yaklaşma. Her seferinde önce bir büyüğüne sor.',
      az: 'Tanımadığın heyvana heç vaxt yaxınlaşma. Hər dəfə əvvəlcə böyüyündən soruş.',
    },
    keywords: [
      'dog',
      'cat',
      'horse',
      'cow',
      'sheep',
      'goat',
      'squirrel',
      'rabbit',
      'mouse',
      'fox',
      'donkey',
      'lizard',
      'frog',
      'turtle',
      'fur',
      'snout',
      'whiskers',
      'puppy',
      'kitten',
    ],
    weak: ['animal', 'mammal', 'pet', 'wildlife', 'vertebrate'],
    questions: [
      {
        id: 'legs',
        prompt: { en: 'How many legs?', tr: 'Kaç bacağı var?', az: 'Neçə ayağı var?' },
        options: [
          { tag: 'four', emoji: '4️⃣', label: { en: 'Four', tr: 'Dört', az: 'Dörd' } },
          { tag: 'two', emoji: '2️⃣', label: { en: 'Two', tr: 'İki', az: 'İki' } },
          { tag: 'none', emoji: '🐟', label: { en: 'None', tr: 'Hiç', az: 'Heç' } },
        ],
      },
      {
        id: 'cover',
        decides: true,
        prompt: { en: 'What is it covered in?', tr: 'Üstü neyle kaplı?', az: 'Üstü nə ilə örtülüb?' },
        options: [
          { tag: 'fur', emoji: '🧸', label: { en: 'Fur', tr: 'Tüy', az: 'Tük' } },
          { tag: 'feathers', emoji: '🪶', label: { en: 'Feathers', tr: 'Kanat tüyü', az: 'Lələk' } },
          {
            tag: 'skin',
            emoji: '🦎',
            label: { en: 'Smooth skin', tr: 'Pürüzsüz deri', az: 'Hamar dəri' },
          },
          { tag: 'shell', emoji: '🐢', label: { en: 'A shell', tr: 'Kabuk', az: 'Qabıq' } },
        ],
      },
      {
        id: 'size',
        prompt: {
          en: 'Bigger or smaller than you?',
          tr: 'Senden büyük mü küçük mü?',
          az: 'Səndən böyükdür, yoxsa kiçik?',
        },
        options: [
          { tag: 'bigger', emoji: '🐘', label: { en: 'Bigger', tr: 'Büyük', az: 'Böyük' } },
          { tag: 'smaller', emoji: '🐁', label: { en: 'Smaller', tr: 'Küçük', az: 'Kiçik' } },
          {
            tag: 'same',
            emoji: '🤝',
            label: { en: 'About the same', tr: 'Aynı kadar', az: 'Eyni qədər' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'animal-fur',
        at: 1,
        text: {
          en: 'Fur is a coat that never comes off. It traps warm air right next to the skin.',
          tr: 'Tüy, hiç çıkmayan bir mont. Sıcak havayı tam derinin yanında tutuyor.',
          az: 'Tük heç vaxt çıxmayan paltardır. İsti havanı düz dərinin yanında saxlayır.',
        },
      },
      {
        id: 'animal-whiskers',
        at: 2,
        text: {
          en: 'A cat has whiskers exactly as wide as its body, so it knows if it fits through a gap before it even tries.',
          tr: 'Kedinin bıyıkları tam vücudu kadar geniş, o yüzden bir aralıktan geçip geçemeyeceğini denemeden biliyor.',
          az: 'Pişiyin bığları tam bədəni qədər enlidir, ona görə bir aralıqdan keçib-keçməyəcəyini sınamadan bilir.',
        },
      },
      {
        id: 'animal-neck',
        at: 3,
        text: {
          en: 'Almost every furry animal has seven bones in its neck. A mouse has seven. A giraffe has seven too.',
          tr: 'Tüylü hayvanların neredeyse hepsinin boynunda yedi kemik var. Farede yedi. Zürafada da yedi.',
          az: 'Tüklü heyvanların demək olar ki hamısının boynunda yeddi sümük var. Siçanda yeddi. Zürafədə də yeddi.',
        },
      },
    ],
    variants: [
      {
        tag: 'fur',
        emoji: '🐈',
        name: { en: 'furry animal', tr: 'tüylü hayvan', az: 'tüklü heyvan' },
      },
      {
        tag: 'feathers',
        emoji: '🐓',
        name: { en: 'feathered animal', tr: 'kanatlı hayvan', az: 'lələkli heyvan' },
      },
      {
        tag: 'skin',
        emoji: '🦎',
        name: { en: 'smooth animal', tr: 'pürüzsüz hayvan', az: 'hamar heyvan' },
      },
      {
        tag: 'shell',
        emoji: '🐢',
        name: { en: 'shelled animal', tr: 'kabuklu hayvan', az: 'qabıqlı heyvan' },
      },
    ],
  },

  {
    id: 'stone',
    emoji: '🪨',
    color: palette.inkFaint,
    name: { en: 'stone', tr: 'taş', az: 'daş' },
    reaction: {
      en: 'A stone! Pick it up. Is it heavier than it looks?',
      tr: 'Taş! Eline al. Göründüğünden ağır mı?',
      az: 'Daş! Əlinə götür. Göründüyündən ağırdır?',
    },
    keywords: ['rock', 'stone', 'pebble', 'boulder', 'gravel', 'brick', 'cobblestone'],
    weak: ['soil', 'ground', 'mineral', 'geology'],
    questions: [
      {
        id: 'feel',
        decides: true,
        prompt: {
          en: 'Rub it with your thumb. Rough or smooth?',
          tr: 'Başparmağınla ov. Pürüzlü mü düz mü?',
          az: 'Baş barmağınla sürt. Kələ-kötür, yoxsa hamar?',
        },
        options: [
          { tag: 'rough', emoji: '🧱', label: { en: 'Rough', tr: 'Pürüzlü', az: 'Kələ-kötür' } },
          { tag: 'smooth', emoji: '🥚', label: { en: 'Smooth', tr: 'Düz', az: 'Hamar' } },
          {
            tag: 'both',
            emoji: '🪨',
            label: { en: 'Rough on one side', tr: 'Bir yanı pürüzlü', az: 'Bir tərəfi kələ-kötür' },
          },
        ],
      },
      {
        id: 'weight',
        prompt: {
          en: 'Is it heavy for its size?',
          tr: 'Boyuna göre ağır mı?',
          az: 'Ölçüsünə görə ağırdır?',
        },
        options: [
          { tag: 'heavy', emoji: '🏋️', label: { en: 'Very heavy', tr: 'Çok ağır', az: 'Çox ağır' } },
          { tag: 'light', emoji: '🪶', label: { en: 'Quite light', tr: 'Hafif', az: 'Yüngül' } },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          { tag: 'grey', emoji: '🩶', label: { en: 'Grey', tr: 'Gri', az: 'Boz' } },
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          {
            tag: 'dark',
            emoji: '⚫',
            label: { en: 'Almost black', tr: 'Neredeyse siyah', az: 'Demək olar qara' },
          },
          {
            tag: 'sparkly',
            emoji: '✨',
            label: { en: 'It has sparkles', tr: 'Parıltıları var', az: 'Parıltıları var' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'stone-old',
        at: 1,
        text: {
          en: 'That stone is older than every person who has ever lived. All of them.',
          tr: 'O taş, yaşamış bütün insanlardan daha yaşlı. Hepsinden.',
          az: 'O daş yaşamış bütün insanlardan yaşlıdır. Hamısından.',
        },
      },
      {
        id: 'stone-water',
        at: 2,
        text: {
          en: 'If it is smooth, water has been rolling it about for a very long time. Maybe a thousand years.',
          tr: 'Eğer düzse, su onu çok uzun zamandır yuvarlıyor demektir. Belki bin yıldır.',
          az: 'Əgər hamardırsa, su onu çox uzun müddətdir yuvarlayır. Bəlkə min ildir.',
        },
      },
      {
        id: 'stone-melted',
        at: 3,
        text: {
          en: 'Some stones started off as melted rock, hotter than any oven, deep under the ground.',
          tr: 'Bazı taşlar yerin çok derininde, fırından bile sıcak, erimiş kaya olarak başladı.',
          az: 'Bəzi daşlar yerin çox dərinliyində, sobadan da isti, ərimiş qaya kimi başlayıb.',
        },
      },
    ],
    variants: [
      {
        tag: 'rough',
        emoji: '🧱',
        name: { en: 'rough stone', tr: 'pürüzlü taş', az: 'kələ-kötür daş' },
      },
      { tag: 'smooth', emoji: '🥚', name: { en: 'river stone', tr: 'dere taşı', az: 'çay daşı' } },
      { tag: 'both', emoji: '🪨', name: { en: 'broken stone', tr: 'kırık taş', az: 'qırıq daş' } },
    ],
  },

  {
    id: 'cloud',
    emoji: '☁️',
    color: palette.skyDeep,
    name: { en: 'cloud', tr: 'bulut', az: 'bulud' },
    reaction: {
      en: 'A cloud! Lie down on your back and watch it for a minute. What shape is it?',
      tr: 'Bulut! Sırtüstü uzan ve bir dakika izle. Nasıl bir şekli var?',
      az: 'Bulud! Arxası üstə uzan və bir dəqiqə izlə. Necə formadadır?',
    },
    keywords: ['cloud', 'sky', 'sunset', 'sunrise', 'horizon', 'dusk', 'atmosphere', 'cumulus'],
    weak: ['blue', 'daytime', 'meteorological phenomenon'],
    questions: [
      {
        id: 'shape',
        decides: true,
        prompt: { en: 'What shape is it?', tr: 'Nasıl bir şekli var?', az: 'Necə formadadır?' },
        options: [
          {
            tag: 'heap',
            emoji: '☁️',
            label: { en: 'Fluffy heaps', tr: 'Pamuk yığını gibi', az: 'Pambıq topası kimi' },
          },
          {
            tag: 'sheet',
            emoji: '🌫️',
            label: {
              en: 'A flat grey blanket',
              tr: 'Düz gri bir battaniye',
              az: 'Düz boz bir yorğan',
            },
          },
          {
            tag: 'wisp',
            emoji: '🪶',
            label: { en: 'Thin and wispy', tr: 'İnce ve tel tel', az: 'Nazik və tel-tel' },
          },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          { tag: 'grey', emoji: '🩶', label: { en: 'Grey', tr: 'Gri', az: 'Boz' } },
          { tag: 'dark', emoji: '⛈️', label: { en: 'Dark grey', tr: 'Koyu gri', az: 'Tünd boz' } },
        ],
      },
      {
        id: 'speed',
        prompt: { en: 'Watch it. Is it moving?', tr: 'İzle. Hareket ediyor mu?', az: 'İzlə. Hərəkət edir?' },
        options: [
          {
            tag: 'fast',
            emoji: '💨',
            label: { en: 'Quite fast', tr: 'Epey hızlı', az: 'Kifayət qədər sürətli' },
          },
          { tag: 'slow', emoji: '🐢', label: { en: 'Very slowly', tr: 'Çok yavaş', az: 'Çox yavaş' } },
          { tag: 'still', emoji: '🧊', label: { en: 'Not at all', tr: 'Hiç', az: 'Heç' } },
        ],
      },
    ],
    facts: [
      {
        id: 'cloud-water',
        at: 1,
        text: {
          en: 'A cloud is just water, so tiny that it floats.',
          tr: 'Bulut aslında sadece su. O kadar minik ki havada duruyor.',
          az: 'Bulud əslində sadəcə sudur. O qədər balacadır ki, havada dayanır.',
        },
      },
      {
        id: 'cloud-weight',
        at: 2,
        text: {
          en: 'A middle sized cloud weighs about as much as a hundred elephants. It floats anyway.',
          tr: 'Orta boy bir bulut yüz fil kadar ağır. Yine de havada duruyor.',
          az: 'Orta ölçülü bulud yüz fil qədər ağırdır. Buna baxmayaraq havada dayanır.',
        },
      },
      {
        id: 'cloud-rain',
        at: 3,
        text: {
          en: 'A flat grey blanket usually means rain is on the way. Check tomorrow and see if you were right.',
          tr: 'Düz gri bir battaniye genelde yağmur geliyor demek. Yarın bak, haklı mıydın gör.',
          az: 'Düz boz yorğan adətən yağış gəlir deməkdir. Sabah bax, haqlı idinmi gör.',
        },
      },
    ],
    variants: [
      { tag: 'heap', emoji: '☁️', name: { en: 'heap cloud', tr: 'yığın bulut', az: 'topa bulud' } },
      {
        tag: 'sheet',
        emoji: '🌫️',
        name: { en: 'blanket cloud', tr: 'battaniye bulut', az: 'yorğan bulud' },
      },
      {
        tag: 'wisp',
        emoji: '🪶',
        name: { en: 'wispy cloud', tr: 'tel tel bulut', az: 'tel-tel bulud' },
      },
    ],
  },

  {
    id: 'water',
    emoji: '💧',
    color: palette.sky,
    name: { en: 'water', tr: 'su', az: 'su' },
    reaction: {
      en: 'Water! Stay on dry ground unless a grown up is right beside you.',
      tr: 'Su! Yanında bir büyüğün yoksa kuru yerde kal.',
      az: 'Su! Yanında böyüyün yoxdursa, quru yerdə qal.',
    },
    caution: {
      en: 'Never go near deep or fast water without a grown up holding your hand.',
      tr: 'Derin ya da hızlı akan suyun yanına asla bir büyük elini tutmadan gitme.',
      az: 'Dərin və ya sürətli axan suyun yanına heç vaxt böyüyün əlindən tutmadan getmə.',
    },
    keywords: [
      'water',
      'sea',
      'ocean',
      'river',
      'lake',
      'pond',
      'wave',
      'puddle',
      'stream',
      'waterfall',
      'rain',
      'snow',
      'ice',
      'fountain',
      'canal',
    ],
    weak: ['liquid', 'fluid', 'beach', 'coast', 'reflection'],
    questions: [
      {
        id: 'moving',
        decides: true,
        prompt: { en: 'Is the water moving?', tr: 'Su akıyor mu?', az: 'Su axır?' },
        options: [
          { tag: 'running', emoji: '🌊', label: { en: 'It is running', tr: 'Akıyor', az: 'Axır' } },
          { tag: 'still', emoji: '🪞', label: { en: 'It is still', tr: 'Duruyor', az: 'Dayanıb' } },
        ],
      },
      {
        id: 'clear',
        prompt: {
          en: 'Can you see the bottom?',
          tr: 'Dibini görebiliyor musun?',
          az: 'Dibini görürsən?',
        },
        options: [
          {
            tag: 'clear',
            emoji: '👀',
            label: { en: 'Yes, clearly', tr: 'Evet, net', az: 'Bəli, aydın' },
          },
          {
            tag: 'murky',
            emoji: '🫧',
            label: { en: 'No, too murky', tr: 'Hayır, bulanık', az: 'Xeyr, bulanıqdır' },
          },
        ],
      },
      {
        id: 'alive',
        prompt: {
          en: 'Is anything living in it?',
          tr: 'İçinde yaşayan bir şey var mı?',
          az: 'İçində yaşayan bir şey var?',
        },
        options: [
          {
            tag: 'alive',
            emoji: '🐟',
            label: { en: 'I saw something', tr: 'Bir şey gördüm', az: 'Bir şey gördüm' },
          },
          {
            tag: 'empty',
            emoji: '🚫',
            label: { en: 'Nothing at all', tr: 'Hiçbir şey', az: 'Heç nə' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'water-round',
        at: 1,
        text: {
          en: 'That water has been going round and round the Earth for billions of years.',
          tr: 'O su milyarlarca yıldır dünyanın etrafında dönüp duruyor.',
          az: 'O su milyardlarla ildir Yer üzündə dönüb durur.',
        },
      },
      {
        id: 'water-dino',
        at: 2,
        text: {
          en: 'A dinosaur probably drank some of it once. Water never leaves, it only moves.',
          tr: 'Bir dinozor bir zamanlar ondan içmiştir. Su hiç gitmiyor, sadece yer değiştiriyor.',
          az: 'Bir dinozavr vaxtilə ondan içib. Su heç vaxt getmir, sadəcə yerini dəyişir.',
        },
      },
      {
        id: 'water-three',
        at: 3,
        text: {
          en: 'Water can be hard, wet or invisible. Ice, a puddle, and the air you are breathing right now.',
          tr: 'Su sert, ıslak ya da görünmez olabilir. Buz, su birikintisi ve şu an soluduğun hava.',
          az: 'Su bərk, yaş və ya görünməz ola bilər. Buz, su gölməçəsi və indi udduğun hava.',
        },
      },
    ],
    variants: [
      { tag: 'running', emoji: '🌊', name: { en: 'running water', tr: 'akan su', az: 'axan su' } },
      { tag: 'still', emoji: '🪞', name: { en: 'still water', tr: 'duran su', az: 'duran su' } },
    ],
  },

  {
    id: 'feather',
    emoji: '🪶',
    color: palette.grape,
    name: { en: 'feather', tr: 'tüy', az: 'lələk' },
    reaction: {
      en: 'A feather! A bird left that behind for you. How long is it?',
      tr: 'Tüy! Bir kuş onu sana bırakmış. Ne kadar uzun?',
      az: 'Lələk! Bir quş onu sənə qoyub gedib. Nə qədər uzundur?',
    },
    keywords: ['feather', 'plumage', 'quill', 'down feather'],
    weak: [],
    questions: [
      {
        id: 'length',
        decides: true,
        prompt: {
          en: 'Lay it on your hand. How long is it?',
          tr: 'Elinin üstüne koy. Ne kadar uzun?',
          az: 'Əlinin üstünə qoy. Nə qədər uzundur?',
        },
        options: [
          {
            tag: 'short',
            emoji: '🤏',
            label: { en: 'Shorter than my finger', tr: 'Parmağımdan kısa', az: 'Barmağımdan qısa' },
          },
          {
            tag: 'hand',
            emoji: '✋',
            label: { en: 'As long as my hand', tr: 'Elim kadar', az: 'Əlim qədər' },
          },
          {
            tag: 'long',
            emoji: '🙌',
            label: { en: 'Longer than my hand', tr: 'Elimden uzun', az: 'Əlimdən uzun' },
          },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          {
            tag: 'plain',
            emoji: '🤎',
            label: { en: 'Grey or brown', tr: 'Gri ya da kahverengi', az: 'Boz və ya qəhvəyi' },
          },
          { tag: 'black', emoji: '⚫', label: { en: 'Black', tr: 'Siyah', az: 'Qara' } },
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          {
            tag: 'bright',
            emoji: '🌈',
            label: { en: 'Bright colours', tr: 'Rengarenk', az: 'Rəngarəng' },
          },
        ],
      },
      {
        id: 'touch',
        prompt: {
          en: 'Stroke it. Soft or stiff?',
          tr: 'Okşa. Yumuşak mı sert mi?',
          az: 'Sığalla. Yumşaq, yoxsa bərk?',
        },
        options: [
          {
            tag: 'soft',
            emoji: '☁️',
            label: { en: 'Soft and fluffy', tr: 'Yumuşacık', az: 'Yumşaq və tüklü' },
          },
          { tag: 'stiff', emoji: '📏', label: { en: 'Stiff', tr: 'Sert', az: 'Bərk' } },
        ],
      },
    ],
    facts: [
      {
        id: 'feather-light',
        at: 1,
        text: {
          en: 'A feather weighs almost nothing, and one bird has thousands of them.',
          tr: 'Bir tüy neredeyse hiç ağırlık etmiyor, ve bir kuşta binlercesi var.',
          az: 'Bir lələk demək olar heç nə çəkmir, bir quşda isə minlərlə var.',
        },
      },
      {
        id: 'feather-hooks',
        at: 2,
        text: {
          en: 'Pull it apart gently, then stroke it back together. Feathers have tiny hooks that grab onto each other.',
          tr: 'Yavaşça ayır, sonra okşayarak birleştir. Tüylerde birbirine tutunan minik kancalar var.',
          az: 'Yavaşca ayır, sonra sığallayıb birləşdir. Lələklərdə bir-birinə yapışan balaca qarmaqlar var.',
        },
      },
      {
        id: 'feather-oil',
        at: 3,
        text: {
          en: 'Birds rub oil into their feathers so rain slides straight off. That is why a duck stays dry underneath.',
          tr: 'Kuşlar tüylerine yağ sürüyor, yağmur da kayıp gidiyor. Ördek altından bu yüzden kuru kalıyor.',
          az: 'Quşlar lələklərinə yağ sürtür, yağış da sürüşüb gedir. Ördək altdan buna görə quru qalır.',
        },
      },
    ],
    variants: [
      {
        tag: 'short',
        emoji: '🪶',
        name: { en: 'little feather', tr: 'küçük tüy', az: 'balaca lələk' },
      },
      { tag: 'hand', emoji: '🪶', name: { en: 'hand feather', tr: 'el tüyü', az: 'əl lələyi' } },
      { tag: 'long', emoji: '🪶', name: { en: 'long feather', tr: 'uzun tüy', az: 'uzun lələk' } },
    ],
  },

  {
    id: 'seed',
    emoji: '🌰',
    color: palette.clay,
    name: { en: 'seed', tr: 'tohum', az: 'toxum' },
    reaction: {
      en: 'A seed! There is a whole plant folded up inside that. Look closely.',
      tr: 'Tohum! İçinde koskoca bir bitki katlanmış duruyor. Yakından bak.',
      az: 'Toxum! İçində bütöv bir bitki qatlanıb durur. Yaxından bax.',
    },
    keywords: [
      'seed',
      'nut',
      'acorn',
      'cone',
      'pine cone',
      'conifer cone',
      'chestnut',
      'grain',
      'kernel',
    ],
    weak: ['fruit', 'berry', 'produce'],
    questions: [
      {
        id: 'wrapper',
        decides: true,
        prompt: { en: 'What is it wearing?', tr: 'Üstünde ne var?', az: 'Üstündə nə var?' },
        options: [
          {
            tag: 'shell',
            emoji: '🌰',
            label: { en: 'A hard shell', tr: 'Sert bir kabuk', az: 'Bərk bir qabıq' },
          },
          { tag: 'cone', emoji: '🌲', label: { en: 'A cone', tr: 'Kozalak', az: 'Qoza' } },
          {
            tag: 'fluff',
            emoji: '🪂',
            label: { en: 'A fluffy parachute', tr: 'Tüylü bir paraşüt', az: 'Tüklü bir paraşüt' },
          },
          { tag: 'bare', emoji: '⚪', label: { en: 'Nothing', tr: 'Hiçbir şey', az: 'Heç nə' } },
        ],
      },
      {
        id: 'size',
        prompt: { en: 'How big is it?', tr: 'Ne kadar büyük?', az: 'Nə qədər böyükdür?' },
        options: [
          {
            tag: 'crumb',
            emoji: '🔬',
            label: { en: 'Tiny as a crumb', tr: 'Kırıntı kadar', az: 'Qırıntı boyda' },
          },
          {
            tag: 'pea',
            emoji: '🫛',
            label: { en: 'Like a pea', tr: 'Bezelye kadar', az: 'Noxud boyda' },
          },
          {
            tag: 'nut',
            emoji: '🌰',
            label: { en: 'Big as a nut', tr: 'Fındık kadar', az: 'Fındıq boyda' },
          },
        ],
      },
    ],
    facts: [
      {
        id: 'seed-tree',
        at: 1,
        text: {
          en: 'A whole tree is folded up inside there, waiting.',
          tr: 'Orada koskoca bir ağaç katlanmış, bekliyor.',
          az: 'Orada bütöv bir ağac qatlanıb, gözləyir.',
        },
      },
      {
        id: 'seed-fly',
        at: 2,
        text: {
          en: 'Fluffy seeds are built to fly. The wind carries them far away so they do not grow in the shadow of the parent plant.',
          tr: 'Tüylü tohumlar uçmak için yapılmış. Rüzgâr onları uzağa taşıyor ki ana bitkinin gölgesinde büyümesinler.',
          az: 'Tüklü toxumlar uçmaq üçün qurulub. Külək onları uzağa aparır ki, ana bitkinin kölgəsində böyüməsinlər.',
        },
      },
      {
        id: 'seed-wait',
        at: 2,
        text: {
          en: 'Some seeds wait years in the ground for the right rain, then start growing as if no time had passed at all.',
          tr: 'Bazı tohumlar doğru yağmuru yıllarca toprakta bekliyor, sonra hiç zaman geçmemiş gibi büyümeye başlıyor.',
          az: 'Bəzi toxumlar düzgün yağışı illərlə torpaqda gözləyir, sonra heç vaxt keçməyibmiş kimi böyüməyə başlayır.',
        },
      },
    ],
    variants: [
      {
        tag: 'shell',
        emoji: '🌰',
        name: { en: 'shell seed', tr: 'kabuklu tohum', az: 'qabıqlı toxum' },
      },
      { tag: 'cone', emoji: '🌲', name: { en: 'cone', tr: 'kozalak', az: 'qoza' } },
      { tag: 'fluff', emoji: '🪂', name: { en: 'flying seed', tr: 'uçan tohum', az: 'uçan toxum' } },
      { tag: 'bare', emoji: '⚪', name: { en: 'bare seed', tr: 'çıplak tohum', az: 'çılpaq toxum' } },
    ],
  },

  {
    id: 'mushroom',
    emoji: '🍄',
    color: palette.coralDeep,
    name: { en: 'mushroom', tr: 'mantar', az: 'göbələk' },
    reaction: {
      en: 'A mushroom! Hands behind your back, please. Eyes only.',
      tr: 'Mantar! Ellerini arkana koy lütfen. Sadece gözle.',
      az: 'Göbələk! Əllərini arxana qoy, xahiş edirəm. Yalnız gözlə.',
    },
    caution: {
      en: 'Never touch a mushroom and never ever eat one. Some are fine and some are dangerous, and even grown ups mix them up.',
      tr: 'Mantara asla dokunma ve asla yeme. Bazıları zararsız, bazıları tehlikeli, büyükler bile karıştırıyor.',
      az: 'Göbələyə heç vaxt toxunma və heç vaxt yemə. Bəziləri zərərsizdir, bəziləri təhlükəli, hətta böyüklər də qarışdırır.',
    },
    keywords: ['mushroom', 'fungus', 'toadstool', 'agaric', 'fungi'],
    weak: [],
    questions: [
      {
        id: 'shape',
        decides: true,
        prompt: {
          en: 'What shape is the top?',
          tr: 'Üstü nasıl bir şekilde?',
          az: 'Üstü necə formadadır?',
        },
        options: [
          {
            tag: 'umbrella',
            emoji: '☂️',
            label: { en: 'Like an umbrella', tr: 'Şemsiye gibi', az: 'Çətir kimi' },
          },
          { tag: 'flat', emoji: '🥞', label: { en: 'Flat', tr: 'Düz', az: 'Yastı' } },
          { tag: 'lumpy', emoji: '🪨', label: { en: 'Lumpy', tr: 'Yumru', az: 'Yumru' } },
        ],
      },
      {
        id: 'colour',
        prompt: { en: 'What colour is it?', tr: 'Ne renk?', az: 'Hansı rəngdədir?' },
        options: [
          { tag: 'brown', emoji: '🤎', label: { en: 'Brown', tr: 'Kahverengi', az: 'Qəhvəyi' } },
          { tag: 'white', emoji: '🤍', label: { en: 'White', tr: 'Beyaz', az: 'Ağ' } },
          { tag: 'red', emoji: '🔴', label: { en: 'Red', tr: 'Kırmızı', az: 'Qırmızı' } },
          { tag: 'grey', emoji: '🩶', label: { en: 'Grey', tr: 'Gri', az: 'Boz' } },
        ],
      },
    ],
    facts: [
      {
        id: 'mushroom-safe',
        at: 0,
        text: {
          en: 'Never touch a mushroom. Some are fine and some are dangerous, and even grown ups get them mixed up.',
          tr: 'Mantara asla dokunma. Bazıları zararsız, bazıları tehlikeli, büyükler bile karıştırıyor.',
          az: 'Göbələyə heç vaxt toxunma. Bəziləri zərərsizdir, bəziləri təhlükəli, hətta böyüklər də qarışdırır.',
        },
      },
      {
        id: 'mushroom-notplant',
        at: 1,
        text: {
          en: 'A mushroom is not a plant. It is the only part you can see of something much bigger living under the ground.',
          tr: 'Mantar bir bitki değil. Toprağın altında yaşayan çok daha büyük bir şeyin görebildiğin tek parçası.',
          az: 'Göbələk bitki deyil. Torpağın altında yaşayan daha böyük bir şeyin görə bildiyin yeganə hissəsidir.',
        },
      },
      {
        id: 'mushroom-web',
        at: 2,
        text: {
          en: 'Under your feet there is a web of threads joining the trees together. Trees use it to send food to each other.',
          tr: 'Ayaklarının altında ağaçları birbirine bağlayan bir iplik ağı var. Ağaçlar birbirine yemek göndermek için onu kullanıyor.',
          az: 'Ayaqlarının altında ağacları bir-birinə bağlayan sap şəbəkəsi var. Ağaclar bir-birinə yemək göndərmək üçün ondan istifadə edir.',
        },
      },
    ],
    variants: [
      {
        tag: 'umbrella',
        emoji: '🍄',
        name: { en: 'umbrella mushroom', tr: 'şemsiye mantar', az: 'çətir göbələk' },
      },
      { tag: 'flat', emoji: '🥞', name: { en: 'flat mushroom', tr: 'düz mantar', az: 'yastı göbələk' } },
      {
        tag: 'lumpy',
        emoji: '🪨',
        name: { en: 'lumpy mushroom', tr: 'yumru mantar', az: 'yumru göbələk' },
      },
    ],
  },
];

export const findKindMeta = new Map(findKinds.map((kind) => [kind.id, kind]));

export function findKind(id: FindKindId): FindKind {
  const kind = findKindMeta.get(id);
  if (!kind) throw new Error(`unknown find kind: ${id}`);
  return kind;
}

export function isFindKind(value: string): value is FindKindId {
  return (FIND_KINDS as readonly string[]).includes(value);
}
