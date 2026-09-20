# Play Console: what to put in every form

Answers below describe ScreenLess as it is actually built. If you change the app,
change these. A Data safety form that does not match the app is the single most
common reason a Families app gets pulled.

---

## App content → Privacy policy

The hosted url of `store/privacy-policy.html`. Nothing else goes in this field.

## App content → App access

**All functionality is available without special access.** There is no login and no
password. The optional username for the friends board is created inside the app in a
few seconds, so a reviewer reaches every feature without credentials. Leave the
credentials fields empty.

## App content → Ads

**No, my app does not contain ads.** True: no ad SDK, no ad network, no house ads,
no sponsorships.

## App content → Content ratings (IARC questionnaire)

Category: **Utility, Productivity, Communication or Other** — pick *Education /
Reference*. Then answer:

| Question | Answer |
| --- | --- |
| Violence of any kind | No |
| Sexuality, nudity | No |
| Bad language | No |
| Controlled substances, drugs, alcohol, tobacco | No |
| Gambling, simulated gambling | No |
| Crude humour | No |
| Horror or fear themes | No |
| Digital purchases | No |
| Users can interact or exchange content | **Yes, limited.** Children whose parents exchanged invite codes see each other's username, cartoon buddy and star counts on a friends board. No chat, no messages, no photos, no search, no public profiles. Off unless a parent turns it on |
| Shares user location | No |
| Allows users to share personal information | No. The board carries a parent-chosen username and numbers. The child's name, age and location are never sent, and usernames that could be phone numbers are refused |
| Unrestricted internet access (browser) | No |

Expected outcome: PEGI 3 / ESRB Everyone / USK 0, with the users interact
descriptor.

> The interaction question is the one to read twice. It was No until the friends
> board (September 2026) and it is Yes now, because a username chosen for one child
> is shown to other children. Answering No would be the misdeclaration. What a
> reviewer looks for next is already built: the parent opts in during setup or in
> the parent area, the parent picks the username, friends can only be added with a
> code behind the parent code, and no feature lets children send each other
> anything.

## App content → Target audience and content

- **Target age groups:** 5 and under, 6–8, 9–12, **13–15**. The app's own bands are
  3–5, 6–9 and 10–13 (`AGE_BANDS` in `src/state/types.ts`), and a thirteen year old
  falls in Play's 13–15 bucket. Ticking only up to 9–12 would be a misdeclaration.
- **Appeals to children:** yes. Do not fight this — cartoon buddies, star rewards and a mission map are unambiguously child appealing, and claiming otherwise gets caught.
- Because children are in the target audience the app enters the **Families programme** and Families policy applies in full.

> **Read this with `SCREEN-GUARD.md` open.** Ticking 13–15 alongside the younger
> buckets makes this a **mixed audience** app rather than a children-only one, and
> mixed audience is exactly the footing that document's route 2 describes for
> shipping Screen Guard. The two declarations have to agree: an app declared
> children-only that ships usage access, an overlay and a foreground service is the
> combination that gets pulled. Decide the route once, then make the target
> audience, the permission declarations and the age screen all say the same thing.

## App content → Data safety

### Does your app collect or share any of the required user data types?

**Yes.** Most of what the app stores is on-device, which is not collection. Two
things leave the device: the buddy chat, the parent coach and surprise missions send
text to Google's Gemini API, and for a child whose parent chose a username the
friends board server keeps that username and the board numbers.

### Is all of the user data encrypted in transit?

**Yes.** Both outbound destinations are https, and release builds refuse any other
scheme for either one.

### Do you provide a way for users to request that their data is deleted?

**Yes.** Parent area → Settings → Delete everything wipes profile, progress,
missions, chat and reward promises, and deletes the username from the server first.
Parent area → Username and friends → Remove the username deletes only the server
side. Usernames nobody has used for a year are deleted automatically.

