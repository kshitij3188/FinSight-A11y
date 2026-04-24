# Security bulletin: attempted card misuse via merchant tokenization

**Source:** https://help.bunq.com/articles/security-bulletin-attempted-card-misuse-via-merchant-tokenization
**Topics:** Security

---

### Summary

bunq discovered malicious attempts to obtain bank card details at a merchant through Mastercard’s tokenization services and reported this to Mastercard. The attackers used brute-force tactics to identify valid card details during tokenization attempts on merchants lacking certain controls. When successful, the card number (“PAN”) and expiry date were misused for low-value payment attempts through merchant accounts that do not capture the card’s CVC (three-digit code on the card) and 3DS (two-factor authentication) checks. Mastercard confirmed to bunq that the issue affects several banks and is working with the impacted merchant to remedy the situation for all affected banks and their users.

### Incident in more detail

  * Fraudsters exploited non-compliant merchants in Mastercard’s tokenization process by firing off large volumes of card data (e.g., PAN and expiry date) in rapid succession to test card credentials without a CVC or 3DS.

  * Controls against brute-force attempts were insufficient at the impacted merchant, which led to attackers being able to confirm valid PAN/expiry date combinations. Mastercard has also confirmed it is working closely with acquirers (banks of merchants) to improve merchant controls and reduce similar card testing attacks.

  * Subsequently, attempts were made to use these credentials to make low-value payment attempts via merchants that don’t require CVC, in regions where 3DS is not mandatory.

  * bunq’s systems were not impacted and remain fully secure. A limited number of users were targeted by fraudulent payment attempts, which were detected by bunq’s monitoring systems.

### Mitigation

  * bunq reported this issue to Mastercard through its responsible disclosure process. Mastercard told bunq it has zero tolerance for fraud, has notified the merchants of the misuse on behalf of its bank partners, and is working with the merchants’ acquirers to ensure compliance with network rules.

  * All affected users have been fully reimbursed, and to protect them from future abuse, new cards have been issued. bunq has implemented additional monitoring to detect anomalies in merchants’ tokenization requests.

  * Mastercard has informed bunq that when card testing incidents occur, it works with all ecosystem stakeholders to help mitigate the issue. However, because tokenization patterns are unpredictable, routine blocks and limits cannot always be imposed. bunq has monitoring and alerting in place to protect cardholders, but cannot introduce its own rate limits without blocking legitimate merchants and potentially impacting the user experience. As a short-term measure, the most effective step is to disable tokenization at certain merchants, which may mean some users are temporarily unable to set up recurring card payments there.

Loading...

[Back to Knowledge](<../categories/knowledge>)

### Topics

[Security](<../topics/security>)

### Other Categories

[Knowledge](<../categories/knowledge>)

[Features](<../categories/features>)

[Promotions](<../categories/promotions>)

[Troubleshooting](<../categories/troubleshooting>)

[Announcements](<../categories/announcements>)

[Changelog](<../categories/changelog>)