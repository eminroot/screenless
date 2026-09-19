import type { Localized } from '../i18n/types';
import type {
  AgeBand,
  MissionMode,
  MotionSpec,
  ProofKind,
  RoomObjectId,
  TaskCategory,
} from '../state/types';
import { ROOM_OBJECTS } from '../state/types';

/** Objects a slot will accept. The engine fills each slot from the room scan. */
export type Slot = readonly RoomObjectId[];

const ANY: Slot = ROOM_OBJECTS;
const FLAT: Slot = ['book', 'paper', 'towel', 'blanket', 'puzzle'];
const FRIEND: Slot = ['teddy', 'toycar', 'puzzle', 'hat'];
const MOVER: Slot = ['ball', 'sock', 'cup', 'toycar'];
const STACK: Slot = ['blocks', 'box', 'cup', 'book', 'pillow', 'puzzle'];
const OBSTACLE: Slot = ['chair', 'box', 'pillow', 'shoe', 'bottle', 'plant'];
const THROWABLE: Slot = ['sock', 'ball', 'paper', 'teddy'];
const TARGET: Slot = ['box', 'towel', 'cup', 'hat', 'blanket'];

/**
 * A mission written around whatever the camera actually found in the room.
 *
 * `{{a}}`, `{{b}}` and `{{c}}` are replaced with the objects picked for slots
 * one, two and three. Every sentence puts the object either straight after a
 * number or before "with", the two positions that need no case ending in
 * Turkish or Azerbaijani, so the filled text is always grammatical.
 */
export type RoomTemplate = {
  id: string;
  emoji: string;
  category: TaskCategory;
  minutes: number;
  stars: number;
  ageBands: AgeBand[];
  slots: Slot[];
  mode?: MissionMode;
  proof?: ProofKind;
  motion?: MotionSpec;
  title: Localized;
  body: Localized;
  steps: Localized[];
  parentBrief?: Localized;
};