The username counts as an account for Play's account deletion rule, so Play also
asks for a way to request deletion outside the app. Point that field at the
privacy policy's deletion section (`#delete`), which tells a parent to email the
username and invite code to `CONTACT_EMAIL`. Delete it from the Firestore
`screenless` database by that username.

### Data types to declare

| Type | Collected | Shared | Purpose | Optional? | Ephemeral? |
| --- | --- | --- | --- | --- | --- |
| **Messages → Other in-app messages** | Yes | No | App functionality | Yes, user initiated | Yes |
| **Personal info → User IDs** | Yes | No | App functionality | Yes, the parent opts in | No |
| **App activity → Other actions** | Yes | No | App functionality | Yes, the parent opts in | No |
| **Health and fitness → Fitness info** | Yes | No | App functionality | Yes, the parent opts in | No |

Notes for the Gemini row:

- **Collected, not shared.** Google is acting as a processor for the request. Play's definition excludes transfer to a service provider processing on your behalf from "sharing".
- **Optional.** The three AI features are opt-in by use; nothing is sent unless the user types something.
- **Ephemeral.** The text is used to produce a reply in real time and is not retained by us. *Only tick this if you are on the paid Gemini tier* — see the warning below.
- The child's name is never included in these requests. Age group and interest categories are, which are not personal identifiers on their own.

Notes for the friends board rows:

- **User IDs** is the username the parent chose, and a random player id the server generates. Neither is a device identifier.
- **Other actions** is stars, missions done and the streak. **Fitness info** is one number, this week's step total. Nothing about where the steps were taken exists anywhere.
- **Not shared.** Everything goes to your own Firebase project. Friends see a username and numbers only because a parent added them with a code, which is a user initiated transfer the user expects, not sharing with a third party.
- **Optional.** Only children whose parent picked a username. Without one, the app never contacts the server at all.

### Do NOT declare

Financial info, location, photos and videos, audio, files, calendar, contacts, web
browsing, app info and performance, device or other IDs, and every personal info
type other than User IDs. None of it is collected, and specifically:

- **Photos:** the camera reads frames on device. A scan keeps only a list of object names and deletes every frame; a proof photo is deleted the moment a parent decides. Collection and tree photos are kept, in the app's own sandboxed folder, never written to the shared media store, and removed with the app or from the parent area. Nothing is ever transmitted, and Play's "collected" means data leaving the device, so nothing is collected.
- **Device or other IDs:** the advertising ID is never requested, and the Families policy bans transmitting AAID, IMEI, IMSI, MAC, SIM serial and build serial. The app transmits none of them.
- **Real rewards:** a parent's promise is a note on the phone. Not collected, not shared, no payment method involved.

### ⚠ Before you tick "ephemeral"

On the **unpaid** Gemini tier, Google's terms allow submitted prompts and
responses to be used to improve its products, with human review. That is not
ephemeral processing, and the prompts are children's messages. Link a billing
account so the key sits on the paid tier before you submit this form. See
`RELEASE.md`.

## App content → Government apps, News, Financial features, Health

No to all.

## App content → Advertising ID

**No, my app does not use advertising ID.** No ad or analytics SDK is present.

## App content → Photo and video permissions

Not applicable. `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` are explicitly blocked
in `app.json`. The camera permission is declared and used, which is a runtime
permission, not a broad media permission.

## App content → Accessibility API / other sensitive declarations

**No accessibility service.** There is none in the manifest, which is deliberate —
see `SCREEN-GUARD.md` for why usage access is used instead.

Three other declarations do apply while `extra.screenGuard` is `true`, and from
1.1.0 all three genuinely reach the shipped manifest (earlier wording here assumed
they did; the merger had been dropping one). Confirm before each submission with
the `grep` in `SCREEN-GUARD.md`:

