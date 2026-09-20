import type { Copy } from './en';

export const tr: Copy = {
  common: {
    appName: 'ScreenLess Ebeveyn',
    cancel: 'Vazgeç',
    saved: 'Kaydedildi',
    back: 'Geri',
    loading: 'Bir saniye',
    delete: 'Sil',
    remove: 'Kaldır',
    noData: 'Henüz veri yok',
    minutesShort: '{{count}} dk',
  },

  error: {
    unconfigured: 'Bu sürümde sunucu adresi yok, giriş yapılamaz.',
    network: 'Sunucuya ulaşılamadı. Bağlantıyı kontrol edip tekrar deneyin.',
    timeout: 'Sunucu çok uzun sürdü. Tekrar deneyin.',
    unauthorized: 'E-posta ve şifre eşleşmiyor.',
    taken: 'Bu adresle zaten bir hesap var.',
    invalid: 'Formdaki bir şey kabul edilmedi.',
    notFound: 'Bu artık orada değil.',
    full: 'Bir hesapta tutulabilecek çocuk sayısı doldu.',
    rateLimited: 'Çok fazla deneme. Bir dakika bekleyin.',
    server: 'Sunucuda bir sorun oldu. Az sonra tekrar deneyin.',
    shortPassword: 'En az on karakter.',
    badEmail: 'Bu bir e-posta adresine benzemiyor.',
  },

  auth: {
    title: 'ScreenLess',
    subtitle: 'Çocuklarınızın nasıl gittiğini görün, günlük sınırı buradan ayarlayın.',
    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    passwordHint: 'En az on karakter. Uzunluk, noktalama işaretlerinden iyidir.',
    nameLabel: 'Adınız',
    nameHint: 'İsteğe bağlı. Yalnızca siz görürsünüz.',
    signIn: 'Giriş yap',
    signingIn: 'Giriş yapılıyor',
    register: 'Hesap oluştur',
    registering: 'Oluşturuluyor',
    toRegister: 'Hesabınız yok mu? Oluşturun',
    toSignIn: 'Hesabınız var mı? Giriş yapın',
    privacy:
      'Çocuklarınızın telefonları yalnızca sayı gönderir. İsimler, fotoğraflar, mesajlar ve yazdıkları her şey kendi cihazlarında kalır.',
  },

  children: {
    title: 'Çocuklar',
    add: 'Çocuk ekle',
    emptyTitle: 'Henüz çocuk yok',
    emptyBody: 'Buradan ekleyin, sonra verdiği kodu onun telefonundaki ScreenLess’e yazın.',

    addTitle: 'Çocuk ekle',
    nameLabel: 'Ad',
    nameHint: 'Yalnızca siz görürsünüz. Telefonuna hiç gönderilmez.',
    ageLabel: 'Yaş',
    age35: '3 ile 5',
    age69: '6 ile 9',
    age1013: '10 ile 13',
    create: 'Ekle',
    creating: 'Ekleniyor',

    pairTitle: '{{name}} telefonunu bağla',
    pairBody:
      'Onun telefonunda ScreenLess’i açın, ebeveyn bölümüne gidin ve Ebeveyn paneli’ni seçin. Bu kodu oraya yazın.',
    pairExpires: 'Kod yarım saat geçerli.',
    newCode: 'Yeni kod',
    pairDone: 'Tamam',

    notPaired: 'Telefonu bekleniyor',
    notPairedBody: 'Kod yazılana kadar hiçbir şey gelmez.',
    lastSeen: 'Son bildirim {{when}}',
    neverReported: 'Henüz bir şey bildirilmedi',
    levelStreak: 'Seviye {{level}} · {{streak}} günlük seri',
    noStreak: 'Seviye {{level}}',
    todayScreen: 'Bugün ekranda {{time}}',
    todayMissions: 'Bugün {{count}} görev',

    removeTitle: '{{name}} kaldırılsın mı?',
    removeBody:
      'Buradaki geçmişi silinir ve telefonu bildirim göndermeyi bırakır. Telefonun kendisinde hiçbir şey değişmez.',
  },

  dash: {
    week: 'Hafta',
    month: 'Ay',
    quarter: '3 ay',

    screenTime: 'Ekran süresi',
    screenTimePerDay: 'günde',
    missions: 'Görev',
    active: 'Hareket',
    steps: 'Adım',
    balance: 'Ekran dışı pay',
    balanceBody: 'Hareket dakikalarının ekran dakikalarına oranı.',
    streak: 'Seri',
    streakDays: '{{count}} gün',

    up: '%{{percent}} arttı',
    down: '%{{percent}} azaldı',
    flat: 'yaklaşık aynı',
    vsPrevious: 'önceki {{days}} güne göre',
    noCompare: 'Karşılaştırılacak önceki dönem yok',

    reportedDays: '{{total}} günün {{reported}} tanesinden',
    reportedOne: 'Bir günden',
    gapNote: 'Telefonun bildirmediği günler sıfır sayılmaz, boş bırakılır.',

    dailyTitle: 'Gün gün',
    dailyLegendScreen: 'Ekran',
    dailyLegendActive: 'Hareket',
    dailyLegendMissions: 'Görev',
    dailyLegendOver: 'Sınırın üstünde',

    weekdayTitle: 'Haftanın günlerine göre',
    weekdayBody: 'Çoğu ailede sorunun tamamını bir iki gün taşır.',
    weekdayHeaviest: 'En ağır gün {{day}}, ortalama {{time}}.',

    categoryTitle: 'Neyi seçti',
    categoryBody: 'Türüne göre biten görevler.',
    catMove: 'Hareket',
    catOutdoor: 'Dışarıda',
    catCreate: 'Yapma',
    catSocial: 'İnsanlarla',
    catCalm: 'Sakin',

    remindersTitle: 'Hatırlatmalar',
    remindersBody: '{{shown}} gösterildi, {{heeded}} tanesinden sonra göreve başladı.',
    remindersRate: '%{{percent}} bir yere vardı',
    remindersNone: 'Bu dönemde hiç hatırlatma çıkmadı.',

    limitTitle: 'Sınır',
    limitOff: 'Sınır yok',
    limitSet: 'Günde {{time}}, {{tier}}',
    overLimitDays: '{{reported}} günün {{count}} tanesinde aşıldı',
    withinLimit: 'Her gün sınırın içinde',
    editLimit: 'Sınırı değiştir',

    bestTitle: 'En iyi günler',
    bestMissions: '{{date}} günü {{count}} görev',
    bestSteps: '{{date}} günü {{count}} adım',

    emptyTitle: 'Burada henüz bir şey yok',
    emptyBody: 'Telefonu bir günü bildirdiğinde grafikler dolar.',
  },

  send: {
    title: 'Bir şey gönder',
    open: 'Bir şey gönder',
    delay: 'Buradan gönderdiğin her şey, uygulamayı bir sonraki açışlarında ulaşır; hemen değil.',

    noteLabel: 'Bir not',
    notePlaceholder: 'Babaanne beşte geliyor',
    noteHint: 'Tek satır. Yazarak değil, bir düğmeyle cevap veriyorlar.',
    noteSend: 'Notu gönder',
    noteWaiting: 'Okumaları bekleniyor',
    replyOk: 'Tamam dedi',
    replyDone: 'Yaptım dedi',
    replyThanks: 'Teşekkürler dedi',
    replyLater: 'Şimdi değil dedi',

    rewardLabel: 'Bir ödül sözü ver',
    rewardPlaceholder: 'Cumartesi sinema',
    rewardStars: 'Gereken yıldız',
    rewardAdd: 'Söz ver',
    rewardGiven: 'Verildi',
    rewardMarkGiven: 'Verildi olarak işaretle',
    rewardNone: 'Henüz söz verilmiş bir şey yok.',
    rewardFull: 'Bir çocuk aynı anda bundan fazlasını tutamaz. Yer açmak için birini silin.',

    missionLabel: 'Bir görev seç',
    missionSearch: 'Görevlerde ara',
    missionWaiting: 'Telefonlarında bekliyor',
    missionTaken: 'Listesine ekledi',
    missionClear: 'Geri al',
    missionDuo: 'Senin de odada olman gerek',
  },
  limits: {
    title: 'Günlük sınır',
    subtitle: 'Buradan ayarlayın, uygulama bir sonraki açılışında telefonuna ulaşır.',

    enabledLabel: 'Sınır açık',
    enabledOff: 'Hiçbir şey sınıra sayılmaz ve hiçbir şey engellenmez.',

    budgetLabel: 'Günde dakika',
    budgetBody: 'Bir yetişkinin onun telefonunda seçtiği uygulamaların toplamı, tek tek değil.',

    tierLabel: 'Sınıra gelince ne olsun',
    tierOff: 'Hiçbir şey',
    tierNotice: 'Sadece uyar',
    tierInterrupt: 'Kapat, geri dönüş olsun',
    tierBlock: 'Yarına kadar kapat',
    tierOffBody: 'Süre yine sayılır. Hiçbir şey kapatılmaz.',
    tierNoticeBody: 'Dörtte üçte ve sınırda birer bildirim.',
    tierInterruptBody:
      'Sınırdan sonra uygulama kapatılır. Günde birkaç kez, birkaç dakika daha alabilir.',
    tierBlockBody: 'Sınırdan sonra siz kaldırana ya da yarın olana kadar kapalı kalır.',

    nudgeLabel: 'Hatırlatma aralığı',
    nudgeOff: 'Kapalı',
    nudgeBody:
      'O uygulamalar açıkken sessiz bir bildirim ve yerine yapılacak bir şey. Yaşına göre yazılmış. Sınır olsa da olmasa da çalışır.',

    curfewLabel: 'Sessiz saatler',
    curfewNone: 'Yok',
    curfewBody: 'Bu aralıkta, süreden ne kalmış olursa olsun her zaman uygulanır.',
    curfewFrom: 'Başlangıç',
    curfewTo: 'Bitiş',

    appsNote:
      'Hangi uygulamaların izleneceği, çocuğun kendi telefonunda, orada kurulu uygulamalar arasından seçilir. Buradan ayarlanamaz.',

    saveChanges: 'Kaydet',
    savingChanges: 'Kaydediliyor',
  },

  settings: {
    title: 'Ayarlar',
    account: 'Hesap',
    languageLabel: 'Dil',
    signOut: 'Çıkış yap',
    signOutTitle: 'Çıkış yapılsın mı?',
    signOutBody: 'Çocuklarınızın telefonları bildirmeye devam eder. Siz sadece burada görmeyi bırakırsınız.',

    deleteTitle: 'Bu hesabı sil',
    deleteBody:
      'Her çocuk, geçmişin her günü ve her sınır silinir. Telefonları bildirmeyi bırakır. Telefonların kendisine dokunulmaz.',
    deleteConfirm: 'Onaylamak için şifrenizi yazın',
    deleteAction: 'Her şeyi sil',

    aboutTitle: 'Bu uygulama neyi görebilir',
    aboutBody:
      'Ekran süresi dakikaları, biten görevler, yıldızlar, adımlar ve kaç hatırlatma gösterildiği. Listenin tamamı bu. İsimler, fotoğraflar, mesajlar, çizimler ve bir çocuğun yazdığı hiçbir şey telefonundan çıkmaz; sunucuda bunlar için yer de yok.',
  },
};
