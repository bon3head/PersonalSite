// Guestbook block lists (DESIGN 6.14 Shared marks, Filter). Files in
// api/ that start with an underscore are helpers, not functions.
//
// Matching (api/_filter.js): lowercase, accents folded, common
// number-for-letter swaps undone, then each whole word is checked, and
// again with repeated letters collapsed. STEMS also match inside a
// word, so keep them to strings that never occur in a normal name.
//
// The threat is ordinary spam (Justin, 2026-11-16). Add words to BLOCK
// in a PR; anything that slips through, close its issue.

// Spam terms: what comment spam sells.
export const BLOCK = [
  'casino', 'casinos', 'betting', 'bet365', 'viagra', 'cialis', 'porn', 'porno', 'xxx', 'onlyfans',
  'escort', 'escorts', 'crypto', 'bitcoin', 'btc', 'usdt', 'airdrop', 'forex', 'nft', 'nfts',
  'loan', 'loans', 'seo', 'backlink', 'backlinks', 'telegram', 'whatsapp', 'giveaway', 'followers',
];

// A basic profanity and slur list. Whole words.
export const PROFANITY = [
  'fuck', 'fucker', 'fucking', 'fucked', 'fuk', 'fck', 'motherfucker', 'shit', 'shitty', 'bullshit',
  'bitch', 'bitches', 'cunt', 'cunts', 'dicks', 'dickhead', 'cock', 'cocks', 'pussy',
  'asshole', 'assholes', 'arsehole', 'bastard', 'slut', 'sluts', 'whore', 'whores', 'wanker',
  'twat', 'prick', 'jizz', 'tits', 'boobs', 'dildo', 'rape', 'rapist', 'nazi', 'hitler',
  'kys', 'nigga', 'nigger', 'niggers', 'faggot', 'faggots', 'fag', 'fags', 'retard', 'retarded',
  'tranny', 'chink', 'spic', 'kike', 'wetback', 'dyke', 'coon', 'gook', 'paki', 'raghead',
];

// Matched inside words too (after the same folding).
export const STEMS = ['fuck', 'nigg', 'faggot', 'motherf', 'shithead'];