| Permission | Where it is declared in Play Console | Text to use |
| --- | --- | --- |
| `QUERY_ALL_PACKAGES` | Policy → App content → **Permissions declaration** | The paragraph in `SCREEN-GUARD.md` |
| `FOREGROUND_SERVICE_SPECIAL_USE` | The same form, special use justification | The paragraph in `SCREEN-GUARD.md` |
| `SYSTEM_ALERT_WINDOW` | No separate form; it is a special access the parent grants in Settings. Describe it in the listing and expect a reviewer to ask what draws over other apps | It draws the cover a parent configured, over the apps a parent chose, once the daily limit they set is spent. It never covers anything else |

`PACKAGE_USAGE_STATS` is a special access with no declaration form either. A
reviewer will still look for it, so the listing should say plainly that the app
reads app usage times to enforce a parent's limit.

---

## Families programme notes

Answer these consistently with the app:

- **Ads:** none, so the Families Self-Certified Ads SDK requirement does not apply.
- **In-app purchases:** none.
- **Third party SDKs:** the app carries no analytics, no attribution, no ad SDK. Outbound calls go only to your own Firebase functions: the Gemini proxy, and the friends board for children with a username.
- **Social features:** one, the friends board, and it is off until a parent turns it on. The parent chooses the username, which the server checks against rude words in all three languages. Friends are added only by typing a six character code behind the parent code; there is no search and no public list. Friends see the username, the cartoon buddy and numbers. There is no chat, no messaging and no photo sharing, and the parent can remove any friend or the whole username at any time.
- **AI features:** disclose them plainly. Three features call a language model: a cartoon buddy chat, a parent coach and a mission generator. All three run behind a pre-send input filter, a system prompt with explicit child safety rules, `BLOCK_LOW_AND_ABOVE` safety thresholds set server side where a caller cannot relax them, and a post-reply rescan before anything reaches the child. Say this in the full description; reviewers look for it.
- **Health and fitness:** the walk screen counts steps from the raw accelerometer, which needs no permission on either platform. `ACTIVITY_RECOGNITION` and the hardware step counter behind it are deliberately unused and stay in `blockedPermissions`. The count is a number in app storage and stops the moment the screen is closed. For a child without a username it never leaves the phone; with one, this week's total goes to the friends board, which is why Fitness info is declared.
- **Camera:** justify it in the listing. It reads the room on-device to build a mission from what the child already owns, and it lets the child photograph what they find outdoors for their own collection and their own tree. Everything stays in app storage. Nothing is uploaded.
- **Anonymous chat:** the July 2026 update bans anonymous chat apps from targeting children. This is not one. The buddy is a fixed cartoon character, and the friends board has no chat of any kind and shows only children a parent added by code.

---

## Store listing

### App name

- TR `ScreenLess: Ekransız Görev`
- EN `ScreenLess: Off-Screen Play`

### Short description (max 80)

- TR `Ekran yerine yapacak bir şey. Çocuğunuza her gün yeni bir görev veren arkadaş.`
- EN `Something to do instead of the screen. A buddy that sends kids off to play.`
- AZ `Ekran əvəzinə görüləsi iş. Uşağınıza hər gün yeni tapşırıq verən dost.`

### Full description

**Turkish**

