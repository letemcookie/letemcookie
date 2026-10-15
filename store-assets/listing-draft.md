# Let 'Em Cookie

Short description: No more cookie banners.

Let 'Em Cookie accepts cookie banners so you don't have to. It clicks the site's own accept-all button, with no popups injected into the page.

A banner gets through? Use "Pick missed banner" and point to the real accept-all button. Optional reporting opens a GitHub issue draft for you to review and submit yourself.

The cookie census: the homepage counts "cookies eaten," meaning cookie banners we observe disappear after accepting, not literal browser cookies. Counting is on by default for new installs and can be disabled in extension Settings. Existing installs get a one-time choice and stay off unless they agree. Each event sends a random retry ID to our Cloudflare server; the server uses a daily secret-keyed IP hash for approximate participating-connection counts and spam limits, and deletes temporary identifiers within two days. Our code does not store raw IPs. No visited site addresses, cookie contents, browsing history or persistent install ID is sent.

Some banners escape. An observed dismissal is not proof that a site saved consent. This is accept-all, not a privacy blocker, and it is not legal advice.

Free and open source. Privacy: https://letemcookie.com/privacy/
