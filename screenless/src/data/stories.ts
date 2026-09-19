import type { Localized } from '../i18n/types';
import type { AgeBand, InterestId } from '../state/types';

/**
 * Stories the buddy reads out loud.
 *
 * Every one is short enough for a bedtime and ends by pointing at something
 * real to go and do, so a story is a way off the screen rather than another
 * reason to stay on it. Pages are sized for one breath of narration.
 */
export type Story = {
  id: string;
  emoji: string;
  minutes: number;
  ageBands: AgeBand[];
  interests: InterestId[];
  title: Localized;
  pages: Localized[];
  /** The buddy's closing line, which hands the child back to the real world. */
  closer: Localized;
};

export const storyLibrary: Story[] = [
  {
    id: 'story-ball',
    emoji: '⚽',
    minutes: 4,
    ageBands: ['3-5', '6-9', '10-13'],
    interests: ['football', 'space'],
    title: {
      en: 'The ball that wanted to fly',
      tr: 'Uçmak isteyen top',
      az: 'Uçmaq istəyən top',
    },
    pages: [
      {
        en: 'In the corner of a garden lived an old leather ball. Every night he watched the birds go over the roof, and every night he thought the same thing. One day I will go up there too.',
        tr: 'Bir bahçenin köşesinde eski bir deri top yaşarmış. Her gece çatının üstünden geçen kuşları izler ve her gece aynı şeyi düşünürmüş. Bir gün ben de oraya çıkacağım.',
        az: 'Bir bağçanın küncündə köhnə dəri top yaşayırmış. Hər gecə damın üstündən keçən quşlara baxar və hər gecə eyni şeyi düşünərmiş. Bir gün mən də ora qalxacağam.',
      },
      {
        en: 'The garden chair laughed at him. Balls roll, she said. Birds fly. That is how it has always been. The ball said nothing and went on watching.',
        tr: 'Bahçedeki sandalye ona gülmüş. Toplar yuvarlanır, demiş. Kuşlar uçar. Hep böyle olmuştur. Top hiçbir şey dememiş, izlemeye devam etmiş.',
        az: 'Bağçadakı stul ona gülmüş. Toplar yuvarlanır, demiş. Quşlar uçur. Həmişə belə olub. Top heç nə deməyib, baxmağa davam edib.',
      },
      {
        en: 'Then a child came out of the house. She was small and her shoes were too big, and she did not know that balls only roll. She put the ball down, ran three steps and kicked.',
        tr: 'Sonra evden bir çocuk çıkmış. Küçükmüş, ayakkabıları ona büyük gelirmiş ve toplar sadece yuvarlanır diye bir şey bilmiyormuş. Topu yere koymuş, üç adım koşmuş ve vurmuş.',
        az: 'Sonra evdən bir uşaq çıxıb. Balaca imiş, ayaqqabıları ona böyük gəlirmiş və toplar yalnız yuvarlanır deyə bir şey bilmirmiş. Topu yerə qoyub, üç addım qaçıb və vurub.',
      },
      {
        en: 'The ball went up past the washing line. Past the window. Past the roof, where the birds were, and for two whole seconds he was one of them.',
        tr: 'Top çamaşır ipini geçmiş. Pencereyi geçmiş. Kuşların olduğu çatıyı geçmiş ve tam iki saniye boyunca onlardan biri olmuş.',
        az: 'Top paltar ipini keçib. Pəncərəni keçib. Quşların olduğu damı keçib və tam iki saniyə onlardan biri olub.',
      },
      {
        en: 'Coming down was fast and the landing hurt a little. The chair said, see, you fell. The ball said, yes. Then he asked the child to do it again.',
        tr: 'İniş hızlı olmuş ve yere çarpmak biraz canını yakmış. Sandalye, gördün mü, düştün demiş. Top, evet demiş. Sonra çocuktan bir daha yapmasını istemiş.',
        az: 'Eniş sürətli olub və yerə dəymək bir az canını yandırıb. Stul, gördün, yıxıldın deyib. Top, bəli deyib. Sonra uşaqdan bir daha etməsini istəyib.',
      },
      {
        en: 'They did it forty one times before dinner. The ball never learned to fly. But he learned that someone else running at him was the closest thing to it, and that was enough.',
        tr: 'Akşam yemeğine kadar kırk bir kere yapmışlar. Top uçmayı hiç öğrenememiş. Ama birinin ona doğru koşmasının uçmaya en yakın şey olduğunu öğrenmiş ve bu ona yetmiş.',
        az: 'Şam yeməyinə qədər qırx bir dəfə ediblər. Top uçmağı heç öyrənməyib. Amma kiminsə ona tərəf qaçmasının uçmağa ən yaxın şey olduğunu öyrənib və bu ona bəs edib.',
      },
    ],
    closer: {
      en: 'Now go and find something you can kick or throw. See how high you can get it.',
      tr: 'Şimdi git ve vurabileceğin ya da atabileceğin bir şey bul. Ne kadar yükseğe çıkarabildiğine bak.',
      az: 'İndi get və vura və ya ata biləcəyin bir şey tap. Nə qədər yuxarı qaldıra bildiyinə bax.',
    },
  },
  {
    id: 'story-sea-library',
    emoji: '🐙',
    minutes: 5,
    ageBands: ['6-9', '10-13'],
    interests: ['books', 'nature'],
    title: {
      en: 'The library at the bottom of the sea',
      tr: 'Denizin dibindeki kütüphane',
      az: 'Dənizin dibindəki kitabxana',
    },
    pages: [
      {
        en: 'Far below where the light stops, an octopus kept a library. She had eight arms and she used every one of them, because down there books do not stay on shelves. They float.',
        tr: 'Işığın bittiği yerin çok altında bir ahtapot kütüphane işletirmiş. Sekiz kolu varmış ve hepsini kullanırmış, çünkü orada kitaplar rafta durmaz. Yüzerler.',
        az: 'İşığın bitdiyi yerdən çox aşağıda bir axtapot kitabxana saxlayırmış. Səkkiz qolu varmış və hamısını işlədirmiş, çünki orada kitablar rəfdə durmur. Üzürlər.',
      },
      {
        en: 'Fish came from everywhere to borrow them. A crab took one about castles. A whale took eleven at once, which the octopus allowed because whales read slowly.',
        tr: 'Her yerden balıklar kitap almaya gelirmiş. Bir yengeç kalelerle ilgili bir tane almış. Bir balina bir seferde on bir tane almış, ahtapot buna izin vermiş çünkü balinalar yavaş okur.',
        az: 'Hər yerdən balıqlar kitab götürməyə gəlirmiş. Bir xərçəng qalalar haqqında bir dənə götürüb. Bir balina bir dəfəyə on bir dənə götürüb, axtapot buna icazə verib, çünki balinalar yavaş oxuyur.',
      },
      {
        en: 'One book nobody ever borrowed. It was thin and grey and it had no title on the front. It just drifted in the corner, waiting.',
        tr: 'Bir kitabı hiç kimse almazmış. İnce ve griymiş, kapağında adı yazmazmış. Köşede öylece süzülür, beklermiş.',
        az: 'Bir kitabı heç kim götürmürmüş. Nazik və boz imiş, üzərində adı yazılmayıbmış. Küncdə eləcə üzür, gözləyirmiş.',
      },
      {
        en: 'A very small fish asked about it. That one, said the octopus, is empty. Every page is blank. Nobody wants a book with nothing in it.',
        tr: 'Çok küçük bir balık onu sormuş. O mu, demiş ahtapot, o boş. Bütün sayfaları bomboş. Kimse içinde bir şey olmayan kitap istemez.',
        az: 'Çox balaca bir balıq onu soruşub. O mu, deyib axtapot, o boşdur. Bütün səhifələri bomboşdur. Heç kim içində bir şey olmayan kitab istəmir.',
      },
      {
        en: 'The small fish took it anyway. She brought it back a week later and it was full. Full of a story about a small fish who found an empty book at the bottom of the sea.',
        tr: 'Küçük balık yine de almış. Bir hafta sonra geri getirmiş ve kitap doluymuş. Denizin dibinde boş bir kitap bulan küçük bir balığın hikâyesiyle doluymuş.',
        az: 'Balaca balıq yenə də götürüb. Bir həftə sonra geri gətirib və kitab dolu imiş. Dənizin dibində boş kitab tapan balaca bir balığın hekayəsi ilə dolu imiş.',
      },
      {
        en: 'The octopus put it on the front shelf. After that, every book in the library had one blank page at the end, and that turned out to be the page everyone read first.',
        tr: 'Ahtapot onu en öndeki rafa koymuş. O günden sonra kütüphanedeki her kitabın sonunda boş bir sayfa varmış ve herkesin ilk okuduğu sayfa o olmuş.',
        az: 'Axtapot onu ən öndəki rəfə qoyub. O gündən sonra kitabxanadakı hər kitabın sonunda boş bir səhifə varmış və hamının ilk oxuduğu səhifə o olub.',
      },
    ],
    closer: {
      en: 'Find a piece of paper and write or draw the first page of your own book.',
      tr: 'Bir kağıt bul ve kendi kitabının ilk sayfasını yaz ya da çiz.',
      az: 'Bir kağız tap və öz kitabının ilk səhifəsini yaz və ya çək.',
    },
  },
  {
    id: 'story-comet',
    emoji: '☄️',
    minutes: 4,
    ageBands: ['6-9', '10-13'],
    interests: ['space', 'science'],
    title: {
      en: 'The comet who was late',
      tr: 'Geç kalan kuyruklu yıldız',
      az: 'Gecikən quyruqlu ulduz',
    },
    pages: [
      {
        en: 'A comet passed the Earth once every seventy five years. She was never early and never late. People wrote the date down and their grandchildren waited for it.',
        tr: 'Bir kuyruklu yıldız yetmiş beş yılda bir Dünya\'nın yanından geçermiş. Ne erken gelirmiş ne geç. İnsanlar tarihi yazar, torunları o günü beklermiş.',
        az: 'Bir quyruqlu ulduz yetmiş beş ildə bir dəfə Yerin yanından keçirmiş. Nə tez gəlirmiş, nə gec. İnsanlar tarixi yazar, nəvələri o günü gözləyərmiş.',
      },
      {
        en: 'On her ninth trip she saw something new. A small blue planet had lights on the dark side. Little orange dots in lines and curls, all over it.',
        tr: 'Dokuzuncu turunda yeni bir şey görmüş. Küçük mavi bir gezegenin karanlık tarafında ışıklar varmış. Her yerinde sıra sıra, kıvrım kıvrım turuncu noktalar.',
        az: 'Doqquzuncu turunda yeni bir şey görüb. Balaca mavi planetin qaranlıq tərəfində işıqlar varmış. Hər yerində sıra-sıra, qıvrım-qıvrım narıncı nöqtələr.',
      },
      {
        en: 'She slowed down to look. Just a little. Just enough to see that the dots were cities, and that the cities were full of people looking up at her.',
        tr: 'Bakmak için yavaşlamış. Birazcık. Sadece noktaların şehirler olduğunu ve şehirlerin ona yukarı bakan insanlarla dolu olduğunu görecek kadar.',
        az: 'Baxmaq üçün yavaşlayıb. Bir azca. Yalnız nöqtələrin şəhərlər olduğunu və şəhərlərin ona yuxarı baxan insanlarla dolu olduğunu görəcək qədər.',
      },
      {
        en: 'Because she slowed down, she arrived four days late. On Earth the astronomers panicked. They checked their sums nine times and could not find the mistake.',
        tr: 'Yavaşladığı için dört gün geç varmış. Dünya\'da gök bilimciler paniklemiş. Hesaplarını dokuz kez kontrol etmişler ve hatayı bulamamışlar.',
        az: 'Yavaşladığı üçün dörd gün gec çatıb. Yerdə astronomlar həyəcanlanıb. Hesablarını doqquz dəfə yoxlayıblar və səhvi tapa bilməyiblər.',
      },
      {
        en: 'A girl in a garden was the only one who was not worried. She said, maybe she stopped to look at us. Everyone told her that is not how comets work.',
        tr: 'Bahçedeki bir kız endişelenmeyen tek kişiymiş. Belki bize bakmak için durmuştur, demiş. Herkes ona kuyruklu yıldızlar öyle çalışmaz demiş.',
        az: 'Bağçadakı bir qız narahat olmayan yeganə adam imiş. Bəlkə bizə baxmaq üçün dayanıb, deyib. Hamı ona quyruqlu ulduzlar belə işləmir deyib.',
      },
      {
        en: 'The comet is due back in fifty one years. She has decided to be four days late again, and this time somebody in a garden will be expecting her.',
        tr: 'Kuyruklu yıldız elli bir yıl sonra tekrar gelecek. Yine dört gün geç kalmaya karar vermiş ve bu sefer bahçedeki biri onu bekliyor olacak.',
        az: 'Quyruqlu ulduz əlli bir il sonra yenə gələcək. Yenə dörd gün gecikməyə qərar verib və bu dəfə bağçadakı biri onu gözləyəcək.',
      },
    ],
    closer: {
      en: 'Tonight, go outside with a grown up and look up for one whole minute.',
      tr: 'Bu akşam bir büyükle dışarı çık ve tam bir dakika yukarı bak.',
      az: 'Bu axşam böyüklə çölə çıx və tam bir dəqiqə yuxarı bax.',
    },
  },
  {
    id: 'story-brush',
    emoji: '🖌️',
    minutes: 4,
    ageBands: ['3-5', '6-9'],
    interests: ['drawing', 'music'],
    title: {
      en: 'The brush with no colours',
      tr: 'Rengi olmayan fırça',
      az: 'Rəngi olmayan fırça',
    },
    pages: [
      {
        en: 'In a jar on a windowsill stood a paintbrush. All her friends had colour on them. Red, green, a blue one who never stopped talking about the sky.',
        tr: 'Pencere kenarındaki bir kavanozda bir fırça dururmuş. Bütün arkadaşlarının üstünde renk varmış. Kırmızı, yeşil, bir de gökyüzünden bahsetmeyi hiç bırakmayan mavi.',
        az: 'Pəncərə kənarındakı bir bankada bir fırça dayanırmış. Bütün dostlarının üstündə rəng varmış. Qırmızı, yaşıl, bir də göydən danışmağı heç dayandırmayan mavi.',
      },
      {
        en: 'She had nothing. She had been washed so many times that she was just wood and white hair, and she thought that meant she was finished.',
        tr: 'Onda hiçbir şey yokmuş. O kadar çok yıkanmış ki geriye sadece tahta ve beyaz kıllar kalmış, o da işinin bittiğini sanmış.',
        az: 'Onda heç nə yox imiş. O qədər çox yuyulub ki, geridə yalnız taxta və ağ tüklər qalıb, o da işinin bitdiyini düşünüb.',
      },
      {
        en: 'One morning a hand picked her up. Not the red paint. Not the blue. The hand dipped her in water and drew a wet line across dry paper.',
        tr: 'Bir sabah bir el onu almış. Kırmızı boyayı değil. Maviyi de değil. El onu suya batırmış ve kuru kağıda ıslak bir çizgi çizmiş.',
        az: 'Bir səhər bir əl onu götürüb. Qırmızı boyanı yox. Mavini də yox. Əl onu suya batırıb və quru kağıza yaş bir xətt çəkib.',
      },
      {
        en: 'Nothing happened. Then the red brush touched the wet line, and the red ran along it all by itself, into a shape nobody had planned.',
        tr: 'Hiçbir şey olmamış. Sonra kırmızı fırça ıslak çizgiye değmiş ve kırmızı kendi kendine çizginin boyunca akmış, kimsenin planlamadığı bir şekle dönüşmüş.',
        az: 'Heç nə olmayıb. Sonra qırmızı fırça yaş xəttə toxunub və qırmızı öz-özünə xətt boyu axıb, heç kimin planlaşdırmadığı bir formaya çevrilib.',
      },
      {
        en: 'It was the best thing anyone in that jar had ever made. And the brush with no colours had made the part that mattered, the part that let everything else move.',
        tr: 'O kavanozdaki hiç kimsenin yapamadığı kadar güzel olmuş. Rengi olmayan fırça en önemli kısmı yapmış, diğer her şeyin hareket etmesini sağlayan kısmı.',
        az: 'O bankadakı heç kimin edə bilmədiyi qədər gözəl olub. Rəngi olmayan fırça ən vacib hissəni edib, digər hər şeyin hərəkət etməsini təmin edən hissəni.',
      },
    ],
    closer: {
      en: 'Get some paper and a bit of water. Make a wet line first, then add the colour.',
      tr: 'Biraz kağıt ve biraz su al. Önce ıslak bir çizgi yap, sonra rengi ekle.',
      az: 'Bir az kağız və bir az su götür. Əvvəlcə yaş bir xətt çək, sonra rəngi əlavə et.',
    },
  },
  {
    id: 'story-seed',
    emoji: '🌱',
    minutes: 4,
    ageBands: ['3-5', '6-9', '10-13'],
    interests: ['nature', 'animals', 'science'],
    title: {
      en: 'The seed that slept too long',
      tr: 'Çok uyuyan tohum',
      az: 'Çox yatan toxum',
    },
    pages: [
      {
        en: 'Under a pavement, in the dark, a seed was asleep. Above her the world went on for years. Feet, rain, a dropped ice cream, more feet.',
        tr: 'Bir kaldırımın altında, karanlıkta bir tohum uyuyormuş. Üstünde dünya yıllarca dönmüş. Ayaklar, yağmur, düşen bir dondurma, yine ayaklar.',
        az: 'Bir səkinin altında, qaranlıqda bir toxum yatırmış. Üstündə dünya illərlə dönüb. Ayaqlar, yağış, yerə düşən dondurma, yenə ayaqlar.',
      },
      {
        en: 'She was not lazy. She was waiting for one thing: a crack. Without a crack there is no way up, and a seed only gets one try.',
        tr: 'Tembel değilmiş. Tek bir şeyi bekliyormuş: bir çatlak. Çatlak olmadan yukarı çıkılmaz ve bir tohumun tek bir şansı vardır.',
        az: 'Tənbəl deyilmiş. Tək bir şeyi gözləyirmiş: bir çat. Çat olmadan yuxarı qalxmaq olmur və toxumun yalnız bir şansı olur.',
      },
      {
        en: 'One winter the water in the ground froze, and ice pushes harder than anything. In the spring there was a line in the pavement as thin as a hair.',
        tr: 'Bir kış topraktaki su donmuş ve buz her şeyden daha güçlü iter. İlkbaharda kaldırımda kıl kadar ince bir çizgi belirmiş.',
        az: 'Bir qış torpaqdakı su donub və buz hər şeydən güclü itələyir. Yazda səkidə tük qədər nazik bir xətt yaranıb.',
      },
      {
        en: 'That was all she needed. She pushed. It took eleven days to get through a piece of stone thinner than your finger.',
        tr: 'Ona bu kadarı yetmiş. İtmiş. Parmağından daha ince bir taşı geçmesi on bir gün sürmüş.',
        az: 'Ona bu qədəri bəs edib. İtələyib. Barmağından nazik bir daşı keçməsi on bir gün çəkib.',
      },
      {
        en: 'People walked past a small green thing in the middle of the path and almost nobody looked down. But it was there, and it had moved a street to get there.',
        tr: 'İnsanlar yolun ortasındaki küçük yeşil şeyin yanından geçmiş ve neredeyse kimse aşağı bakmamış. Ama o oradaymış ve oraya varmak için bir sokağı kaldırmış.',
        az: 'İnsanlar yolun ortasındakı balaca yaşıl şeyin yanından keçib və demək olar heç kim aşağı baxmayıb. Amma o orada imiş və oraya çatmaq üçün bir küçəni qaldırıb.',
      },
    ],
    closer: {
      en: 'Go and find one plant growing where nobody planted it. There is always one.',
      tr: 'Git ve kimsenin ekmediği bir yerde büyüyen bir bitki bul. Her zaman bir tane vardır.',
      az: 'Get və heç kimin əkmədiyi yerdə bitən bir bitki tap. Həmişə bir dənə olur.',
    },
  },
  {
    id: 'story-kitchen',
    emoji: '🥄',
    minutes: 4,
    ageBands: ['3-5', '6-9'],
    interests: ['cooking', 'music', 'building'],
    title: {
      en: 'The kitchen orchestra',
      tr: 'Mutfak orkestrası',
      az: 'Mətbəx orkestri',
    },
    pages: [
      {
        en: 'Every night when the kitchen light went off, the pots came down off their hooks. The big one was the drum. The small ones argued about who was louder.',
        tr: 'Her gece mutfağın ışığı sönünce tencereler çengellerinden inermiş. Büyük olan davulmuş. Küçükler kimin daha gürültülü olduğunu tartışırmış.',
        az: 'Hər gecə mətbəxin işığı sönəndə qazanlar qarmaqlarından enərmiş. Böyüyü təbil imiş. Kiçiklər kimin daha səsli olduğunu mübahisə edərmiş.',
      },
      {
        en: 'The wooden spoon was the conductor. He was not the loudest thing in the room and that is exactly why he got the job.',
        tr: 'Tahta kaşık şefmiş. Odadaki en gürültülü şey değilmiş ve işi tam da bu yüzden almış.',
        az: 'Taxta qaşıq dirijor imiş. Otaqdakı ən səsli şey deyilmiş və işi məhz buna görə alıb.',
      },
      {
        en: 'One night the smallest teaspoon wanted to play. Everyone laughed. You cannot even be heard, said the frying pan, who was very sure of himself.',
        tr: 'Bir gece en küçük çay kaşığı çalmak istemiş. Herkes gülmüş. Sesin bile duyulmuyor, demiş kendinden çok emin olan tava.',
        az: 'Bir gecə ən balaca çay qaşığı çalmaq istəyib. Hamı gülüb. Səsin belə eşidilmir, deyib özündən çox əmin olan tava.',
      },
      {
        en: 'The spoon put the teaspoon at the front anyway. Then he made everyone else stop. In the silence, one tiny ting went all the way across the room.',
        tr: 'Kaşık yine de çay kaşığını en öne koymuş. Sonra herkesi susturmuş. Sessizlikte, küçücük bir tın sesi odanın öbür ucuna kadar gitmiş.',
        az: 'Qaşıq yenə də çay qaşığını ən önə qoyub. Sonra hamını susdurub. Sükutda, kiçicik bir cingilti otağın o biri ucuna qədər gedib.',
      },
      {
        en: 'It was the best sound any of them had ever made. Turns out the trick was never being loud. The trick was everyone else knowing when to stop.',
        tr: 'Hiçbirinin çıkaramadığı kadar güzel bir sesmiş. Meğer marifet gürültü yapmak değilmiş. Marifet, diğerlerinin ne zaman susacağını bilmesiymiş.',
        az: 'Heç birinin çıxara bilmədiyi qədər gözəl bir səs imiş. Demə ustalıq səs-küy salmaq deyilmiş. Ustalıq digərlərinin nə vaxt susacağını bilməsi imiş.',
      },
    ],
    closer: {
      en: 'Go to the kitchen with a grown up and find the quietest sound you can make.',
      tr: 'Bir büyükle mutfağa git ve çıkarabileceğin en sessiz sesi bul.',
      az: 'Böyüklə mətbəxə get və çıxara biləcəyin ən sakit səsi tap.',
    },
  },
];

export const storyById = new Map(storyLibrary.map((story) => [story.id, story]));

/** Stories that fit the child, best match first, ones they have not heard first. */
export function rankStories(
  ageBand: AgeBand,
  interests: InterestId[],
  heard: string[],
): Story[] {
  return storyLibrary
    .filter((story) => story.ageBands.includes(ageBand))
    .map((story) => ({
      story,
      score:
        story.interests.filter((i) => interests.includes(i)).length * 2 +
        (heard.includes(story.id) ? -5 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.story);
}