```
Çocuğunuz sıkıldığında telefonu istiyor. Yasak koymak işe yaramıyor, çünkü elinden aldığınız şeyin yerine bir şey koymuyorsunuz.

ScreenLess bunu tersine çeviriyor. Ekrandaki karakter, çocuğu ekrandan uzağa gönderiyor. Ödül de ekrandan geri geliyor.

NASIL ÇALIŞIR
Çocuğunuz kendine bir arkadaş seçer ve ona bir ad verir. Her gün o arkadaş, çocuğun yaşına ve ilgi alanlarına uygun kısa bir görev verir: on dakikalık bir hareket oyunu, mutfakta yardım, bir çizim, bahçede bir tur. Görev bitince çocuk "yaptım" der, siz onaylarsınız, arkadaş büyür.

ODA TARAMASI
Kamerayı odaya tutun. Uygulama telefonun kendi üzerinde ne olduğunu tanır (top, kitap, yastık, kalem) ve o eşyalarla yapılabilecek bir görev kurar. Görüntü telefondan çıkmaz, hiçbir yere yüklenmez, taramadan geriye yalnızca nesne adları kalır.

GERÇEK ÖDÜLLER
Siz karar verirsiniz: 100 yıldızda dondurma, 150 yıldızda oyuncak. Sözü ebeveyn alanına yazarsınız, çocuk hedefi ekranında görür, sayıya ulaşıldığında ikinize de haber verilir. Uygulama hiçbir şey satın almaz, sipariş etmez ve ödeme yöntemi istemez. Ödülü verip vermemek tamamen size kalmış.

EBEVEYN ALANI
Dört haneli bir kodun arkasında: bekleyen onaylar, haftalık özet, uygulamanın çocuğunuz hakkında ne öğrendiğinin düz Türkçe açıklaması, ekran alışkanlıkları için bir danışma ekranı ve tüm ayarlar.

YILDIZ TABLOSU
İsterseniz çocuğunuz için bir kullanıcı adı seçersiniz. Çocuğunuz yalnızca sizin kodla eklediğiniz oyun arkadaşlarıyla bu haftanın yıldızlarında yarışır. Sohbet yok, mesaj yok, arama yok. İstemezseniz hiçbir şey gönderilmez ve puan telefonda kalır.

NE YOK
Reklam yok. Uygulama içi satın alma yok. Takip yok. Başka çocuklarla sohbet yok. Konum izni yok, mikrofon izni yok, rehber izni yok.

VERİ
Her şey telefonda kalır. Tek istisna, siz açarsanız yıldız tablosudur: sunucumuzda yalnızca kullanıcı adı ve tablodaki sayılar tutulur. Uygulamayı silmek telefondaki veriyi siler. Ebeveyn alanından her şeyi tek dokunuşla silebilir veya dışa aktarabilirsiniz.

YAPAY ZEKÂ HAKKINDA
Görev kütüphanesi kurallara dayalıdır ve çevrimdışı çalışır; ebeveyn her görevi önceden görebilir. Üç yerde dil modeli kullanılır: karakterle sohbet, ebeveyn danışma ekranı ve "sürpriz görev". Üçü de gönderim öncesi filtre, katı güvenlik eşikleri ve cevap sonrası ikinci bir kontrolden geçer.

Türkçe, İngilizce ve Azerbaycanca.
3-13 yaş için tasarlandı. Kurulumu ebeveyn yapar.
```

**English**

```
Your child gets bored and asks for the phone. Taking it away does not work, because nothing takes its place.

ScreenLess turns that around. The character on the screen is the one sending the child away from it. The reward comes back through the screen afterwards.

HOW IT WORKS
Your child picks a buddy and names it. Each day the buddy hands out one short mission matched to their age and interests: ten minutes of moving about, helping in the kitchen, a drawing, a lap of the garden. When it is done the child taps "I did it", you confirm, and the buddy grows.

ROOM SCAN
Point the camera at the room. The app recognises what is there on the phone itself (a ball, a book, a pillow, a pencil) and builds a mission around things the child already owns. No image leaves the phone, nothing is uploaded, and only a list of object names survives the scan.

REAL REWARDS
You decide: an ice cream at 100 stars, the toy at 150. Write the promise in the parent area, your child sees the goal on their screen, and you are both told when the number is reached. The app buys nothing, orders nothing and asks for no payment method. Whether the reward is given is entirely your call.

PARENT AREA
Behind a four digit code: missions waiting for approval, a weekly summary, a plain-language account of what the app has worked out about your child, a coach screen for questions about screen habits, and every setting.

FRIENDS BOARD
If you like, you pick a username for your child, and they race for this week's stars with the friends you add by code. No chat, no messages, no search. Say no and nothing is sent: the score stays on the phone.

WHAT IS NOT HERE
No ads. No in-app purchases. No tracking. No chat with other children. No location permission, no microphone permission, no contacts permission.

DATA
Everything stays on the phone. The one exception is the friends board, if you turn it on: our server keeps only the username and the numbers on the board. Deleting the app deletes the data on the phone, and the parent area can export or erase all of it in one tap.

ABOUT THE AI
The mission library is rule based and works offline, and a parent can read every mission in it. A language model is used in three places: the buddy chat, the parent coach and the "surprise mission". All three run behind an input filter, strict safety thresholds and a second check on the reply before a child sees it.

Turkish, English and Azerbaijani.
Designed for ages 3 to 13. Set up by a parent.
```

