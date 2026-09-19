import type { Localized } from '../i18n/types';
import type { RoomObjectId } from '../state/types';

/**
 * Three clues for each thing the buddy can be secretly thinking of.
 *
 * Only objects every home has, and only ones the on device labeller knows, so
 * the child can hold the real thing up to the camera and the phone can agree.
 * The clues run from vague to nearly giving it away. None of them names the
 * object, and none of them depends on a particular kind of home: no stairs, no
 * garden, no dishwasher.
 */
export type ClueObject = {
  id: RoomObjectId;
  clues: [Localized, Localized, Localized];
};

export const clueObjects: ClueObject[] = [
  {
    id: 'spoon',
    clues: [
      { en: 'I live in the kitchen.', tr: 'Mutfakta yaşarım.', az: 'Mətbəxdə yaşayıram.' },
      {
        en: 'I am small, and I am made of metal or plastic.',
        tr: 'Küçüğüm, metalden ya da plastikten yapılırım.',
        az: 'Kiçiyəm, metaldan və ya plastikdən olur.',
      },
      { en: 'You eat soup with me.', tr: 'Çorbayı benimle içersin.', az: 'Şorbanı mənimlə içirsən.' },
    ],
  },
  {
    id: 'cup',
    clues: [
      { en: 'You find me in the kitchen.', tr: 'Beni mutfakta bulursun.', az: 'Məni mətbəxdə taparsan.' },
      {
        en: 'I am empty inside, and I stand on the table.',
        tr: 'İçim boştur ve masada dururum.',
        az: 'İçim boşdur və masanın üstündə dururam.',
      },
      { en: 'You drink water from me.', tr: 'Benden su içersin.', az: 'Məndən su içirsən.' },
    ],
  },
  {
    id: 'pillow',
    clues: [
      { en: 'I am soft.', tr: 'Yumuşağım.', az: 'Yumşağam.' },
      {
        en: 'I spend the day on the bed or the sofa.',
        tr: 'Günümü yatakta ya da kanepede geçiririm.',
        az: 'Günümü çarpayıda və ya divanda keçirirəm.',
      },
      {
        en: 'Your head lies on me every night.',
        tr: 'Her gece başın benim üstümde.',
        az: 'Hər gecə başın mənim üstümdə olur.',
      },
    ],
  },
  {
    id: 'book',
    clues: [
      { en: 'I have lots of pages.', tr: 'Çok sayfam var.', az: 'Çoxlu səhifəm var.' },
      {
        en: 'I often sit on a shelf.',
        tr: 'Genellikle bir rafta dururum.',
        az: 'Çox vaxt rəfdə dururam.',
      },
      {
        en: 'Open me and I tell you a story.',
        tr: 'Beni açarsan sana bir hikâye anlatırım.',
        az: 'Məni açsan, sənə nağıl danışaram.',
      },
    ],
  },
  {
    id: 'sock',
    clues: [
      { en: 'I usually come in a pair.', tr: 'Genelde çift olarak gelirim.', az: 'Adətən cüt oluram.' },
      { en: 'I am made of soft cloth.', tr: 'Yumuşak kumaştan yapılırım.', az: 'Yumşaq parçadan olur.' },
      {
        en: 'I keep your feet warm inside your shoes.',
        tr: 'Ayakkabının içinde ayaklarını sıcak tutarım.',
        az: 'Ayaqqabının içində ayaqlarını isti saxlayıram.',
      },
    ],
  },
  {
    id: 'shoe',
    clues: [
      {
        en: 'I usually wait near the front door.',
        tr: 'Genelde kapının yanında beklerim.',
        az: 'Adətən qapının yanında gözləyirəm.',
      },
      { en: 'I have laces or a strap.', tr: 'Bağcığım ya da cırt cırtım var.', az: 'Bağım və ya cırt-cırtım var.' },
      {
        en: 'You wear me on your feet to go outside.',
        tr: 'Dışarı çıkarken beni ayağına giyersin.',
        az: 'Çölə çıxanda məni ayağına geyinirsən.',
      },
    ],
  },
  {
    id: 'towel',
    clues: [
      { en: 'I hang on a hook or a rail.', tr: 'Bir askıda ya da çubukta asılı dururum.', az: 'Qarmaqdan və ya çubuqdan asılıram.' },
      { en: 'I am soft and fluffy.', tr: 'Yumuşak ve pofuduğum.', az: 'Yumşaq və tüklüyəm.' },
      {
        en: 'I dry you after a bath.',
        tr: 'Banyodan sonra seni kuruturum.',
        az: 'Çimdikdən sonra səni qurulayıram.',
      },
    ],
  },
  {
    id: 'chair',
    clues: [
      { en: 'I have four legs but I never walk.', tr: 'Dört bacağım var ama hiç yürümem.', az: 'Dörd ayağım var, amma heç yeriməm.' },
      { en: 'I have a back.', tr: 'Bir sırtım var.', az: 'Söykənəcəyim var.' },
      { en: 'You sit on me at the table.', tr: 'Masada benim üstüme oturursun.', az: 'Masa arxasında mənim üstümdə oturursan.' },
    ],
  },
  {
    id: 'pencil',
    clues: [
      { en: 'I am long and thin.', tr: 'Uzun ve inceyim.', az: 'Uzun və nazikəm.' },
      {
        en: 'I get shorter the more you use me.',
        tr: 'Kullandıkça kısalırım.',
        az: 'İstifadə etdikcə qısalıram.',
      },
      { en: 'You draw and write with me.', tr: 'Benimle çizer ve yazarsın.', az: 'Mənimlə şəkil çəkir və yazırsan.' },
    ],
  },
  {
    id: 'bottle',
    clues: [
      { en: 'I have a lid or a cap.', tr: 'Bir kapağım var.', az: 'Qapağım var.' },
      {
        en: 'My neck is thinner than my body.',
        tr: 'Boynum gövdemden incedir.',
        az: 'Boğazım gövdəmdən nazikdir.',
      },
      { en: 'Water or juice goes inside me.', tr: 'İçime su ya da meyve suyu konur.', az: 'İçimə su və ya şirə tökülür.' },
    ],
  },
  {
    id: 'blanket',
    clues: [
      { en: 'I am big and soft.', tr: 'Büyük ve yumuşağım.', az: 'Böyük və yumşağam.' },
      { en: 'You can fold me up small.', tr: 'Beni katlayıp küçültebilirsin.', az: 'Məni qatlayıb kiçildə bilərsən.' },
      {
        en: 'I keep you warm when you sleep.',
        tr: 'Uyurken seni sıcak tutarım.',
        az: 'Yatanda səni isti saxlayıram.',
      },
    ],
  },
  {
    id: 'box',
    clues: [
      { en: 'I have six flat sides.', tr: 'Altı düz yüzüm var.', az: 'Altı düz tərəfim var.' },
      {
        en: 'I am often made of cardboard.',
        tr: 'Çoğu zaman kartondan yapılırım.',
        az: 'Çox vaxt kartondan olur.',
      },
      {
        en: 'You put things inside me to keep them together.',
        tr: 'Bir arada dursunlar diye eşyaları içime koyarsın.',
        az: 'Əşyaları bir yerdə saxlamaq üçün içimə qoyursan.',
      },
    ],
  },
  {
    id: 'ball',
    clues: [
      { en: 'I have no corners at all.', tr: 'Hiç köşem yok.', az: 'Heç bir küncüm yoxdur.' },
      { en: 'I bounce.', tr: 'Zıplarım.', az: 'Hoppanıram.' },
      { en: 'You kick me or throw me.', tr: 'Bana tekme atarsın ya da beni fırlatırsın.', az: 'Məni təpikləyir və ya atırsan.' },
    ],
  },
  {
    id: 'plant',
    clues: [
      { en: 'I am alive, but I cannot move.', tr: 'Canlıyım ama hareket edemem.', az: 'Canlıyam, amma yerimdən tərpənə bilmirəm.' },
      { en: 'I like sitting near a window.', tr: 'Pencere kenarında durmayı severim.', az: 'Pəncərənin yanında durmağı sevirəm.' },
      {
        en: 'I am green and I need water.',
        tr: 'Yeşilim ve suya ihtiyacım var.',
        az: 'Yaşılam və suya ehtiyacım var.',
      },
    ],
  },
  {
    id: 'hat',
    clues: [
      { en: 'You wear me.', tr: 'Beni giyersin.', az: 'Məni geyinirsən.' },
      { en: 'I am not a shoe and not a sock.', tr: 'Ayakkabı değilim, çorap da değilim.', az: 'Ayaqqabı deyiləm, corab da deyiləm.' },
      {
        en: 'I sit on top of your head.',
        tr: 'Başının üstünde dururum.',
        az: 'Başının üstündə dururam.',
      },
    ],
  },
];

export const clueObjectMap = new Map(clueObjects.map((entry) => [entry.id, entry]));
