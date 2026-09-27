# Chrome Web Store listing draft - review before publishing

Name: Let 'Em Cookie
Short description: No more cookie banners.

Detailed description:
Let 'Em Cookie clicks "Accept all" on cookie banners where it recognizes the button. OneTrust, Cookiebot, Quantcast, Didomi, TrustArc, Osano, CookieYes and Termly patterns are included, plus a cautious fallback for other cookie banners. Some banners will still escape.

After the first click you get a share screen with one ready-made line - "I hereby accept all cookies, forever. No need to ask me ever again." - to copy or post yourself. The popup counts clicks locally. If a banner gets through, "Pick missed banner" lets you click the real accept-all button yourself, and can open a prefilled GitHub issue draft that you review and submit by hand.

This is not legal advice or legal certification. Clicking is not proof that consent was saved by the site, and the count measures click attempts. Accept-all allows optional cookies and trackers. If privacy is your goal, this is not your extension.

Permissions and data:
- Access to all websites: needed to find and click banners across sites.
- Storage: the local count, first-notice state, and your report preference, stored in your browser only.
- No browsing history, URLs, page text, or screenshots are collected or sent anywhere. Missed-banner reports are GitHub drafts you submit yourself. No analytics or remote code.

Category: Productivity. Language: English. Website: https://letemcookie.com
Support: GitHub issues at https://github.com/letemcookie/letemcookie/issues

Suggested single-purpose statement: Find and click accept-all cookie banner buttons on websites the user visits.
Suggested permission justifications: `storage` stores the local count, first-notice state, and report preference; `<all_urls>` lets the content script detect banners on each website.

Store publication must be checked against Chrome's current dashboard fields and screenshots. This is draft copy, not posted.
