# How can I accept WooCommerce payments with my bunq account?

**Source:** https://help.bunq.com/articles/how-can-i-accept-woocommerce-payments-with-my-bunq-account
**Topics:** Account, Payments

---

**Hey bunqers 🌈,**

Thanks to one of our amazing users, Patrick Kivits, you can now **accept payments in your WooCommerce store effortlessly using your Business account** – no third-party payment providers required. WooCommerce is a free WordPress plugin that helps you turn your website into an online store, making it perfect for small businesses.

Patrick developed this integration himself, and we’re incredibly grateful he’s shared it with the community. If you’re a builder or coder, why not follow in his footsteps and create something awesome with our API? We’d love to see what you come up with! Learn more on how to share your projects [here](<https://www.bunq.com/developers>).

## How can I set this up in my WooCommerce account?

**🔧 Installation**

  1. Download the latest version of the plugin (ZIP file) [here](<https://github.com/patrickkivits/bunq-for-woocommerce/tree/master>). 

  2. Go to your WordPress dashboard and click on Plugins > Add New.

  3. Click Upload Plugin at the top.

  4. Upload the ZIP file you just downloaded and activate the plugin.

**⚙️ Configuration**

  1. In your WordPress dashboard, go to WooCommerce > Settings > Payments > bunq.

  2. Open your bunq app and navigate to: Profile > Security & Preferences > Developers > OAuth > Add Redirect URL.

  3. Paste the full URL of the plugin settings page (e.g. https://example.com/wp-admin/admin.php?page=wc-settings&tab=checkout&section=bunq).

  4. In the bunq app, go to: Profile > Security & Preferences > Developers > OAuth > Show Client Details.

  5. Copy the Client ID and Client Secret into the plugin settings in WordPress, then click Save changes.

  6. Tap on OAuth Authorization Request in the plugin settings to authorize it. You’ll be redirected to the bunq website.

  7. Scan the QR code using the bunq app and choose the bank accounts you'd like to connect.

  8. After confirming in the app, you’ll be sent back to the plugin settings page.

  9. Select your bank account, enable the plugin, and click Save changes.

You can access a demo WooComerce store with the integration [here](<https://bunq-for-woocommerce.patrickkivits.com/>).

## Who can use this integration?

**Bunq Elite and Pro users with a verified Business account and a WooCommerce store** can connect both seamlessly to streamline their workflow.

Loading...

[Back to Knowledge](<../categories/knowledge>)

### Topics

[Account](<../topics/account>)

[Payments](<../topics/payments>)

### Other Categories

[Knowledge](<../categories/knowledge>)

[Features](<../categories/features>)

[Promotions](<../categories/promotions>)

[Troubleshooting](<../categories/troubleshooting>)

[Announcements](<../categories/announcements>)

[Changelog](<../categories/changelog>)