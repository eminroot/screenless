/**
 * English copy for the parent app.
 *
 * This file is the source of truth for the shape: `tr.ts` and `az.ts` are
 * typed against it, so a missing translation is a build error rather than a
 * blank label somebody notices in a demo.
 *
 * House rules for the writing, which are not stylistic preferences:
 *
 * - No exclamation marks. This screen sometimes tells a parent their child
 *   spent four hours on a phone, and cheerfulness there reads as mockery.
 * - Say the number, then what it means. Never the reverse.
 * - Never imply blame. "Screen time went up" is a fact; "screen time slipped"
 *   is a judgement about the parent.
 * - Nothing is ever "optimised", "powered by" or "seamless".
 */
export const en = {
  common: {
    appName: 'ScreenLess Parent',
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    saved: 'Saved',
    back: 'Back',
    retry: 'Try again',
    loading: 'One moment',
    close: 'Close',
    delete: 'Delete',
    remove: 'Remove',
    done: 'Done',
    today: 'Today',
    noData: 'Nothing reported yet',
    hoursMinutes: '{{hours}}h {{minutes}}m',
    minutesOnly: '{{minutes}}m',
    minutesShort: '{{count}} min',
  },

  error: {
    unconfigured: 'This build has no server address, so it cannot sign in.',
    network: 'Could not reach the server. Check the connection and try again.',
    timeout: 'The server took too long. Try again.',
    unauthorized: 'That email and password do not match.',
    taken: 'There is already an account with that address.',
    invalid: 'Something in that form was not accepted.',
    notFound: 'That is no longer there.',
    full: 'That is as many children as one account holds.',
    rateLimited: 'Too many tries. Wait a minute.',
    server: 'The server had a problem. Try again shortly.',
    shortPassword: 'Ten characters or more.',
    badEmail: 'That does not look like an email address.',
  },

  auth: {
    title: 'ScreenLess',
    subtitle: 'See how your children are doing, and set the daily limit from here.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordHint: 'Ten characters or more. Length beats punctuation.',
    nameLabel: 'Your name',
    nameHint: 'Optional. Only you ever see it.',
    signIn: 'Sign in',
    signingIn: 'Signing in',
    register: 'Create an account',
    registering: 'Creating',
    toRegister: 'No account yet? Create one',
    toSignIn: 'Already have an account? Sign in',
    privacy:
      'Your children’s phones send counts only. Names, photos, messages and anything they write stay on their own device.',
  },

  children: {
    title: 'Children',
    add: 'Add a child',
    emptyTitle: 'No children yet',
    emptyBody: 'Add one here, then type the code it gives you into ScreenLess on their phone.',

    addTitle: 'Add a child',
    nameLabel: 'Name',
    nameHint: 'Only you see this. It is never sent to their phone.',
    ageLabel: 'Age',
    age35: '3 to 5',
    age69: '6 to 9',
    age1013: '10 to 13',
    create: 'Add',
    creating: 'Adding',

    pairTitle: 'Link {{name}}’s phone',
    pairBody:
      'On their phone, open ScreenLess, go to the parent area and choose Parent dashboard. Type this code there.',
    pairExpires: 'The code lasts half an hour.',
    newCode: 'New code',
    pairDone: 'Done',

    notPaired: 'Waiting for their phone',
    notPairedBody: 'Nothing arrives until the code is typed in.',
    lastSeen: 'Last report {{when}}',
    neverReported: 'Nothing reported yet',
    levelStreak: 'Level {{level}} · {{streak}} day streak',
    noStreak: 'Level {{level}}',
    todayScreen: '{{time}} on screen today',
    todayMissions: '{{count}} missions today',

    removeTitle: 'Remove {{name}}?',
    removeBody: 'Their history here is deleted and their phone stops reporting. Nothing on the phone itself changes.',
  },

  dash: {
    week: 'Week',
    month: 'Month',
    quarter: '3 months',

    screenTime: 'Screen time',
    screenTimePerDay: 'a day',
    missions: 'Missions',
    active: 'Active',
    steps: 'Steps',
    balance: 'Off-screen share',
    balanceBody: 'Active minutes against screen minutes.',
    streak: 'Streak',
    streakDays: '{{count}} days',

    up: 'up {{percent}}%',
    down: 'down {{percent}}%',
    flat: 'about the same',
    vsPrevious: 'vs the {{days}} days before',
    noCompare: 'No earlier period to compare',

    reportedDays: 'From {{reported}} of {{total}} days',
    reportedOne: 'From one day',
    gapNote: 'Days the phone did not report are left blank rather than counted as zero.',

    dailyTitle: 'Day by day',
    dailyLegendScreen: 'Screen',
    dailyLegendActive: 'Active',
    dailyLegendMissions: 'Missions',
    dailyLegendOver: 'Over the limit',

    weekdayTitle: 'By day of the week',
    weekdayBody: 'Most families find one or two days carry the whole problem.',
    weekdayHeaviest: '{{day}} is the heaviest, at {{time}} on average.',

    categoryTitle: 'What they chose',
    categoryBody: 'Missions finished, by kind.',
    catMove: 'Moving',
    catOutdoor: 'Outdoors',
    catCreate: 'Making',
    catSocial: 'With people',
    catCalm: 'Quiet',

    remindersTitle: 'Reminders',
    remindersBody: '{{shown}} shown, {{heeded}} followed by a mission.',
    remindersRate: '{{percent}}% led somewhere',
    remindersNone: 'No reminders have fired in this period.',

    limitTitle: 'The limit',
    limitOff: 'No limit set',
    limitSet: '{{time}} a day, {{tier}}',
    overLimitDays: 'Over on {{count}} of {{reported}} days',
    withinLimit: 'Within the limit every day',
    editLimit: 'Change the limit',

    bestTitle: 'Best days',
    bestMissions: '{{count}} missions on {{date}}',
    bestSteps: '{{count}} steps on {{date}}',

    emptyTitle: 'Nothing here yet',
    emptyBody: 'Once their phone has reported a day, the charts fill in.',
  },

  send: {
    title: 'Send something',
    open: 'Send something',
    delay: 'Anything you send here arrives the next time they open the app, not straight away.',

    noteLabel: 'A note',
    notePlaceholder: 'Granny is coming at five',
    noteHint: 'One line. They answer with a button, not by typing.',
    noteSend: 'Send the note',
    noteSent: 'Sent',
    noteWaiting: 'Waiting for them to read it',
    replyOk: 'They said okay',
    replyDone: 'They said done',
    replyThanks: 'They said thank you',
    replyLater: 'They said not now',

    rewardLabel: 'Promise a reward',
    rewardPlaceholder: 'Cinema on Saturday',
    rewardStars: 'Stars needed',
    rewardAdd: 'Promise it',
    rewardGiven: 'Given',
    rewardMarkGiven: 'Mark as given',
    rewardNone: 'Nothing promised yet.',
    rewardFull: 'That is as many as one child can have at once.',

    missionLabel: 'Pick a mission',
    missionSearch: 'Search the missions',
    missionWaiting: 'Waiting on their phone',
    missionTaken: 'They added it to their list',
    missionClear: 'Take it back',
    missionDuo: 'Needs you in the room',
    missionNone: 'No mission sent.',
  },
  limits: {
    title: 'Daily limit',
    subtitle: 'Set it here and it reaches their phone the next time the app opens.',

    enabledLabel: 'Limit is on',
    enabledOff: 'Nothing is counted against a limit and nothing is blocked.',

    budgetLabel: 'Minutes a day',
    budgetBody: 'Across the apps a grown up picked on their phone, together rather than each.',

    tierLabel: 'What happens at the limit',
    tierOff: 'Nothing',
    tierNotice: 'Warn only',
    tierInterrupt: 'Cover it, with a way back',
    tierBlock: 'Cover it until tomorrow',
    tierOffBody: 'Time is still counted. Nothing is ever covered.',
    tierNoticeBody: 'A notification at three quarters and again at the limit.',
    tierInterruptBody: 'Past the limit the app is covered. They can buy a few more minutes, a few times a day.',
    tierBlockBody: 'Past the limit it stays covered until tomorrow, or until you lift it.',

    nudgeLabel: 'Remind them every',
    nudgeOff: 'Off',
    nudgeBody:
      'A quiet notification while those apps are open, with one thing to go and do instead. Written for their age. It works with or without a limit.',

    curfewLabel: 'Quiet hours',
    curfewNone: 'None',
    curfewSet: '{{start}} to {{end}}',
    curfewBody: 'Always enforced inside this window, whatever is left of the budget.',
    curfewFrom: 'From',
    curfewTo: 'To',

    appsNote:
      'Which apps are watched is chosen on the child’s own phone, from the apps actually installed on it. It cannot be set from here.',

    saveChanges: 'Save',
    savingChanges: 'Saving',
  },

  settings: {
    title: 'Settings',
    account: 'Account',
    languageLabel: 'Language',
    signOut: 'Sign out',
    signOutTitle: 'Sign out?',
    signOutBody: 'Your children’s phones keep reporting. You just stop seeing it here.',

    deleteTitle: 'Delete this account',
    deleteBody:
      'Every child, every day of history and every limit is deleted. Their phones stop reporting. Nothing on the phones themselves is touched.',
    deleteConfirm: 'Type your password to confirm',
    deleteAction: 'Delete everything',
    deleted: 'Account deleted',

    aboutTitle: 'What this app can see',
    aboutBody:
      'Minutes of screen time, missions finished, stars, steps and how many reminders were shown. That is the whole list. Names, photos, messages, drawings and anything a child writes never leave their phone, and the server has nowhere to put them.',
  },
} as const;

type Tree = typeof en;

/**
 * The shape every locale fills, with the leaves widened to `string`.
 *
 * `en` is `as const`, so without this widening each leaf would be its own
 * literal type and a Turkish translation would fail to be assignable to the
 * English sentence it replaces.
 */
export type Copy = {
  [Section in keyof Tree]: { [Key in keyof Tree[Section]]: string };
};
