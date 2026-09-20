import type { Copy } from './en';

export const az: Copy = {
  common: {
    appName: 'ScreenLess Valideyn',
    continue: 'Davam',
    cancel: 'İmtina',
    save: 'Yadda saxla',
    saved: 'Yadda saxlanıldı',
    back: 'Geri',
    retry: 'Yenidən cəhd et',
    loading: 'Bir saniyə',
    close: 'Bağla',
    delete: 'Sil',
    remove: 'Çıxar',
    done: 'Hazırdır',
    today: 'Bu gün',
    noData: 'Hələ məlumat yoxdur',
    hoursMinutes: '{{hours}}s {{minutes}}dəq',
    minutesOnly: '{{minutes}}dəq',
    minutesShort: '{{count}} dəq',
  },

  error: {
    unconfigured: 'Bu buraxılışda server ünvanı yoxdur, giriş mümkün deyil.',
    network: 'Serverə çatmaq olmadı. Bağlantını yoxlayıb yenidən cəhd edin.',
    timeout: 'Server çox uzun çəkdi. Yenidən cəhd edin.',
    unauthorized: 'E-poçt və şifrə uyğun gəlmir.',
    taken: 'Bu ünvanla artıq hesab var.',
    invalid: 'Formadakı nəsə qəbul edilmədi.',
    notFound: 'Bu artıq orada deyil.',
    full: 'Bir hesabda saxlanıla bilən uşaq sayı doldu.',
    rateLimited: 'Çox cəhd edildi. Bir dəqiqə gözləyin.',
    server: 'Serverdə problem oldu. Bir az sonra yenidən cəhd edin.',
    shortPassword: 'Ən azı on simvol.',
    badEmail: 'Bu e-poçt ünvanına oxşamır.',
  },

  auth: {
    title: 'ScreenLess',
    subtitle: 'Uşaqlarınızın necə getdiyini görün, günlük limiti buradan təyin edin.',
    emailLabel: 'E-poçt',
    passwordLabel: 'Şifrə',
    passwordHint: 'Ən azı on simvol. Uzunluq durğu işarələrindən yaxşıdır.',
    nameLabel: 'Adınız',
    nameHint: 'İstəyə bağlı. Yalnız siz görürsünüz.',
    signIn: 'Daxil ol',
    signingIn: 'Daxil olunur',
    register: 'Hesab yarat',
    registering: 'Yaradılır',
    toRegister: 'Hesabınız yoxdur? Yaradın',
    toSignIn: 'Hesabınız var? Daxil olun',
    privacy:
      'Uşaqlarınızın telefonları yalnız rəqəm göndərir. Adlar, şəkillər, mesajlar və yazdıqları hər şey öz cihazlarında qalır.',
  },

  children: {
    title: 'Uşaqlar',
    add: 'Uşaq əlavə et',
    emptyTitle: 'Hələ uşaq yoxdur',
    emptyBody: 'Buradan əlavə edin, sonra verdiyi kodu onun telefonundakı ScreenLess-ə yazın.',

    addTitle: 'Uşaq əlavə et',
    nameLabel: 'Ad',
    nameHint: 'Yalnız siz görürsünüz. Telefonuna heç vaxt göndərilmir.',
    ageLabel: 'Yaş',
    age35: '3 ilə 5',
    age69: '6 ilə 9',
    age1013: '10 ilə 13',
    create: 'Əlavə et',
    creating: 'Əlavə edilir',

    pairTitle: '{{name}} telefonunu bağla',
    pairBody:
      'Onun telefonunda ScreenLess-i açın, valideyn bölməsinə keçin və Valideyn panelini seçin. Bu kodu ora yazın.',
    pairExpires: 'Kod yarım saat etibarlıdır.',
    newCode: 'Yeni kod',
    pairDone: 'Hazırdır',

    notPaired: 'Telefonu gözlənilir',
    notPairedBody: 'Kod yazılana qədər heç nə gəlmir.',
    lastSeen: 'Son məlumat {{when}}',
    neverReported: 'Hələ heç nə göndərilməyib',
    levelStreak: 'Səviyyə {{level}} · {{streak}} günlük seriya',
    noStreak: 'Səviyyə {{level}}',
    todayScreen: 'Bu gün ekranda {{time}}',
    todayMissions: 'Bu gün {{count}} tapşırıq',

    removeTitle: '{{name}} çıxarılsın?',
    removeBody:
      'Buradakı tarixçəsi silinir və telefonu məlumat göndərməyi dayandırır. Telefonun özündə heç nə dəyişmir.',
  },

  dash: {
    week: 'Həftə',
    month: 'Ay',
    quarter: '3 ay',

    screenTime: 'Ekran vaxtı',
    screenTimePerDay: 'gündə',
    missions: 'Tapşırıq',
    active: 'Hərəkət',
    steps: 'Addım',
    balance: 'Ekrandan kənar pay',
    balanceBody: 'Hərəkət dəqiqələrinin ekran dəqiqələrinə nisbəti.',
    streak: 'Seriya',
    streakDays: '{{count}} gün',

    up: '{{percent}}% artdı',
    down: '{{percent}}% azaldı',
    flat: 'təxminən eyni',
    vsPrevious: 'əvvəlki {{days}} günə nisbətən',
    noCompare: 'Müqayisə üçün əvvəlki dövr yoxdur',

    reportedDays: '{{total}} günün {{reported}} günündən',
    reportedOne: 'Bir gündən',
    gapNote: 'Telefonun bildirmədiyi günlər sıfır sayılmır, boş qalır.',

    dailyTitle: 'Gün-gün',
    dailyLegendScreen: 'Ekran',
    dailyLegendActive: 'Hərəkət',
    dailyLegendMissions: 'Tapşırıq',
    dailyLegendOver: 'Limitdən yuxarı',

    weekdayTitle: 'Həftənin günlərinə görə',
    weekdayBody: 'Əksər ailələrdə problemin hamısını bir-iki gün daşıyır.',
    weekdayHeaviest: 'Ən ağır gün {{day}}, orta hesabla {{time}}.',

    categoryTitle: 'Nəyi seçdi',
    categoryBody: 'Növünə görə bitmiş tapşırıqlar.',
    catMove: 'Hərəkət',
    catOutdoor: 'Çöldə',
    catCreate: 'Düzəltmə',
    catSocial: 'İnsanlarla',
    catCalm: 'Sakit',

    remindersTitle: 'Xatırlatmalar',
    remindersBody: '{{shown}} göstərildi, {{heeded}} dənəsindən sonra tapşırığa başladı.',
    remindersRate: '{{percent}}% bir yerə çatdı',
    remindersNone: 'Bu dövrdə heç bir xatırlatma çıxmayıb.',

    limitTitle: 'Limit',
    limitOff: 'Limit yoxdur',
    limitSet: 'Gündə {{time}}, {{tier}}',
    overLimitDays: '{{reported}} günün {{count}} günündə aşılıb',
    withinLimit: 'Hər gün limitin içində',
    editLimit: 'Limiti dəyiş',

    bestTitle: 'Ən yaxşı günlər',
    bestMissions: '{{date}} günü {{count}} tapşırıq',
    bestSteps: '{{date}} günü {{count}} addım',

    emptyTitle: 'Burada hələ heç nə yoxdur',
    emptyBody: 'Telefonu bir günü bildirəndə qrafiklər dolur.',
  },

  send: {
    title: 'Nəsə göndər',
    open: 'Nəsə göndər',
    delay: 'Buradan göndərdiyin hər şey tətbiqi növbəti dəfə açanda çatır, dərhal yox.',

    noteLabel: 'Bir qeyd',
    notePlaceholder: 'Nənə beşdə gəlir',
    noteHint: 'Bir sətir. Yazaraq yox, düymə ilə cavab verirlər.',
    noteSend: 'Qeydi göndər',
    noteSent: 'Göndərildi',
    noteWaiting: 'Oxumaları gözlənilir',
    replyOk: 'Oldu dedi',
    replyDone: 'Etdim dedi',
    replyThanks: 'Təşəkkür dedi',
    replyLater: 'İndi yox dedi',

    rewardLabel: 'Mükafat vəd et',
    rewardPlaceholder: 'Şənbə kinoteatr',
    rewardStars: 'Lazım olan ulduz',
    rewardAdd: 'Vəd et',
    rewardGiven: 'Verildi',
    rewardMarkGiven: 'Verildi kimi işarələ',
    rewardNone: 'Hələ vəd edilən bir şey yoxdur.',
    rewardFull: 'Bir uşaq eyni anda bundan çoxunu saxlaya bilməz.',

    missionLabel: 'Tapşırıq seç',
    missionSearch: 'Tapşırıqlarda axtar',
    missionWaiting: 'Telefonlarında gözləyir',
    missionTaken: 'Siyahısına əlavə etdi',
    missionClear: 'Geri al',
    missionDuo: 'Sənin də otaqda olman lazımdır',
    missionNone: 'Göndərilmiş tapşırıq yoxdur.',
  },
  limits: {
    title: 'Günlük limit',
    subtitle: 'Buradan təyin edin, tətbiq növbəti dəfə açılanda telefonuna çatır.',

    enabledLabel: 'Limit açıqdır',
    enabledOff: 'Heç nə limitə sayılmır və heç nə bağlanmır.',

    budgetLabel: 'Gündə dəqiqə',
    budgetBody: 'Bir böyüyün onun telefonunda seçdiyi tətbiqlərin cəmi, ayrı-ayrı deyil.',

    tierLabel: 'Limitə çatanda nə olsun',
    tierOff: 'Heç nə',
    tierNotice: 'Yalnız xəbərdarlıq',
    tierInterrupt: 'Bağla, geri yol olsun',
    tierBlock: 'Sabaha qədər bağla',
    tierOffBody: 'Vaxt yenə sayılır. Heç nə bağlanmır.',
    tierNoticeBody: 'Dörddə üçdə və limitdə birər bildiriş.',
    tierInterruptBody:
      'Limitdən sonra tətbiq bağlanır. Gündə bir neçə dəfə, bir neçə dəqiqə əlavə ala bilər.',
    tierBlockBody: 'Limitdən sonra siz açana və ya sabah olana qədər bağlı qalır.',

    nudgeLabel: 'Xatırlatma aralığı',
    nudgeOff: 'Söndürülüb',
    nudgeBody:
      'O tətbiqlər açıq olanda səssiz bildiriş və əvəzinə ediləcək bir iş. Yaşına görə yazılıb. Limit olsa da olmasa da işləyir.',

    curfewLabel: 'Sakit saatlar',
    curfewNone: 'Yoxdur',
    curfewSet: '{{start}} - {{end}}',
    curfewBody: 'Bu aralıqda, vaxtdan nə qalmasından asılı olmayaraq həmişə tətbiq olunur.',
    curfewFrom: 'Başlanğıc',
    curfewTo: 'Son',

    appsNote:
      'Hansı tətbiqlərin izlənəcəyi uşağın öz telefonunda, orada quraşdırılmış tətbiqlər arasından seçilir. Buradan təyin edilə bilməz.',

    saveChanges: 'Yadda saxla',
    savingChanges: 'Saxlanılır',
  },

  settings: {
    title: 'Parametrlər',
    account: 'Hesab',
    languageLabel: 'Dil',
    signOut: 'Çıxış',
    signOutTitle: 'Çıxış edilsin?',
    signOutBody: 'Uşaqlarınızın telefonları məlumat göndərməyə davam edir. Siz sadəcə burada görməyi dayandırırsınız.',

    deleteTitle: 'Bu hesabı sil',
    deleteBody:
      'Hər uşaq, tarixçənin hər günü və hər limit silinir. Telefonları məlumat göndərməyi dayandırır. Telefonların özünə toxunulmur.',
    deleteConfirm: 'Təsdiq üçün şifrənizi yazın',
    deleteAction: 'Hər şeyi sil',
    deleted: 'Hesab silindi',

    aboutTitle: 'Bu tətbiq nəyi görə bilər',
    aboutBody:
      'Ekran vaxtı dəqiqələri, bitmiş tapşırıqlar, ulduzlar, addımlar və neçə xatırlatma göstərildiyi. Siyahının hamısı budur. Adlar, şəkillər, mesajlar, rəsmlər və uşağın yazdığı heç nə telefonundan çıxmır; serverdə onlar üçün yer də yoxdur.',
  },
};
