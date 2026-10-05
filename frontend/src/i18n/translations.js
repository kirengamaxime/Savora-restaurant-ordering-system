// UI copy translations for the customer-facing screens (Welcome, Menu, Dish
// Detail, Cart, Checkout, Confirmation, Orders, Track). The admin dashboard
// is staff-only and stays in English.
//
// Note: this covers app "chrome" (buttons, labels, statuses) — not the
// dish names/descriptions themselves, which come from the restaurant's own
// menu data (see backend/data/menu.js) and would need their own translated
// fields to localize. The Kinyarwanda and French copy here is a solid
// starting point but hasn't been reviewed by a native-speaking proofreader —
// worth a native-speaker pass before this goes in front of real customers.

export const translations = {
  EN: {
    nav: { menu: "Menu", orders: "Orders" },
    orderType: { dineIn: "Dine In", takeAway: "Take Away" },
    common: { table: "Table", without: "No" },
    welcome: {
      tagline: "Welcome",
      subtitle: "Order and pay from your screen — no waiting for a waiter",
      orderingForTable: "Ordering for Table {n}",
      startOrder: "Start Order"
    },
    menu: {
      searchPlaceholder: "Search dishes...",
      noMatch: 'No dishes match "{query}".',
      tableNumberPrompt: "What's your table number?",
      tableNumberHint: "Tap the table where you're seated.",
      tableNumberPlaceholder: "e.g. 12",
      soldOut: "Sold out",
      viewOrder: "View order",
      items: "items",
      item: "item"
    },
    dish: {
      backToMenu: "Back to Menu",
      customize: "Remove ingredients",
      removeHint: "Switch off anything you'd like removed.",
      included: "included",
      removed: "removed",
      quantity: "Quantity",
      specialInstructions: "Special instructions",
      specialInstructionsPlaceholder: "e.g. extra lime, cut in half",
      addToOrder: "Add to order"
    },
    cart: {
      title: "Your Order",
      empty: "Your order is empty. Head back to the menu to add something delicious.",
      total: "Total",
      checkout: "Proceed to Checkout"
    },
    checkout: {
      title: "Checkout",
      backToOrder: "Back to Order",
      nameForPickup: "Name for pickup",
      namePlaceholder: "e.g. Uwase",
      paymentMethod: "Payment method",
      momo: "MTN Mobile Money",
      momoSub: "078••• or 079•••",
      airtel: "Airtel Money",
      airtelSub: "072••• or 073•••",
      card: "Debit / Credit Card",
      cardSub: "Visa, Mastercard",
      cash: "Cash at Counter",
      cashSub: "Pay at the counter",
      phoneForPayment: "Phone number for payment prompt",
      phonePlaceholder: "07XX XXX XXX",
      invalidMomoPhone: "Enter a valid MTN number (078XXXXXXX or 079XXXXXXX)",
      invalidAirtelPhone: "Enter a valid Airtel number (072XXXXXXX or 073XXXXXXX)",
      total: "Total",
      pay: "Pay {amount}",
      confirmingPayment: "Confirming payment",
      checkPhone: "Check your phone and approve the {amount} {method} request",
      processing: "Processing…",
      paymentFailed: "Payment wasn't approved in time. You can try again below."
    },
    confirmation: {
      orderPlaced: "Order placed",
      thankYou: "Thank you!",
      sentToKitchen: "Order #{id} has been sent to the kitchen.",
      bringToTable: "We'll bring it to Table {n}.",
      callForPickup: "We'll call you when it's ready for pickup.",
      trackTitle: "Track your order",
      trackHint: "Watch its status live — no app or login needed.",
      trackOpenButton: "Open Tracking Page",
      trackCopyButton: "Copy Link",
      trackCopied: "Copied!",
      newOrder: "Start a New Order",
      returning: "Returning to welcome screen in {n}s…"
    },
    orders: {
      title: "Your Orders",
      loading: "Loading…",
      empty: "You haven't placed any orders from this device yet.",
      startOrder: "Start an Order",
      statusAwaitingPayment: "Awaiting payment",
      statusPaymentFailed: "Payment failed",
      statusReceived: "Received",
      statusPreparing: "Preparing",
      statusReady: "Ready",
      statusServed: "Served",
      statusCancelled: "Cancelled",
      orderAgain: "Order Again"
    },
    track: {
      notFoundTitle: "This tracking link isn't valid",
      notFoundBody: "It may have expired, or the link was typed incorrectly.",
      orderDetails: "Order details",
      closeNote: "This page updates automatically — feel free to close it and check back later.",
      statusReceived: "Your order has been received by the kitchen.",
      statusPreparing: "Your order is being prepared.",
      statusReadyDineIn: "Your order is ready and on its way to your table!",
      statusReadyTakeaway: "Your order is ready for pickup!",
      statusServedDineIn: "Enjoy your meal!",
      statusServedTakeaway: "Order picked up. Enjoy!",
      statusCancelledTitle: "This order was cancelled",
      statusCancelledReason: "Reason: {reason}",
      statusCancelledApology: "We're sorry for the inconvenience — please speak with staff if you have questions.",
      served: "Served",
      pickedUp: "Picked up"
    },
    help: {
      callButton: "Call for Help",
      sending: "Sending…",
      sent: "Help is on the way!",
      error: "Couldn't send your request — please try again."
    }
  },

  KN: {
    nav: { menu: "Ibiribwa", orders: "Ibyatumijwe" },
    orderType: { dineIn: "Kurya Aha", takeAway: "Gutwara" },
    common: { table: "Meza", without: "Nta" },
    welcome: {
      tagline: "Murakaza neza",
      subtitle: "Tumiza kandi wishyure uhereye kuri ecran — nta gutegereza umukozi",
      orderingForTable: "Utumiza ku Meza ya {n}",
      startOrder: "Tangira Gutumiza"
    },
    menu: {
      searchPlaceholder: "Shakisha ibiryo...",
      noMatch: 'Nta biryo bihuye na "{query}".',
      tableNumberPrompt: "Uri ku meza ki?",
      tableNumberHint: "Kanda ku meza uriho.",
      tableNumberPlaceholder: "urugero: 12",
      soldOut: "Byashize",
      viewOrder: "Reba icyo watumije",
      items: "ibintu",
      item: "ikintu"
    },
    dish: {
      backToMenu: "Subira ku Biribwa",
      customize: "Kuraho ibigize ifunguro",
      removeHint: "Zimya ikintu icyo ari cyo cyose ushaka gukurwaho.",
      included: "birimo",
      removed: "byakuweho",
      quantity: "Umubare",
      specialInstructions: "Amabwiriza yihariye",
      specialInstructionsPlaceholder: "urugero: ongeraho citron, gucamo kabiri",
      addToOrder: "Ongeraho icyo utumije"
    },
    cart: {
      title: "Icyo Watumije",
      empty: "Nta kintu ufite. Subira ku biribwa urebe icyiza wakwifuza.",
      total: "Igiteranyo",
      checkout: "Komeza wishyure"
    },
    checkout: {
      title: "Kwishyura",
      backToOrder: "Subira ku cyo watumije",
      nameForPickup: "Amazina yo kuzafata ifunguro",
      namePlaceholder: "urugero: Uwase",
      paymentMethod: "Uburyo bwo Kwishyura",
      momo: "MTN Mobile Money",
      momoSub: "078••• cyangwa 079•••",
      airtel: "Airtel Money",
      airtelSub: "072••• cyangwa 073•••",
      card: "Ikarita ya Banki",
      cardSub: "Visa, Mastercard",
      cash: "Amafaranga ku Ishami",
      cashSub: "Ishyura ku ishami",
      phoneForPayment: "Numero ya telefone yo kwishyuriraho",
      phonePlaceholder: "07XX XXX XXX",
      invalidMomoPhone: "Andika numero nyayo ya MTN (078XXXXXXX cyangwa 079XXXXXXX)",
      invalidAirtelPhone: "Andika numero nyayo ya Airtel (072XXXXXXX cyangwa 073XXXXXXX)",
      total: "Igiteranyo",
      pay: "Ishyura {amount}",
      confirmingPayment: "Kwemeza Kwishyura",
      checkPhone: "Reba kuri telefone yawe wemeze icyifuzo cya {amount} kuri {method}",
      processing: "Birimo gutunganywa…",
      paymentFailed: "Kwishyura ntibyemejwe mu gihe. Ushobora kongera kugerageza hano hepfo."
    },
    confirmation: {
      orderPlaced: "Icyifuzo cyoherejwe",
      thankYou: "Murakoze!",
      sentToKitchen: "Icyifuzo #{id} cyoherejwe mu gikoni.",
      bringToTable: "Tuzagizana ku Meza ya {n}.",
      callForPickup: "Tuzaguhamagara igihe cyaba cyiteguye.",
      trackTitle: "Kurikirana icyo watumije",
      trackHint: "Reba uko bigenda ako kanya — nta porogaramu cyangwa konti bisabwa.",
      trackOpenButton: "Fungura Ipaji Ikurikirana",
      trackCopyButton: "Koporora Link",
      trackCopied: "Byakoporowe!",
      newOrder: "Tangira Ikindi Cyifuzo",
      returning: "Turasubira ku ipaji itangira mu masegonda {n}…"
    },
    orders: {
      title: "Ibyo Watumije",
      loading: "Birimo gupakira…",
      empty: "Nta cyifuzo ufite uhereye kuri iyi mudasobwa.",
      startOrder: "Tangira Gutumiza",
      statusAwaitingPayment: "Bitegereje Kwishyura",
      statusPaymentFailed: "Kwishyura Byanze",
      statusReceived: "Byakiriwe",
      statusPreparing: "Birimo Gutegurwa",
      statusReady: "Biteguye",
      statusServed: "Byatanzwe",
      statusCancelled: "Byahagaritswe",
      orderAgain: "Ongera Utumize"
    },
    track: {
      notFoundTitle: "Iyi link ntabwo ikora",
      notFoundBody: "Ishobora kuba yararengeje igihe, cyangwa yanditswe nabi.",
      orderDetails: "Ibisobanuro by'icyifuzo",
      closeNote: "Iyi paji ikina ubwayo — ushobora kuyifunga ukazayireba nyuma.",
      statusReceived: "Icyifuzo cyawe cyakiriwe n'igikoni.",
      statusPreparing: "Icyifuzo cyawe kirimo gutegurwa.",
      statusReadyDineIn: "Icyifuzo cyawe kiteguye kandi kiragana ku meza yawe!",
      statusReadyTakeaway: "Icyifuzo cyawe kiteguye ngo ukifate!",
      statusServedDineIn: "Ifunguro ryiza!",
      statusServedTakeaway: "Icyifuzo cyafashwe. Ifunguro ryiza!",
      statusCancelledTitle: "Iki cyifuzo cyahagaritswe",
      statusCancelledReason: "Impamvu: {reason}",
      statusCancelledApology: "Turababajwe n'ibi — vugana n'abakozi niba ufite ikibazo.",
      served: "Byatanzwe",
      pickedUp: "Cyafashwe"
    },
    help: {
      callButton: "Hamagara Ubufasha",
      sending: "Kohereza…",
      sent: "Ubufasha buraje!",
      error: "Ntibyakunze kohereza icyifuzo — ongera ugerageze."
    }
  },

  FR: {
    nav: { menu: "Menu", orders: "Commandes" },
    orderType: { dineIn: "Sur Place", takeAway: "À Emporter" },
    common: { table: "Table", without: "Sans" },
    welcome: {
      tagline: "Bienvenue",
      subtitle: "Commandez et payez depuis votre écran — sans attendre un serveur",
      orderingForTable: "Commande pour la Table {n}",
      startOrder: "Commencer la Commande"
    },
    menu: {
      searchPlaceholder: "Rechercher un plat...",
      noMatch: 'Aucun plat ne correspond à "{query}".',
      tableNumberPrompt: "Quel est votre numéro de table ?",
      tableNumberHint: "Touchez la table où vous êtes assis.",
      tableNumberPlaceholder: "ex. 12",
      soldOut: "Épuisé",
      viewOrder: "Voir la commande",
      items: "articles",
      item: "article"
    },
    dish: {
      backToMenu: "Retour au Menu",
      customize: "Retirer des ingrédients",
      removeHint: "Désactivez tout ce que vous souhaitez retirer.",
      included: "inclus",
      removed: "retiré",
      quantity: "Quantité",
      specialInstructions: "Instructions spéciales",
      specialInstructionsPlaceholder: "ex. extra citron, coupé en deux",
      addToOrder: "Ajouter à la commande"
    },
    cart: {
      title: "Votre Commande",
      empty: "Votre commande est vide. Retournez au menu pour ajouter quelque chose de délicieux.",
      total: "Total",
      checkout: "Passer au Paiement"
    },
    checkout: {
      title: "Paiement",
      backToOrder: "Retour à la Commande",
      nameForPickup: "Nom pour le retrait",
      namePlaceholder: "ex. Uwase",
      paymentMethod: "Méthode de Paiement",
      momo: "MTN Mobile Money",
      momoSub: "078••• ou 079•••",
      airtel: "Airtel Money",
      airtelSub: "072••• ou 073•••",
      card: "Carte Bancaire",
      cardSub: "Visa, Mastercard",
      cash: "Espèces au Comptoir",
      cashSub: "Payer au comptoir",
      phoneForPayment: "Numéro de téléphone pour la demande de paiement",
      phonePlaceholder: "07XX XXX XXX",
      invalidMomoPhone: "Entrez un numéro MTN valide (078XXXXXXX ou 079XXXXXXX)",
      invalidAirtelPhone: "Entrez un numéro Airtel valide (072XXXXXXX ou 073XXXXXXX)",
      total: "Total",
      pay: "Payer {amount}",
      confirmingPayment: "Confirmation du paiement",
      checkPhone: "Vérifiez votre téléphone et approuvez la demande de {amount} sur {method}",
      processing: "Traitement en cours…",
      paymentFailed: "Le paiement n'a pas été approuvé à temps. Vous pouvez réessayer ci-dessous."
    },
    confirmation: {
      orderPlaced: "Commande envoyée",
      thankYou: "Merci !",
      sentToKitchen: "La commande #{id} a été envoyée en cuisine.",
      bringToTable: "Nous l'apporterons à la Table {n}.",
      callForPickup: "Nous vous appellerons dès qu'elle sera prête.",
      trackTitle: "Suivez votre commande",
      trackHint: "Suivez son statut en direct — aucune application ni connexion requise.",
      trackOpenButton: "Ouvrir la Page de Suivi",
      trackCopyButton: "Copier le Lien",
      trackCopied: "Copié !",
      newOrder: "Nouvelle Commande",
      returning: "Retour à l'écran d'accueil dans {n}s…"
    },
    orders: {
      title: "Vos Commandes",
      loading: "Chargement…",
      empty: "Vous n'avez passé aucune commande depuis cet appareil.",
      startOrder: "Commencer une Commande",
      statusAwaitingPayment: "En attente de paiement",
      statusPaymentFailed: "Paiement échoué",
      statusReceived: "Reçue",
      statusPreparing: "En préparation",
      statusReady: "Prête",
      statusServed: "Servie",
      statusCancelled: "Annulée",
      orderAgain: "Commander à Nouveau"
    },
    track: {
      notFoundTitle: "Ce lien de suivi n'est pas valide",
      notFoundBody: "Il a peut-être expiré, ou le lien a été mal saisi.",
      orderDetails: "Détails de la commande",
      closeNote: "Cette page se met à jour automatiquement — vous pouvez la fermer et revenir plus tard.",
      statusReceived: "Votre commande a été reçue par la cuisine.",
      statusPreparing: "Votre commande est en cours de préparation.",
      statusReadyDineIn: "Votre commande est prête et en route vers votre table !",
      statusReadyTakeaway: "Votre commande est prête à être récupérée !",
      statusServedDineIn: "Bon appétit !",
      statusServedTakeaway: "Commande récupérée. Bon appétit !",
      statusCancelledTitle: "Cette commande a été annulée",
      statusCancelledReason: "Raison : {reason}",
      statusCancelledApology: "Nous sommes désolés pour la gêne occasionnée — veuillez contacter le personnel si vous avez des questions.",
      served: "Servie",
      pickedUp: "Récupérée"
    },
    help: {
      callButton: "Appeler à l'aide",
      sending: "Envoi en cours…",
      sent: "L'aide arrive !",
      error: "Impossible d'envoyer la demande — veuillez réessayer."
    }
  }
};