export const roomTemplates: RoomTemplate[] = [
  {
    id: 'room-rescue',
    emoji: '🦸',
    category: 'move',
    minutes: 10,
    stars: 12,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [FLAT, FRIEND, MOVER],
    title: { en: 'Secret rescue', tr: 'Gizli kurtarma', az: 'Gizli xilasetmə' },
    body: {
      en: 'Three {{a}} block the way, a friend is stuck behind them, and only one {{c}} can get through.',
      tr: 'Üç {{a}} yolu kapatıyor, arkasında bir arkadaş sıkıştı ve oraya sadece bir {{c}} ulaşabilir.',
      az: 'Üç {{a}} yolu bağlayır, arxasında bir dost qalıb və oraya yalnız bir {{c}} çata bilər.',
    },
    steps: [
      {
        en: 'Put three {{a}} on the floor in a line.',
        tr: 'Yere sıra hâlinde üç {{a}} koy.',
        az: 'Yerə sıra ilə üç {{a}} qoy.',
      },
      {
        en: 'Hide one {{b}} behind the line.',
        tr: 'Sıranın arkasına bir {{b}} sakla.',
        az: 'Sıranın arxasına bir {{b}} gizlət.',
      },
      {
        en: 'Move one {{c}} all the way around the line without touching it.',
        tr: 'Bir {{c}} ile sıranın etrafından dolaş, hiçbirine değme.',
        az: 'Bir {{c}} ilə sıranın ətrafından dolan, heç birinə toxunma.',
      },
      {
        en: 'Reach your friend and carry them out. Mission complete.',
        tr: 'Arkadaşına ulaş ve onu oradan çıkar. Görev tamam.',
        az: 'Dostuna çat və onu oradan çıxart. Tapşırıq tamam.',
      },
    ],
  },
  {
    id: 'room-hunt',
    emoji: '🕵️',
    category: 'move',
    minutes: 8,
    stars: 11,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [ANY],
    title: { en: 'Treasure hunt', tr: 'Hazine avı', az: 'Xəzinə ovu' },
    body: {
      en: 'Five orders, one after the other. The last one is the treasure.',
      tr: 'Beş emir, arka arkaya. Sonuncusu hazine.',
      az: 'Beş əmr, biri digərinin ardınca. Sonuncusu xəzinədir.',
    },
    steps: [
      {
        en: 'Find something blue and hold it up.',
        tr: 'Mavi bir şey bul ve havaya kaldır.',
        az: 'Mavi bir şey tap və yuxarı qaldır.',
      },
      {
        en: 'Put it down next to your bed.',
        tr: 'Onu yatağının yanına bırak.',
        az: 'Onu çarpayının yanına qoy.',
      },
      {
        en: 'Find something soft and something hard.',
        tr: 'Yumuşak bir şey ve sert bir şey bul.',
        az: 'Yumşaq bir şey və sərt bir şey tap.',
      },
      { en: 'Jump ten times on the spot.', tr: 'Olduğun yerde on kere zıpla.', az: 'Olduğun yerdə on dəfə tullan.' },
      {
        en: 'Now the treasure: bring one {{a}} back here.',
        tr: 'Şimdi hazine: buraya bir {{a}} getir.',
        az: 'İndi xəzinə: bura bir {{a}} gətir.',
      },
    ],
  },
  {
    id: 'room-tower',
    emoji: '🗼',
    category: 'create',
    minutes: 10,
    stars: 12,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [STACK],
    proof: 'photo',
    title: { en: 'Tower of the room', tr: 'Odanın kulesi', az: 'Otağın qülləsi' },
    body: {
      en: 'Build the tallest tower you can with {{a}}, and photograph it before it falls.',
      tr: '{{a}} ile yapabildiğin en yüksek kuleyi yap ve devrilmeden fotoğrafını çek.',
      az: '{{a}} ilə qura bildiyin ən hündür qülləni qur və yıxılmamış şəklini çək.',
    },
    steps: [
      { en: 'Gather everything you can stack.', tr: 'Üst üste koyabildiğin her şeyi topla.', az: 'Üst-üstə qoya bildiyin hər şeyi topla.' },
      { en: 'Biggest at the bottom, smallest on top.', tr: 'En büyük altta, en küçük üstte.', az: 'Ən böyük altda, ən kiçik üstdə.' },
      { en: 'Let go and count to five.', tr: 'Elini çek ve beşe kadar say.', az: 'Əlini çək və beşə qədər say.' },
      { en: 'Still standing? Take the photo.', tr: 'Hâlâ ayakta mı? Fotoğrafı çek.', az: 'Hələ ayaqdadır? Şəkli çək.' },
    ],
  },
  {
    id: 'room-slalom',
    emoji: '🔻',
    category: 'move',
    minutes: 12,
    stars: 14,
    ageBands: ['6-9', '10-14'],
    slots: [OBSTACLE, MOVER],
    title: { en: 'Room slalom', tr: 'Oda slalomu', az: 'Otaq slalomu' },
    body: {
      en: 'Five {{a}} in a line, one {{b}} to weave between them, three runs without a single touch.',
      tr: 'Sıraya beş {{a}}, aralarından geçecek bir {{b}} ve hiç değmeden üç tur.',
      az: 'Sıraya beş {{a}}, aralarından keçəcək bir {{b}} və heç toxunmadan üç tur.',
    },
    steps: [
      {
        en: 'Line up five {{a}} with a big step between each.',
        tr: 'Aralarında birer büyük adım olacak şekilde beş {{a}} diz.',
        az: 'Aralarında bir böyük addım olmaqla beş {{a}} düz.',
      },
      {
        en: 'Take one {{b}} to the start.',
        tr: 'Başlangıca bir {{b}} getir.',
        az: 'Başlanğıca bir {{b}} gətir.',
      },
      { en: 'Weave to the end and back.', tr: 'Aralarından geçerek sona git ve dön.', az: 'Aralarından keçərək sona get və qayıt.' },
      { en: 'Three clean runs and you win.', tr: 'Değmeden üç tur ve kazandın.', az: 'Toxunmadan üç tur və uddun.' },
    ],
  },
  {
    id: 'room-basket',
    emoji: '🎯',
    category: 'move',
    minutes: 10,
    stars: 11,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [THROWABLE, TARGET],
    title: { en: 'Room basketball', tr: 'Oda basketbolu', az: 'Otaq basketbolu' },
    body: {
      en: 'One {{b}} is the basket. Ten shots with a {{a}}, and every step back is worth more.',
      tr: 'Bir {{b}} potadır. Bir {{a}} ile on atış yap, her geri adım daha çok değer.',
      az: 'Bir {{b}} səbətdir. Bir {{a}} ilə on atış et, hər geri addım daha çox dəyər.',
    },
    steps: [
      { en: 'Put one {{b}} on the floor.', tr: 'Yere bir {{b}} koy.', az: 'Yerə bir {{b}} qoy.' },
      { en: 'Stand two steps away and take five shots.', tr: 'İki adım geride dur ve beş atış yap.', az: 'İki addım geridə dur və beş atış et.' },
      { en: 'Step back twice. Five more shots.', tr: 'İki adım daha geri git. Beş atış daha.', az: 'İki addım da geri get. Beş atış da.' },
      { en: 'Count how many went in.', tr: 'Kaç tanesinin girdiğini say.', az: 'Neçəsinin girdiyini say.' },
    ],
  },
  {
    id: 'room-balance',
    emoji: '🧘',
    category: 'calm',
    minutes: 8,
    stars: 9,
    ageBands: ['6-9', '10-14'],
    slots: [FLAT],
    title: { en: 'Head balance', tr: 'Kafada denge', az: 'Başda tarazlıq' },
    body: {
      en: 'Walk the room from wall to wall with one {{a}} balanced on your head.',
      tr: 'Kafanda bir {{a}} taşıyarak odayı bir duvardan diğerine yürü.',
      az: 'Başında bir {{a}} daşıyaraq otağı bir divardan digərinə yeri.',
    },
    steps: [
      { en: 'Put one {{a}} flat on your head.', tr: 'Kafanın üstüne düz bir {{a}} koy.', az: 'Başının üstünə düz bir {{a}} qoy.' },
      { en: 'Walk to the far wall very slowly.', tr: 'Karşı duvara çok yavaş yürü.', az: 'Qarşı divara çox yavaş yeri.' },
      { en: 'Turn around and come back.', tr: 'Dön ve geri gel.', az: 'Dön və geri qayıt.' },
      { en: 'Do it once more, but faster.', tr: 'Bir kez daha yap, bu sefer daha hızlı.', az: 'Bir dəfə də et, bu dəfə daha sürətli.' },
    ],
  },
  {
    id: 'room-museum',
    emoji: '🏛️',
    category: 'create',
    minutes: 10,
    stars: 11,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [ANY, ANY, ANY],
    title: { en: 'One room museum', tr: 'Tek odalık müze', az: 'Bir otaqlıq muzey' },
    body: {
      en: 'A {{a}}, a {{b}} and a {{c}} are your exhibits. Set them up and give someone the tour.',
      tr: 'Bir {{a}}, bir {{b}} ve bir {{c}} senin eserlerin. Onları diz ve birine turu anlat.',
      az: 'Bir {{a}}, bir {{b}} və bir {{c}} sənin eksponatlarındır. Onları düz və birinə turu danış.',
    },
    steps: [
      { en: 'Put the three things in a row on the floor.', tr: 'Üç şeyi yere sıra hâlinde koy.', az: 'Üç şeyi yerə sıra ilə qoy.' },
      { en: 'Give each one a name and an age.', tr: 'Her birine bir isim ve bir yaş ver.', az: 'Hər birinə bir ad və bir yaş ver.' },
      { en: 'Find someone at home to be your visitor.', tr: 'Evden birini ziyaretçi olarak bul.', az: 'Evdən birini ziyarətçi kimi tap.' },
      { en: 'Walk them past all three and tell the stories.', tr: 'Üçünün de önünden geçir ve hikâyelerini anlat.', az: 'Üçünün də qarşısından keçir və hekayələrini danış.' },
    ],
  },
  {
    id: 'room-story',
    emoji: '📖',
    category: 'calm',
    minutes: 10,
    stars: 10,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [ANY, ANY, ANY],
    title: { en: 'Three thing story', tr: 'Üç şeylik hikâye', az: 'Üç şeylik hekayə' },
    body: {
      en: 'Make up a story where a {{a}}, a {{b}} and a {{c}} all matter.',
      tr: 'Bir {{a}}, bir {{b}} ve bir {{c}} önemli olsun diye bir hikâye uydur.',
      az: 'Bir {{a}}, bir {{b}} və bir {{c}} önəmli olsun deyə bir hekayə uydur.',
    },
    steps: [
      { en: 'Put the three things in front of you.', tr: 'Üç şeyi önüne koy.', az: 'Üç şeyi qarşına qoy.' },
      { en: 'Decide which one is the hero.', tr: 'Hangisinin kahraman olduğuna karar ver.', az: 'Hansının qəhrəman olduğuna qərar ver.' },
      { en: 'Something goes wrong. What is it?', tr: 'Bir şeyler ters gidiyor. Ne oluyor?', az: 'Bir şey tərs gedir. Nə olur?' },
      { en: 'Tell the whole story out loud to someone.', tr: 'Hikâyenin tamamını birine yüksek sesle anlat.', az: 'Hekayənin hamısını birinə ucadan danış.' },
    ],
  },
  {
    id: 'room-sort',
    emoji: '📏',
    category: 'create',
    minutes: 8,
    stars: 9,
    ageBands: ['3-5', '6-9'],
    slots: [ANY],
    proof: 'photo',
    title: { en: 'Small to big', tr: 'Küçükten büyüğe', az: 'Kiçikdən böyüyə' },
    body: {
      en: 'Find five {{a}} around the house and line them up from smallest to biggest.',
      tr: 'Evde beş {{a}} bul ve küçükten büyüğe diz.',
      az: 'Evdə beş {{a}} tap və kiçikdən böyüyə düz.',
    },
    steps: [
      { en: 'Hunt down five {{a}}.', tr: 'Beş {{a}} bul.', az: 'Beş {{a}} tap.' },
      { en: 'Line them up smallest first.', tr: 'En küçük başta olacak şekilde diz.', az: 'Ən kiçik başda olmaqla düz.' },
      { en: 'Photograph the line.', tr: 'Sıranın fotoğrafını çek.', az: 'Sıranın şəklini çək.' },
      { en: 'Put every one of them back.', tr: 'Hepsini yerine koy.', az: 'Hamısını yerinə qoy.' },
    ],
  },
  {
    id: 'room-duo-hide',
    emoji: '🙈',
    category: 'social',
    mode: 'duo',
    minutes: 10,
    stars: 13,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [FRIEND, ANY],
    title: { en: 'Two things hidden', tr: 'Saklanan iki şey', az: 'Gizlədilmiş iki şey' },
    body: {
      en: 'A grown up hides one {{a}} and one {{b}} in this room. Find both before the timer runs out.',
      tr: 'Bir büyük bu odaya bir {{a}} ve bir {{b}} saklasın. Süre bitmeden ikisini de bul.',
      az: 'Böyük bu otaqda bir {{a}} və bir {{b}} gizlətsin. Vaxt bitməmiş ikisini də tap.',
    },
    steps: [
      { en: 'Close your eyes and count to twenty.', tr: 'Gözlerini kapat ve yirmiye kadar say.', az: 'Gözlərini yum və iyirmiyə qədər say.' },
      { en: 'Hunt. You get three hot or cold hints.', tr: 'Aramaya başla. Üç kez sıcak soğuk ipucu hakkın var.', az: 'Axtarmağa başla. Üç dəfə isti soyuq ipucu haqqın var.' },
      { en: 'Bring both back to the grown up.', tr: 'İkisini de büyüğe getir.', az: 'İkisini də böyüyə gətir.' },
      { en: 'Now hide them yourself and swap.', tr: 'Şimdi sen sakla ve sıra değiştirin.', az: 'İndi sən gizlət və rolları dəyişin.' },
    ],
    parentBrief: {
      en: 'Hide both somewhere your child can reach without climbing. Three hints only, then help.',
      tr: 'İkisini de çocuğunuzun tırmanmadan ulaşabileceği yerlere saklayın. Sadece üç ipucu, sonra yardım edin.',
      az: 'İkisini də uşağınızın dırmaşmadan çata biləcəyi yerlərə gizlədin. Yalnız üç ipucu, sonra kömək edin.',
    },
  },
  {
    id: 'room-fetch-jump',
    emoji: '🦘',
    category: 'move',
    minutes: 6,
    stars: 10,
    ageBands: ['3-5', '6-9', '10-14'],
    slots: [ANY],
    proof: 'motion',
    motion: { kind: 'jump', count: 12 },
    title: { en: 'Fetch and fly', tr: 'Getir ve uç', az: 'Gətir və uç' },
    body: {
      en: 'Run and bring one {{a}} back here, then jump twelve times to power the buddy up.',
      tr: 'Koş ve buraya bir {{a}} getir, sonra arkadaşını şarj etmek için on iki kere zıpla.',
      az: 'Qaç və bura bir {{a}} gətir, sonra dostunu doldurmaq üçün on iki dəfə tullan.',
    },
    steps: [
      { en: 'Go and get one {{a}}.', tr: 'Git ve bir {{a}} al.', az: 'Get və bir {{a}} götür.' },
      { en: 'Come back to this exact spot.', tr: 'Tam bu noktaya geri gel.', az: 'Düz bu nöqtəyə qayıt.' },
      { en: 'Hold the phone and jump twelve times.', tr: 'Telefonu tut ve on iki kere zıpla.', az: 'Telefonu tut və on iki dəfə tullan.' },
    ],
  },
];
