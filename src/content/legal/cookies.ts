import { LegalContent, LEGAL_UPDATED, LEGAL_UPDATED_FR, p, list } from "./types";

const cookies: LegalContent = {
  en: {
    title: "Cookie Policy",
    updated: LEGAL_UPDATED,
    intro: [
      p(
        "This Cookie Policy explains how Playver Inc. (\"Playver\", \"we\") uses cookies and similar technologies on our website and app (the \"Service\"), and the choices available to you. It should be read together with our Privacy Policy."
      ),
    ],
    sections: [
      {
        id: "what-are-cookies",
        heading: "1. What cookies are",
        blocks: [
          p(
            "Cookies are small text files placed on your device when you visit a website. Similar technologies include local storage and session storage, which browsers use to remember information between visits. We use these terms together as \"cookies\" in this Policy."
          ),
        ],
      },
      {
        id: "types",
        heading: "2. Cookies we use",
        blocks: [
          list([
            "Strictly necessary cookies: required for core functionality, such as keeping you signed in, remembering your language preference, and protecting the security of your session. The Service cannot function properly without these, and they cannot be switched off.",
            "Functional and performance cookies: help us understand how the Service is used so we can fix issues and improve features.",
          ]),
          p(
            "Playver does not currently use third-party advertising cookies or sell information collected through cookies."
          ),
        ],
      },
      {
        id: "third-party",
        heading: "3. Cookies set by our providers",
        blocks: [
          p(
            "Some cookies on the Service may be set by third-party providers we rely on to operate the Service, such as our payment processor Stripe when you complete a wallet top-up or Connect onboarding. These providers' use of cookies is governed by their own privacy and cookie policies."
          ),
        ],
      },
      {
        id: "managing",
        heading: "4. Managing cookies",
        blocks: [
          p(
            "Most browsers let you block or delete cookies through their settings. Because strictly necessary cookies are required for the Service to work (for example, to keep you signed in), blocking them may prevent parts of the Service from functioning properly."
          ),
        ],
      },
      {
        id: "changes",
        heading: "5. Changes to this Policy",
        blocks: [
          p(
            "We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for legal reasons. We will post the updated version with a new effective date."
          ),
        ],
      },
      {
        id: "contact",
        heading: "6. Contact us",
        blocks: [p("Questions about this Cookie Policy can be sent to playver@gmail.com.")],
      },
    ],
  },
  fr: {
    title: "Politique relative aux témoins",
    updated: LEGAL_UPDATED_FR,
    intro: [
      p(
        "La présente Politique relative aux témoins explique comment Playver Inc. (« Playver », « nous ») utilise des témoins et des technologies similaires sur notre site Web et notre application (le « Service »), ainsi que les choix qui s'offrent à vous. Elle doit être lue conjointement avec notre Politique de confidentialité."
      ),
    ],
    sections: [
      {
        id: "what-are-cookies",
        heading: "1. Que sont les témoins",
        blocks: [
          p(
            "Les témoins (« cookies ») sont de petits fichiers texte déposés sur votre appareil lorsque vous visitez un site Web. Les technologies similaires comprennent le stockage local et le stockage de session, que les navigateurs utilisent pour se souvenir de renseignements d'une visite à l'autre. Nous employons collectivement le terme « témoins » dans la présente Politique."
          ),
        ],
      },
      {
        id: "types",
        heading: "2. Témoins que nous utilisons",
        blocks: [
          list([
            "Témoins strictement nécessaires : requis pour les fonctionnalités essentielles, comme le maintien de votre connexion, la mémorisation de votre langue préférée et la protection de la sécurité de votre session. Le Service ne peut fonctionner correctement sans ces témoins, et ils ne peuvent être désactivés.",
            "Témoins fonctionnels et de performance : nous aident à comprendre comment le Service est utilisé afin de corriger des problèmes et d'améliorer les fonctionnalités.",
          ]),
          p(
            "Playver n'utilise actuellement aucun témoin publicitaire tiers et ne vend aucun renseignement recueilli au moyen de témoins."
          ),
        ],
      },
      {
        id: "third-party",
        heading: "3. Témoins déposés par nos fournisseurs",
        blocks: [
          p(
            "Certains témoins présents sur le Service peuvent être déposés par des fournisseurs tiers auxquels nous avons recours pour exploiter le Service, comme notre fournisseur de traitement des paiements Stripe lorsque vous effectuez une recharge de portefeuille ou une inscription à Connect. L'utilisation de témoins par ces fournisseurs est régie par leurs propres politiques de confidentialité et relatives aux témoins."
          ),
        ],
      },
      {
        id: "managing",
        heading: "4. Gérer les témoins",
        blocks: [
          p(
            "La plupart des navigateurs vous permettent de bloquer ou de supprimer les témoins par l'entremise de leurs paramètres. Étant donné que les témoins strictement nécessaires sont requis pour le bon fonctionnement du Service (par exemple, pour maintenir votre connexion), leur blocage peut empêcher certaines parties du Service de fonctionner correctement."
          ),
        ],
      },
      {
        id: "changes",
        heading: "5. Modifications de la présente Politique",
        blocks: [
          p(
            "Nous pouvons mettre à jour la présente Politique relative aux témoins de temps à autre afin de refléter des changements dans les témoins que nous utilisons ou pour des raisons juridiques. Nous publierons la version mise à jour accompagnée d'une nouvelle date d'entrée en vigueur."
          ),
        ],
      },
      {
        id: "contact",
        heading: "6. Nous joindre",
        blocks: [p("Toute question au sujet de la présente Politique relative aux témoins peut être envoyée à playver@gmail.com.")],
      },
    ],
  },
};

export default cookies;