### Category and tags

- Category: **Education** (Parenting is a reasonable alternative; Education matches the mission library better)
- Tags: Education, Parenting, Family, Creativity
- Contact email: `eminbaxishli514@gmail.com` (must match the privacy policy)
- Website: the GitHub Pages url is acceptable

---

## Release notes → "What's new in this release"

Play keeps these per language and per release, with a 500 character ceiling each.
The text below is for **1.1.0 (versionCode 4)**. Keep it about what a family would
notice; version numbers and refactors mean nothing to a parent reading the store.

**Turkish**

```
Yeni görev dalı: Doğa dedektifleri. 6-9 yaş için beş görev — yaprak karşılaştırma, dışarıdaki sesleri tanıma, bulut çizme, kuş gözlemi ve bir bitkiyi üç gün izleme. Evden çıkan her görevde veli onayı zorunlu; konum bilgisi hiçbir zaman kaydedilmiyor, ses hiçbir zaman kaydedilmiyor.

Ayrıca: çocuğun beğenmediği bir görev türü artık tamamen kaybolmuyor, yalnızca seyrekleşiyor.
```

**English**

```
A new strand of missions: Nature detectives. Five missions for ages 6-9 — comparing leaves, naming the sounds outside, drawing clouds, watching birds, and following one plant for three days. Every mission that leaves the house needs a parent's code. No location is ever recorded and no sound is ever recorded.

Also: a kind of mission your child turned down is now thinned out rather than dropped altogether.
```

**Azerbaijani**

```
Yeni tapşırıq qrupu: Təbiət detektivləri. 6-9 yaş üçün beş tapşırıq — yarpaqları müqayisə etmək, çöldəki səsləri tanımaq, buludları çəkmək, quşları müşahidə etmək və bir bitkini üç gün izləmək. Evdən kənara çıxan hər tapşırıqda valideyn təsdiqi məcburidir. Yer məlumatı heç vaxt saxlanmır, səs heç vaxt yazılmır.

Bundan başqa: uşağın bəyənmədiyi tapşırıq növü artıq tamamilə yox olmur, sadəcə seyrəkləşir.
```

---

## Mission library, for a reviewer who asks

The full list lives in `src/data/` and is checked by `scripts/test-tasks.ts`
(`npm run test:tasks`). **214 missions**, of which 140 are the age curriculum:

| Band | Strands | Missions | Who checks it |
| --- | --- | --- | --- |
| 3–5 | 8 (colour and shape, movement, senses, making, talking, with a grown up, small jobs, feelings) | 40 | The parent confirms every one. Nothing is approved without them |
| 6–9 | 10 (adventure, movement games, make and build, home hero, thinking, books, family games, **nature detectives**, kindness, super team) | 50 | The phone checks the ordinary case; the parent audits a sample. Nature missions that go outside always need the parent code |
| 10–13 | 10 (goals, physical wellbeing, real life projects, contributing at home, reading and critical thinking, creativity, social connection, digital self-awareness, attention and emotion, doing something for others) | 50 | Self-report plus behaviour data, with the parent reading the log afterwards rather than approving item by item |

The remaining 74 are 56 interest-led missions shared across bands, ten activity
missions and eight parent-and-child missions. Every mission is locked to the bands listed on
it, so no child is ever offered one written for another age.
